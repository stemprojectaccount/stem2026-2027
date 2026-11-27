import React, { useRef } from "react";

interface TiltCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export default function TiltCard({ children, onClick, className = "", id, disabled = false }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    if (disabled || !cardRef.current) return;
    rectRef.current = cardRef.current.getBoundingClientRect();
    cardRef.current.style.setProperty("--tilt-active", "1");
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !cardRef.current) return;
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = cardRef.current;
      if (!el) return;
      const rect = rectRef.current || el.getBoundingClientRect();
      rectRef.current = rect;

      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const xc = rect.width / 2 || 1;
      const yc = rect.height / 2 || 1;

      const rotateX = (-((y - yc) / yc) * 6).toFixed(2);
      const rotateY = (((x - xc) / xc) * 6).toFixed(2);
      const glareX = ((x / (rect.width || 1)) * 100).toFixed(1);
      const glareY = ((y / (rect.height || 1)) * 100).toFixed(1);

      el.style.setProperty("--tilt-rx", `${rotateX}deg`);
      el.style.setProperty("--tilt-ry", `${rotateY}deg`);
      el.style.setProperty("--glare-x", `${glareX}%`);
      el.style.setProperty("--glare-y", `${glareY}%`);
    });
  };

  const handleMouseLeave = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    rectRef.current = null;
    if (disabled || !cardRef.current) return;
    const el = cardRef.current;
    el.style.setProperty("--tilt-rx", "0deg");
    el.style.setProperty("--tilt-ry", "0deg");
    el.style.setProperty("--tilt-active", "0");
  };

  return (
    <div
      id={id}
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={disabled ? undefined : onClick}
      className={`lesson-tilt-stage relative select-none overflow-hidden ${className}`}
    >
      <div className="lesson-tilt-wrapper h-full w-full flex flex-col justify-between">
        <div className="lesson-tilt-glare pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 h-full flex flex-col justify-between w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
