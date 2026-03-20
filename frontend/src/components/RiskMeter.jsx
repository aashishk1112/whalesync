import React from 'react';

const RiskMeter = ({ score }) => {
  // score is 0 to 1
  const getLevel = (v) => {
    if (v < 0.3) return { label: 'LOW', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
    if (v < 0.7) return { label: 'MED', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' };
    return { label: 'HIGH', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' };
  };

  const { label, color, bg } = getLevel(score);

  return (
    <div className="flex flex-col items-end gap-1.5 group">
      <div className="flex gap-[2px] bg-black/40 p-[2px] rounded-sm border border-white/5 backdrop-blur-sm">
        {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map((threshold) => (
          <div
            key={threshold}
            style={{
              width: '3px',
              height: '10px',
              borderRadius: '0.5px',
              background: score >= threshold ? color : 'rgba(255,255,255,0.05)',
              boxShadow: score >= threshold ? `0 0 6px ${color}40` : 'none',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-1">
          <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: color }}></div>
          <span style={{ fontSize: '0.55rem', fontWeight: '900', color, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {label} RISK
          </span>
      </div>
    </div>
  );
};

export default RiskMeter;
