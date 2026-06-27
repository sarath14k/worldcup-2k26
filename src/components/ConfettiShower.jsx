import { useState } from 'react';

export const ConfettiShower = () => {
  const [particles] = useState(() => {
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return [];
    const colors = ['#00FF87', '#4F46E5', '#3B82F6', '#FBBF24', '#EF4444', '#EC4899'];
    const shapes = ['circle', 'square', 'triangle'];
    
    return Array.from({ length: 45 }).map((_, i) => {
      const left = Math.random() * 100; // left position in %
      const delay = Math.random() * 1.5; // animation delay in s
      const size = Math.random() * 8 + 4; // size in px
      const duration = Math.random() * 2 + 2; // duration in s
      const color = colors[Math.floor(Math.random() * colors.length)];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      
      return { id: i, left, delay, size, duration, color, shape };
    });
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
      {particles.map(p => {
        let style = {
          left: `${p.left}%`,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration}s`,
          backgroundColor: p.color,
          width: `${p.size}px`,
          height: `${p.size}px`,
        };
        
        let shapeClass = '';
        if (p.shape === 'circle') {
          shapeClass = 'rounded-full';
        } else if (p.shape === 'triangle') {
          shapeClass = ''; // styled via border clip-path
          style.backgroundColor = 'transparent';
          style.borderLeft = `${p.size / 2}px solid transparent`;
          style.borderRight = `${p.size / 2}px solid transparent`;
          style.borderBottom = `${p.size}px solid ${p.color}`;
        }
        
        return (
          <div 
            key={p.id}
            className="animate-confetti-particle"
            style={style}
          >
            <div className={`w-full h-full ${shapeClass}`} style={{ backgroundColor: style.backgroundColor }} />
          </div>
        );
      })}
    </div>
  );
};
