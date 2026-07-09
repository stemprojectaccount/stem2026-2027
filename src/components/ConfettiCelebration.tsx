import React, { useEffect, useRef } from "react";

interface ConfettiCelebrationProps {
  duration?: number; // duration in milliseconds
}

export default function ConfettiCelebration({ duration = 5000 }: ConfettiCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let isRunning = true;

    // Set canvas sizes
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Particle class
    class ConfettiParticle {
      x: number;
      y: number;
      size: number;
      color: string;
      speedX: number;
      speedY: number;
      rotation: number;
      rotationSpeed: number;
      opacity: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        // Start slightly above screen
        this.y = Math.random() * -canvas.height - 20;
        this.size = Math.random() * 8 + 6;
        
        // Vibrant modern educational palette (indigo, violet, emerald, amber, rose, cyan)
        const colors = [
          "#4f46e5", // Indigo
          "#7c3aed", // Violet
          "#10b981", // Emerald
          "#f59e0b", // Amber
          "#f43f5e", // Rose
          "#06b6d4", // Cyan
          "#ec4899", // Pink
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        // Dynamic horizontal drift and vertical fall speed
        this.speedX = Math.random() * 4 - 2;
        this.speedY = Math.random() * 5 + 4;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 4 - 2;
        this.opacity = 1;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;
        
        // Slow sway horizontally
        this.speedX += Math.sin(this.y / 30) * 0.05;

        // If particle falls below screen, recycle it
        if (this.y > canvas.height) {
          this.y = -20;
          this.x = Math.random() * canvas.width;
          this.speedY = Math.random() * 5 + 4;
          this.opacity = 1;
        }
      }

      draw(c: CanvasRenderingContext2D) {
        c.save();
        c.translate(this.x, this.y);
        c.rotate((this.rotation * Math.PI) / 180);
        c.fillStyle = this.color;
        c.globalAlpha = this.opacity;
        
        // Draw confetti shape (rectangles, triangles, circles)
        const shapeType = Math.floor(this.x + this.y) % 3;
        if (shapeType === 0) {
          // Rectangle
          c.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
        } else if (shapeType === 1) {
          // Triangle
          c.beginPath();
          c.moveTo(0, -this.size / 2);
          c.lineTo(this.size / 2, this.size / 2);
          c.lineTo(-this.size / 2, this.size / 2);
          c.closePath();
          c.fill();
        } else {
          // Circle
          c.beginPath();
          c.arc(0, 0, this.size / 2, 0, Math.PI * 2);
          c.fill();
        }
        
        c.restore();
      }
    }

    // Initialize 120 confetti particles for screen fullness
    const particleCount = Math.min(150, Math.floor(window.innerWidth / 8) + 50);
    const particles: ConfettiParticle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new ConfettiParticle());
    }

    // Animation Loop
    const animate = () => {
      if (!isRunning) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.update();
        p.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    // Cleanup timers
    const cleanupTimeout = setTimeout(() => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
    }, duration);

    return () => {
      isRunning = false;
      clearTimeout(cleanupTimeout);
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [duration]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[100]"
      style={{ mixBlendMode: "multiply" }}
    />
  );
}
