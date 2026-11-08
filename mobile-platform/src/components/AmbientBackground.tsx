import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  alphaSpeed: number;
}

export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let step = 0;

    // Generate floating ambient console starlight particles
    const particleCount = 42;
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.6 + 0.6,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -Math.random() * 0.45 - 0.15,
        alpha: Math.random() * 0.6 + 0.2,
        alphaSpeed: Math.random() * 0.015 + 0.005,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize, { passive: true });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = () => {
      step += 0.012;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw flowing console harmonic aurora ribbons
      const waveConfigs = [
        {
          amplitude: 45,
          wavelength: 0.0028,
          speed: step * 0.9,
          baseY: height * 0.68,
          colorStop1: 'rgba(56, 189, 248, 0.12)', // soft cyan
          colorStop2: 'rgba(99, 102, 241, 0.03)', // deep indigo
        },
        {
          amplitude: 60,
          wavelength: 0.0021,
          speed: -step * 0.7 + 2,
          baseY: height * 0.75,
          colorStop1: 'rgba(129, 140, 248, 0.10)', // violet
          colorStop2: 'rgba(56, 189, 248, 0.02)',
        },
        {
          amplitude: 35,
          wavelength: 0.0035,
          speed: step * 1.1 + 4,
          baseY: height * 0.82,
          colorStop1: 'rgba(14, 165, 233, 0.08)', // sky blue
          colorStop2: 'transparent',
        },
      ];

      for (const wave of waveConfigs) {
        ctx.beginPath();
        ctx.moveTo(0, height);

        for (let x = 0; x <= width; x += 12) {
          const y =
            wave.baseY +
            Math.sin(x * wave.wavelength + wave.speed) * wave.amplitude +
            Math.cos(x * wave.wavelength * 0.5 + wave.speed * 0.6) * (wave.amplitude * 0.4);
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, wave.baseY - wave.amplitude, 0, height);
        grad.addColorStop(0, wave.colorStop1);
        grad.addColorStop(1, wave.colorStop2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // 2. Render drifting luminous console particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += Math.sin(step * 3) * p.alphaSpeed;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const currentAlpha = Math.max(0.1, Math.min(0.85, p.alpha));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.shadowColor = 'rgba(56, 189, 248, 0.8)';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      if (!prefersReducedMotion && !document.hidden) {
        animId = requestAnimationFrame(render);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && !prefersReducedMotion) {
        cancelAnimationFrame(animId);
        animId = requestAnimationFrame(render);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="ps5-ambient-canvas"
      aria-hidden="true"
    />
  );
}

