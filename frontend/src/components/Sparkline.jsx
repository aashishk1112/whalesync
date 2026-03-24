import React, { useMemo } from 'react';

const Sparkline = ({ data, width = 80, height = 30, color = '#00FFC6' }) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const pathContent = useMemo(() => {
    return data.map((val, i) => {
      const x = i * stepX;
      const y = height - ((val - min) / range) * height;
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ');
  }, [data, width, height, min, range, stepX]);

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <path
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d={pathContent}
        className="sparkline-path"
      />
      <style dangerouslySetInnerHTML={{ __html: `
        .sparkline-path {
          stroke-dasharray: 500;
          stroke-dashoffset: 500;
          animation: draw-spark-path 2s ease-out forwards;
        }
        @keyframes draw-spark-path {
          to { stroke-dashoffset: 0; }
        }
      `}} />
    </svg>
  );
};

export default Sparkline;
