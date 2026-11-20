import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import express, { type Request, type Response } from 'express';

const PORT = Number(process.env.PORT || 3000);
const PYTHON_HOST = process.env.PYTHON_BACKEND_HOST || '127.0.0.1';
const PYTHON_PORT = Number(process.env.PYTHON_BACKEND_PORT || 8765);
const IS_PROD = process.env.NODE_ENV === 'production';

let pythonProc: ChildProcess | null = null;

function startPythonBackend(): ChildProcess {
  const proc = spawn('python3', ['-u', '-m', 'backend'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PYTHONUNBUFFERED: '1',
      PYTHON_BACKEND_HOST: PYTHON_HOST,
      PYTHON_BACKEND_PORT: String(PYTHON_PORT),
    },
    stdio: 'inherit',
  });

  proc.on('exit', (code, signal) => {
    if (code !== null && code !== 0) {
      console.error(
        `[server.ts] Python backend exited unexpectedly (code=${code}, signal=${signal ?? 'none'})`
      );
    }
  });

  return proc;
}

async function waitForPythonReady(timeoutMs = 6000): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const ok = await new Promise<boolean>((resolve) => {
      const req = http.get(
        {
          hostname: PYTHON_HOST,
          port: PYTHON_PORT,
          path: '/api/health',
          timeout: 500,
        },
        (res) => {
          res.resume();
          resolve(res.statusCode === 200);
        }
      );
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    });
    if (ok) return;
    await new Promise((r) => setTimeout(r, 150));
  }
  console.warn('[server.ts] Timed out waiting for Python /api/health; requests will retry.');
}

function proxyToPython(req: Request, res: Response): void {
  const headers: http.OutgoingHttpHeaders = { ...req.headers };
  headers.host = `${PYTHON_HOST}:${PYTHON_PORT}`;

  const proxyReq = http.request(
    {
      hostname: PYTHON_HOST,
      port: PYTHON_PORT,
      path: req.originalUrl,
      method: req.method,
      headers,
    },
    (proxyRes) => {
      res.status(proxyRes.statusCode ?? 502);
      for (const [key, value] of Object.entries(proxyRes.headers)) {
        if (value !== undefined) {
          res.setHeader(key, value);
        }
      }
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    console.error('[server.ts] Python proxy error:', err.message);
    if (!res.headersSent) {
      res.status(503).json({
        error: `Python backend unreachable (${err.message}). Check Python logs above.`,
      });
    }
  });

  req.pipe(proxyReq);
}

async function main() {
  pythonProc = startPythonBackend();
  await waitForPythonReady();

  const app = express();

  // Forward all API calls and uploaded photos directly to the Python backend
  app.use('/api', proxyToPython);
  app.use('/uploads', proxyToPython);

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[ChopBellyFull] Port ${PORT} listening (${IS_PROD ? 'production' : 'dev'} -> Python API at http://${PYTHON_HOST}:${PYTHON_PORT})`
    );
  });

  const shutdown = () => {
    httpServer.close();
    if (pythonProc && !pythonProc.killed) {
      pythonProc.kill('SIGTERM');
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[server.ts] Fatal startup error:', err);
  if (pythonProc && !pythonProc.killed) {
    pythonProc.kill('SIGTERM');
  }
  process.exit(1);
});
