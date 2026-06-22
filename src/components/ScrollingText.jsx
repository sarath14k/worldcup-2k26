import { useEffect, useState, useRef } from 'react';

export const ScrollingText = ({ text, className = "text-slate-100" }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [scrollDist, setScrollDist] = useState(0);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const textWidth = textRef.current.scrollWidth;
        if (textWidth > containerWidth) {
          setScrollDist(textWidth - containerWidth);
        } else {
          setScrollDist(0);
        }
      }
    };

    checkOverflow();
    const timer = setTimeout(checkOverflow, 200);
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [text]);

  const duration = Math.max(3, scrollDist * 0.05); // speed: 20px per second, min 3s

  return (
    <div 
      ref={containerRef} 
      className="overflow-hidden relative w-full select-none flex items-center"
    >
      <span
        ref={textRef}
        className={`inline-block whitespace-nowrap ${className}`}
        style={
          scrollDist > 0
            ? {
                animation: `marquee-scroll ${duration}s linear infinite alternate`,
                paddingRight: '15px',
                '--scroll-dist': `-${scrollDist + 10}px`,
              }
            : {}
        }
      >
        {text}
      </span>
    </div>
  );
};
