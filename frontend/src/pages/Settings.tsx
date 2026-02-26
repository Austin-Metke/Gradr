import React, { useState } from 'react';
import { api } from '../services/api';

interface SettingsProps {
  onNavigate?: (page: 'dashboard' | 'settings') => void;
}

export function Settings({ onNavigate }: SettingsProps) {
  const [name, setName] = useState('');
  const [rubricFile, setRubricFile] = useState<File | null>(null);
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !rubricFile) {
      setMessage('Please provide a name and rubric file.');
      return;
    }
    try {
      const res = await api.createAssignment(name, rubricFile, syllabusFile || undefined);
      setMessage(`Created assignment ${res.assignment_id}`);
      setName('');
      setRubricFile(null);
      setSyllabusFile(null);
    } catch (err) {
      setMessage('Failed to create assignment');
    }
  };

  return (
    <div className="p-6 text-white">
      <h2 className="text-lg font-semibold mb-4">Settings</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {message && <p className="text-sm text-yellow-300">{message}</p>}
        <div>
          <label className="block text-sm text-slate-300 mb-1">Assignment Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Rubric (text or PDF)</label>
          <input
            type="file"
            accept=".txt,.pdf"
            onChange={(e) => setRubricFile(e.target.files?.[0] || null)}
            className="w-full"
          />
          {rubricFile && <p className="text-xs text-slate-400 mt-1">Selected: {rubricFile.name}</p>}
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Syllabus (optional)</label>
          <input
            type="file"
            accept=".txt"
            onChange={(e) => setSyllabusFile(e.target.files?.[0] || null)}
            className="w-full"
          />
          {syllabusFile && <p className="text-xs text-slate-400 mt-1">Selected: {syllabusFile.name}</p>}
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-3 py-2 bg-blue-600 rounded text-white">
            Create Assignment
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="px-3 py-2 bg-slate-700 rounded text-white"
          >
            Back to Dashboard
          </button>
        </div>
      </form>
    </div>
  );
}
