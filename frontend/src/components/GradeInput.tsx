import React from 'react';

interface GradeInputProps {
  value: number;
  onChange: (v: number) => void;
}

export function GradeInput({ value, onChange }: GradeInputProps) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-24 p-2 bg-slate-700 border border-slate-600 rounded text-white"
    />
  );
}
