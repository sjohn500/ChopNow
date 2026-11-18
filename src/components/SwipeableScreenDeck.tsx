import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PointerEvent, ReactNode, useRef, useState } from 'react';
import { ScreenId } from '../types/delivery';

interface SwipeableScreenDeckProps {
  screens: {
    id: ScreenId;
    label: string;
    node: ReactNode;
  }[];
  activeScreen: ScreenId;
  onChangeScreen: (id: ScreenId) => void;
}

export function SwipeableScreenDeck({
  screens,
  activeScreen,
  onChangeScreen,
}: SwipeableScreenDeckProps) {
  const activeIndex = Math.max(
    0,
    screens.findIndex((s) => s.id === activeScreen)
  );

  const dragStartRef = useRef<{
    x: number;
    y: number;
    active: boolean;
    lockedAxis: 'none' | 'x' | 'y';
  }>({ x: 0, y: 0, active: false, lockedAxis: 'none' });

  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement | null;
    if (
      target?.closest(
        'button, input, textarea, select, a, [data-no-swipe="true"]'
      )
    ) {
      return;
    }
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      active: true,
      lockedAxis: 'none',
    };
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    const state = dragStartRef.current;
    if (!state.active) return;

    const dx = e.clientX - state.x;
    const dy = e.clientY - state.y;

    if (state.lockedAxis === 'none') {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.25) {
        state.lockedAxis = 'x';
        setIsDragging(true);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Ignore if pointer capture is unavailable
        }
      } else if (Math.abs(dy) > 10) {
        state.lockedAxis = 'y';
        return;
      }
    }

    if (state.lockedAxis === 'x') {
      const atStart = activeIndex === 0 && dx > 0;
      const atEnd = activeIndex === screens.length - 1 && dx < 0;
      const damped = atStart || atEnd ? dx * 0.25 : dx;
      setDragOffsetPx(damped);
    }
  }

  function finishDrag(e: PointerEvent<HTMLDivElement>) {
    const state = dragStartRef.current;
    if (!state.active) return;

    const dx = e.clientX - state.x;
    const wasHorizontal = state.lockedAxis === 'x';

    dragStartRef.current.active = false;
    dragStartRef.current.lockedAxis = 'none';
    setIsDragging(false);
    setDragOffsetPx(0);

    if (!wasHorizontal) return;

    if (dx < -52 && activeIndex < screens.length - 1) {
      onChangeScreen(screens[activeIndex + 1].id);
    } else if (dx > 52 && activeIndex > 0) {
      onChangeScreen(screens[activeIndex - 1].id);
    }
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        className="relative flex-1 touch-pan-y overflow-hidden select-none"
      >
        <div
          style={{
            transform: `translate3d(calc(-${activeIndex * (100 / screens.length)}% + ${dragOffsetPx}px), 0, 0)`,
            width: `${screens.length * 100}%`,
          }}
          className={`flex h-full ${
            isDragging
              ? ''
              : 'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
          }`}
        >
          {screens.map((screen) => (
            <div
              key={screen.id}
              style={{ width: `${100 / screens.length}%` }}
              className="h-full shrink-0 overflow-hidden"
            >
              {screen.node}
            </div>
          ))}
        </div>
      </div>

      <div className="z-30 flex items-center justify-between border-t border-[#E6DDD3] bg-white/95 px-4 pt-2 pb-5 backdrop-blur-md">
        <button
          type="button"
          disabled={activeIndex === 0}
          onClick={() =>
            activeIndex > 0 && onChangeScreen(screens[activeIndex - 1].id)
          }
          aria-label="Previous screen"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F4E8D6] text-[#1E1916] transition-colors active:bg-[#E8D5B7] disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1.5">
          {screens.map((s, idx) => {
            const isCurrent = idx === activeIndex;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onChangeScreen(s.id)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors ${
                  isCurrent
                    ? 'bg-[#D9232E] text-white'
                    : 'bg-[#F4E8D6]/80 text-[#5C5049] hover:text-[#1E1916]'
                }`}
              >
                {idx + 1}. {s.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={activeIndex === screens.length - 1}
          onClick={() =>
            activeIndex < screens.length - 1 &&
            onChangeScreen(screens[activeIndex + 1].id)
          }
          aria-label="Next screen"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F4E8D6] text-[#1E1916] transition-colors active:bg-[#E8D5B7] disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
