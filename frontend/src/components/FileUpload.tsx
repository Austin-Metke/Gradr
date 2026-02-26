import React from 'react';

interface FileUploadProps {
  onUpload: (file: File) => void;
  accept?: string;
  label?: string;
}

export function FileUpload({ onUpload, accept = '*', label = 'Upload' }: FileUploadProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (f) onUpload(f);
    // clear input
    e.currentTarget.value = '';
  };

  return (
    <label className="w-full block">
      <input type="file" accept={accept} onChange={handleChange} className="hidden" />
      <button className="w-full p-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm">{label}</button>
    </label>
  );
}
