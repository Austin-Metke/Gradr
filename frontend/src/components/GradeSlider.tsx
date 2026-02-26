// frontend/src/components/GradeSlider.tsx

interface GradeSliderProps {
  value: 0 | 50 | 100;
  recommended?: 0 | 50 | 100;
  confidence?: 'high' | 'medium' | 'low';
  onChange: (grade: 0 | 50 | 100) => void;
}

export function GradeSlider({ value, recommended, confidence, onChange }: GradeSliderProps) {
  const tiers: Array<{ value: 0 | 50 | 100; label: string; description: string; color: string; bgColor: string; borderColor: string }> = [
    { 
      value: 0, 
      label: '0', 
      description: 'No Credit',
      color: 'text-red-400', 
      bgColor: 'bg-red-500', 
      borderColor: 'border-red-500/50'
    },
    { 
      value: 50, 
      label: '50', 
      description: 'Partial Credit',
      color: 'text-yellow-400', 
      bgColor: 'bg-yellow-500', 
      borderColor: 'border-yellow-500/50'
    },
    { 
      value: 100, 
      label: '100', 
      description: 'Full Credit',
      color: 'text-green-400', 
      bgColor: 'bg-green-500', 
      borderColor: 'border-green-500/50'
    },
  ];

  return (
    <div className="space-y-4">
      {/* Recommendation badge */}
      {recommended !== undefined && (
        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/30">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-sm text-slate-400">AI Recommends:</span>
          </div>
          <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
            recommended === 100 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            recommended === 50 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
            'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {recommended}
          </span>
          {confidence && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              confidence === 'high' ? 'bg-green-500/10 text-green-400' :
              confidence === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
              'bg-red-500/10 text-red-400'
            }`}>
              {confidence} confidence
            </span>
          )}
        </div>
      )}

      {/* Three-position slider */}
      <div className="flex gap-3">
        {tiers.map((tier) => (
          <button
            key={tier.value}
            onClick={() => onChange(tier.value)}
            className={`flex-1 p-5 rounded-xl border-2 transition-all duration-200 ${
              value === tier.value
                ? `${tier.bgColor} border-white/30 text-white shadow-lg transform scale-[1.02]`
                : `bg-slate-800/50 ${tier.borderColor} hover:border-opacity-100 hover:bg-slate-800`
            }`}
          >
            <div className={`text-3xl font-bold ${value === tier.value ? 'text-white' : tier.color}`}>
              {tier.label}
            </div>
            <div className={`text-sm mt-1 ${value === tier.value ? 'text-white/80' : 'text-slate-400'}`}>
              {tier.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}