import React from 'react';

const RiskMeter = ({ score }) => {
  // score is 0 to 1
  const getLevel = (v) => {
    if (v < 0.3) return { label: 'LOW', color: 'var(--success)' };
    if (v < 0.7) return { label: 'MED', color: 'var(--accent)' };
    return { label: 'HIGH', color: 'var(--danger)' };
  };

  const { label, color } = getLevel(score);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-0.5">
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((threshold) => (
          <div
            key={threshold}
            style={{
              width: '4px',
              height: '8px',
              borderRadius: '1px',
              background: score >= threshold ? color : 'rgba(255,255,255,0.1)',
              opacity: score >= threshold ? 1 : 0.3
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: '0.6rem', fontWeight: '800', color, letterSpacing: '0.5px' }}>{label}</span>
    </div>
  );
};

export default RiskMeter;
