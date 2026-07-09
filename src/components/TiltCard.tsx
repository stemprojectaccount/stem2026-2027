import React, { useState, useRef } from "react";

interface TiltCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export default function TiltCard({ children, onClick, className = "", id, disabled = false }: TiltCardProps) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element
    const y = e.clientY - rect.top;  // y position within the element
    setCoords({ x, y });
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    setIsHovered(false);
    setCoords({ x: 0, y: 0 });
  };

  // Calculate rotation angles
  let rotateX = 0;
  let rotateY = 0;
  let glareStyle: React.CSSProperties = {};

  if (isHovered && cardRef.current && !disabled) {
    const rect = cardRef.current.getBoundingClientRect();
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    // Max rotation 12 degrees
    rotateX = -((coords.y - yc) / yc) * 12;
    rotateY = ((coords.x - xc) / xc) * 12;

    // Interactive soft light glare effect
    glareStyle = {
      background: `radial-gradient(circle at ${coords.x}px ${coords.y}px, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 70%)`,
    };
  }

  const transformStyle: React.CSSProperties = disabled ? {} : {
    transform: isHovered
      ? `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`
      : "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
    transition: isHovered 
      ? "transform 0.1s ease-out, box-shadow 0.1s ease-out" 
      : "transform 0.5s ease-out, box-shadow 0.5s ease-out",
    transformStyle: "preserve-3d",
    boxShadow: isHovered
      ? "0 25px 45px -12px rgba(79, 70, 229, 0.22), 0 12px 20px -8px rgba(79, 70, 229, 0.15)"
      : "0 10px 30px -15px rgba(0, 0, 0, 0.06)",
  };

  return (
    <div
      id={id}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={disabled ? undefined : onClick}
      style={transformStyle}
      className={`relative select-none overflow-hidden ${className}`}
    >
      {/* Glare effect overlay */}
      {isHovered && !disabled && (
        <div
          className="absolute inset-0 pointer-events-none z-30 rounded-[2rem]"
          style={glareStyle}
        />
      )}
      {/* 3D Inner Content perspective layer (makes the text/content pop out) */}
      <div style={disabled ? {} : { transform: "translateZ(30px)", transformStyle: "preserve-3d" }} className="h-full flex flex-col justify-between w-full">
        {children}
      </div>
    </div>
  );
}
