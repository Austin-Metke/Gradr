// frontend/src/components/GradeSlider.tsx
import { useState } from 'react';

interface GradeSliderProps {
  value: 0 | 50 | 100;
  recommended?: 0 | 50 | 100;
  confidence?: 'high' | 'medium' | 'low';
  onChange: (grade: 0 | 50 | 100) => void;
}

export function GradeSlider({ value, recommended, confidence, onChange }: GradeSliderProps) {
  const tiers: Array<{ value: 0 | 50 | 100; label: string; color: string }> = [
    { value: 0, label: '0', color: 'bg-red-500' },
    { value: 50, label: '50', color: 'bg-yellow-500' },
    { value: 100, label: '100', color: 'bg-green-500' },
  ];

  return (
    <div className="grade-slider">
      {/* Recommendation badge */}
      {recommended !== undefined && (
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm text-slate-400">AI Recommends:</span>
          <span className={`px-2 py-1 rounded text-sm font-bold ${
            recommended === 100 ? 'bg-green-500/30 text-green-400' :
            recommended === 50 ? 'bg-yellow-500/30 text-yellow-400' :
            'bg-red-500/30 text-red-400'
          }`}>
            {recommended}
          </span>
          {confidence && (
            <span className={`text-xs ${
              confidence === 'high' ? 'text-green-400' :
              confidence === 'medium' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              ({confidence} confidence)
            </span>
          )}
        </div>
      )}

      {/* Three-position slider */}
      <div className="flex gap-2">
        {tiers.map((tier) => (
          <button
            key={tier.value}
            onClick={() => onChange(tier.value)}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              value === tier.value
                ? `${tier.color} border-white text-white font-bold`
                : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="text-2xl">{tier.label}</div>
            <div className="text-xs mt-1">
              {tier.value === 100 && 'Full Credit'}
              {tier.value === 50 && 'Partial'}
              {tier.value === 0 && 'No Credit'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}