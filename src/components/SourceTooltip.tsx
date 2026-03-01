import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { DATA_SOURCES } from '../data/constants';
import type { SortableField } from '../types/model';

interface SourceTooltipProps {
  field: SortableField;
  children: ReactNode;
}

const SourceTooltip = ({ field, children }: SourceTooltipProps) => {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  const handleEnter = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: rect.left + rect.width / 2, y: rect.top });
  }, []);

  const handleLeave = useCallback(() => {
    setPos(null);
  }, []);

  useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    window.addEventListener('scroll', close, { passive: true, capture: true });
    window.addEventListener('resize', close, { passive: true });
    return () => {
      window.removeEventListener('scroll', close, { capture: true });
      window.removeEventListener('resize', close);
    };
  }, [pos]);

  return (
    <span ref={ref} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      {pos &&
        createPortal(
          <span
            className="fixed pointer-events-none px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap bg-surface-tooltip text-text-tooltip shadow-sm z-50"
            style={{ left: pos.x, top: pos.y - 8, transform: 'translate(-50%, -100%)' }}
          >
            {DATA_SOURCES[field]}
          </span>,
          document.body,
        )}
    </span>
  );
};

export default SourceTooltip;
