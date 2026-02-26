import React, { useRef } from 'react';

interface FileUploadProps {
  onUpload: (file: File) => void;
  accept?: string;
  label?: string;
  disabled?: boolean;
}

export function FileUpload({ onUpload, accept = '*', label = 'Upload', disabled = false }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (f) onUpload(f);
    // clear input
    e.currentTarget.value = '';
  };

  return (
    <div>
      <input 
        ref={inputRef}
        type="file" 
        accept={accept} 
        onChange={handleChange} 
        className="hidden" 
        disabled={disabled}
      />
      <button 
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className={`w-full p-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
          disabled 
            ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed' 
            : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600/50 hover:border-slate-500/50'
        }`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        {label}
      </button>
    </div>
  );
}
