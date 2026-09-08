import React, { useEffect, useRef } from 'react';

interface AnimatedSkyProps {
  isDark: boolean;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  speedY: number;
  opacity: number;
  twinkleSpeed: number;
}

interface Cloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
  opacity: number;
}

export const AnimatedSky: React.FC<AnimatedSkyProps> = ({ isDark }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initialize subtle floating particles/stars
    const particleCount = isDark ? 65 : 35;
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * (isDark ? 1.5 : 2) + 0.5,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: (Math.random() - 0.5) * 0.15,
        opacity: Math.random() * 0.7 + 0.2,
        twinkleSpeed: Math.random() * 0.015 + 0.005,
      });
    }

    // Initialize drifting clouds
    const clouds: Cloud[] = [
      { x: width * 0.1, y: height * 0.15, scale: 1.2, speed: 0.18, opacity: isDark ? 0.08 : 0.45 },
      { x: width * 0.6, y: height * 0.35, scale: 1.6, speed: 0.12, opacity: isDark ? 0.06 : 0.35 },
      { x: width * 0.3, y: height * 0.65, scale: 1.0, speed: 0.22, opacity: isDark ? 0.07 : 0.4 },
      { x: -100, y: height * 0.25, scale: 1.4, speed: 0.15, opacity: isDark ? 0.08 : 0.42 },
    ];

    const drawCloudShape = (cx: number, cy: number, scale: number, alpha: number) => {
      ctx.save();
      ctx.fillStyle = isDark ? `rgba(148, 163, 184, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
      ctx.filter = 'blur(28px)';
      ctx.beginPath();
      ctx.arc(cx, cy, 50 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 45 * scale, cy - 20 * scale, 45 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 90 * scale, cy, 40 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 40 * scale, cy + 15 * scale, 55 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    let time = 0;
    const render = () => {
      time += 0.02;

      // Draw Sky Gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      if (isDark) {
        // Twilight / Deep Midnight Sky
        gradient.addColorStop(0, '#090d16');
        gradient.addColorStop(0.4, '#0c1527');
        gradient.addColorStop(0.8, '#0f203c');
        gradient.addColorStop(1, '#081326');
      } else {
        // Daylight / Radiant Clear Sky
        gradient.addColorStop(0, '#dbeafe');
        gradient.addColorStop(0.4, '#e0f2fe');
        gradient.addColorStop(0.8, '#f0f9ff');
        gradient.addColorStop(1, '#f8fafc');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Atmospheric soft light glow
      const radialGlow = ctx.createRadialGradient(
        width * 0.5,
        height * 0.2,
        20,
        width * 0.5,
        height * 0.2,
        width * 0.8
      );
      if (isDark) {
        radialGlow.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
        radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        radialGlow.addColorStop(0, 'rgba(186, 230, 253, 0.4)');
        radialGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, width, height);

      // Render Drifting Clouds
      for (const cloud of clouds) {
        drawCloudShape(cloud.x, cloud.y, cloud.scale, cloud.opacity);
        cloud.x += cloud.speed;
        if (cloud.x - 200 * cloud.scale > width) {
          cloud.x = -250 * cloud.scale;
          cloud.y = Math.random() * (height * 0.7);
        }
      }

      // Render Particles / Stars
      for (const p of particles) {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const currentOpacity = p.opacity * (0.6 + 0.4 * Math.sin(time + p.x));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(224, 242, 254, ${currentOpacity})`
          : `rgba(14, 165, 233, ${currentOpacity * 0.5})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-10 transition-opacity duration-1000"
    />
  );
};
