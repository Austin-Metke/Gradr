import React from 'react';

interface RubricPanelProps {
  text: string;
}

export function RubricPanel({ text }: RubricPanelProps) {
  return (
    <div className="p-3 bg-slate-900 border border-slate-700 rounded text-sm text-slate-300 whitespace-pre-wrap">
      {text || 'No rubric provided.'}
    </div>
  );
}
