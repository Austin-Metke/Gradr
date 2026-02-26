// frontend/src/pages/Dashboard.tsx
import { useState, useEffect, useRef } from 'react';
import { api, Submission } from '../services/api';
import { ModelSelector } from '../components/ModelSelector';
import { SubmissionViewer } from '../components/SubmissionViewer';
import { FileUpload } from '../components/FileUpload';

interface DashboardProps {
  onNavigate?: (page: 'dashboard' | 'settings') => void;
}

export function Dashboard(_props: DashboardProps) {
  const [assignments, setAssignments] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [rubricText, setRubricText] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // New assignment form state
  const [showNewAssignment, setShowNewAssignment] = useState(false);
  const [newAssignmentName, setNewAssignmentName] = useState('');
  const [rubricFile, setRubricFile] = useState<File | null>(null);
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const rubricInputRef = useRef<HTMLInputElement>(null);
  const syllabusInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = () => {
    api.getAssignments().then(setAssignments);
  };

  useEffect(() => {
    if (selectedAssignment) {
      api.getSubmissions(selectedAssignment).then(setSubmissions);
      // load assignment details for rubric
      api.getAssignment(selectedAssignment).then((a) => {
        setRubricText(a.rubric_text || '');
      });
    }
  }, [selectedAssignment]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignmentName.trim() || !rubricFile) {
      return;
    }
    setIsCreating(true);
    try {
      const result = await api.createAssignment(newAssignmentName, rubricFile, syllabusFile || undefined);
      loadAssignments();
      setSelectedAssignment(result.assignment_id);
      setShowNewAssignment(false);
      setNewAssignmentName('');
      setRubricFile(null);
      setSyllabusFile(null);
    } catch (err) {
      console.error('Failed to create assignment:', err);
    }
    setIsCreating(false);
  };

  const handleImport = async (file: File) => {
    if (!selectedAssignment) return;
    await api.importFolder(selectedAssignment, file);
    api.getSubmissions(selectedAssignment).then(setSubmissions);
  };

  const handleGradeAll = async () => {
    if (!selectedAssignment) return;
    setIsGrading(true);
    await api.gradeAll(selectedAssignment);
    api.getSubmissions(selectedAssignment).then(setSubmissions);
    setIsGrading(false);
  };

  const handleExport = async () => {
    if (!selectedAssignment) return;
    const blob = await api.exportGrades(selectedAssignment);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grades_${selectedAssignment}.csv`;
    a.click();
  };

  const handleGradeChange = async (submissionId: number, grade: 0 | 50 | 100) => {
    await api.setFinalGrade(submissionId, grade);
    setSubmissions(submissions.map(s => 
      s.id === submissionId ? { ...s, final_grade: grade } : s
    ));
  };

  const handleGradeWithAI = async (submissionId: number) => {
    if (!selectedAssignment) return;
    const result = await api.gradeSubmission(selectedAssignment, submissionId);
    // update submission list and selected submission
    setSubmissions(submissions.map(s =>
      s.id === submissionId ? { ...s, grade: result } : s
    ));
    if (selectedSubmission?.id === submissionId) {
      setSelectedSubmission({ ...selectedSubmission, grade: result });
    }
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar */}
      <div className="w-80 border-r border-slate-700/50 flex flex-col bg-slate-900/50 backdrop-blur-sm">
        {/* Header */}
        <div className="p-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">GradeFlow</h1>
              <p className="text-xs text-slate-400">AI-Powered Grading</p>
            </div>
          </div>
        </div>
        
        {/* Settings Toggle */}
        <div className="p-4 border-b border-slate-700/50">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">LLM Settings</span>
            </div>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${showSettings ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        
        {/* Model Selector (Collapsible) */}
        {showSettings && (
          <div className="p-4 border-b border-slate-700/50 bg-slate-800/30">
            <ModelSelector />
          </div>
        )}
        
        {/* Assignment List */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Assignments</h3>
            <button
              onClick={() => setShowNewAssignment(true)}
              className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 transition-all"
              title="Create new assignment"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          {/* New Assignment Form */}
          {showNewAssignment && (
            <form onSubmit={handleCreateAssignment} className="mb-3 p-4 rounded-xl bg-slate-800/80 border border-slate-600/50 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Assignment Name</label>
                <input
                  type="text"
                  value={newAssignmentName}
                  onChange={(e) => setNewAssignmentName(e.target.value)}
                  placeholder="e.g., Lab 1: Introduction"
                  className="w-full p-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Rubric File *</label>
                <input
                  ref={rubricInputRef}
                  type="file"
                  accept=".txt,.pdf,.md"
                  onChange={(e) => setRubricFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => rubricInputRef.current?.click()}
                  className={`w-full p-2.5 rounded-lg border border-dashed transition-all text-sm ${
                    rubricFile 
                      ? 'border-green-500/50 bg-green-500/10 text-green-400' 
                      : 'border-slate-600/50 bg-slate-700/30 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
                  }`}
                >
                  {rubricFile ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {rubricFile.name}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Choose rubric file
                    </span>
                  )}
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Syllabus (optional)</label>
                <input
                  ref={syllabusInputRef}
                  type="file"
                  accept=".txt,.pdf,.md"
                  onChange={(e) => setSyllabusFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => syllabusInputRef.current?.click()}
                  className={`w-full p-2 rounded-lg border border-dashed transition-all text-sm ${
                    syllabusFile 
                      ? 'border-green-500/50 bg-green-500/10 text-green-400' 
                      : 'border-slate-600/50 bg-slate-700/30 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
                  }`}
                >
                  {syllabusFile ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {syllabusFile.name}
                    </span>
                  ) : (
                    <span>Add syllabus (optional)</span>
                  )}
                </button>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={!newAssignmentName.trim() || !rubricFile || isCreating}
                  className="flex-1 p-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-all shadow-lg shadow-blue-600/20 disabled:shadow-none"
                >
                  {isCreating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </span>
                  ) : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewAssignment(false);
                    setNewAssignmentName('');
                    setRubricFile(null);
                    setSyllabusFile(null);
                  }}
                  className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          
          <div className="space-y-1">
            {assignments.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No assignments yet</p>
            ) : (
              assignments.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setSelectedAssignment(a.id);
                    setSelectedSubmission(null);
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedAssignment === a.id 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="truncate">{a.name}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Student List */}
        {selectedAssignment && (
          <div className="flex-1 overflow-auto p-4 border-b border-slate-700/50">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Students</h3>
              <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded-full">{submissions.length}</span>
            </div>
            <div className="space-y-1">
              {submissions.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No submissions yet</p>
              ) : (
                submissions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSubmission(s)}
                    className={`w-full text-left p-3 rounded-lg flex justify-between items-center transition-all ${
                      selectedSubmission?.id === s.id 
                        ? 'bg-slate-700/80 ring-1 ring-slate-600' 
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                        s.final_grade === 100 ? 'bg-green-500/20 text-green-400' :
                        s.final_grade === 50 ? 'bg-yellow-500/20 text-yellow-400' :
                        s.final_grade === 0 ? 'bg-red-500/20 text-red-400' :
                        'bg-slate-700 text-slate-400'
                      }`}>
                        {s.student_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white text-sm truncate">{s.student_name}</span>
                    </div>
                    {s.final_grade !== undefined && (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                        s.final_grade === 100 ? 'bg-green-500/20 text-green-400' :
                        s.final_grade === 50 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {s.final_grade}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Rubric Snippet */}
        {selectedAssignment && rubricText && (
          <div className="p-4 border-t border-slate-700/50 max-h-48">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">Rubric Preview</h3>
            <div className="text-xs text-slate-400 max-h-28 overflow-auto whitespace-pre-wrap bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
              {rubricText}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-700/50 space-y-2 mt-auto">
          <FileUpload 
            onUpload={handleImport} 
            accept=".zip" 
            label="Import Submissions ZIP" 
            disabled={!selectedAssignment}
          />
          <button
            onClick={handleGradeAll}
            disabled={isGrading || !selectedAssignment || submissions.length === 0}
            className="w-full p-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all shadow-lg shadow-purple-600/20 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isGrading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Grading...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Grade All with AI
              </>
            )}
          </button>
          <button
            onClick={handleExport}
            disabled={!selectedAssignment || submissions.length === 0}
            className="w-full p-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export to Canvas CSV
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white">
            {assignments.find((a) => a.id === selectedAssignment)?.name || 'Select an assignment to begin'}
          </h2>
          {selectedAssignment && (
            <p className="text-sm text-slate-400 mt-1">
              {submissions.length} submission{submissions.length !== 1 ? 's' : ''} • 
              {submissions.filter(s => s.final_grade !== undefined).length} graded
            </p>
          )}
        </div>

        {selectedSubmission ? (
          <SubmissionViewer
            submission={selectedSubmission}
            rubricText={rubricText}
            onGradeChange={handleGradeChange}
            onRequestAIGrade={handleGradeWithAI}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-400 text-lg">
                {selectedAssignment 
                  ? 'Select a student to view their submission'
                  : 'Select or create an assignment to get started'
                }
              </p>
              {!selectedAssignment && (
                <button
                  onClick={() => setShowNewAssignment(true)}
                  className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-all shadow-lg shadow-blue-600/20"
                >
                  Create Your First Assignment
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}