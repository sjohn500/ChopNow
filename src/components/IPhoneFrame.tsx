import { ReactNode } from 'react';

interface IPhoneFrameProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  overlayStatusBar?: boolean;
  statusBarTone?: 'light' | 'dark';
  isHighlighted?: boolean;
}

export function IPhoneFrame({
  title,
  subtitle,
  children,
  overlayStatusBar = false,
  statusBarTone,
  isHighlighted = false,
}: IPhoneFrameProps) {
  const resolvedTone = statusBarTone ?? (overlayStatusBar ? 'light' : 'dark');

  return (
    <div className="flex flex-col items-center">
      {title && (
        <div className="mb-3 text-center">
          <p className="font-heading text-sm font-bold text-text-primary">
            {title}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-text-secondary">{subtitle}</p>
          )}
        </div>
      )}

      <div
        className={`relative w-full max-w-[375px] rounded-[46px] bg-text-primary p-[11px] transition-shadow duration-200 ${
          isHighlighted
            ? 'shadow-[0_24px_60px_-14px_rgba(244,180,0,0.30)]'
            : 'shadow-[0_24px_60px_-16px_rgba(44,34,30,0.22)]'
        }`}
      >
        <div className="relative flex h-[760px] w-full flex-col overflow-hidden rounded-[36px] bg-bg">
          <div
            className={`z-30 flex h-11 shrink-0 items-center justify-between px-6 pt-1 transition-colors duration-200 ${
              overlayStatusBar
                ? `pointer-events-none absolute top-0 right-0 left-0 ${
                    resolvedTone === 'light' ? 'text-white' : 'text-text-primary'
                  }`
                : 'bg-transparent text-text-primary'
            }`}
          >
            <span className="tabular-nums-clean text-[13px] font-semibold tracking-tight">
              9:41
            </span>

            <div
              aria-hidden="true"
              className="h-[24px] w-[92px] rounded-full bg-text-primary"
            />

            <div className="flex items-center gap-1.5" aria-hidden="true">
              <div className="flex items-end gap-[1.5px]">
                <span className="h-1.5 w-[2.5px] rounded-xs bg-current" />
                <span className="h-2 w-[2.5px] rounded-xs bg-current" />
                <span className="h-2.5 w-[2.5px] rounded-xs bg-current" />
                <span className="h-3 w-[2.5px] rounded-xs bg-current opacity-40" />
              </div>
              <div className="flex h-3 w-5 items-center rounded-[4px] border border-current p-[1.5px]">
                <div className="h-full w-3.5 rounded-[2px] bg-current" />
              </div>
            </div>
          </div>

          <div className="relative flex-1 overflow-hidden">{children}</div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 bottom-1.5 left-0 z-40 flex justify-center"
          >
            <div className="h-1 w-28 rounded-full bg-text-primary/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
