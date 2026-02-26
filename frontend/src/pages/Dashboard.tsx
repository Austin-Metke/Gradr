// frontend/src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    api.getAssignments().then(setAssignments);
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      api.getSubmissions(selectedAssignment).then(setSubmissions);
      // load assignment details for rubric
      api.getAssignment(selectedAssignment).then((a) => {
        setRubricText(a.rubric_text || '');
      });
    }
  }, [selectedAssignment]);

  const handleImport = async (file: File) => {
    if (!selectedAssignment) return;
    const result = await api.importFolder(selectedAssignment, file);
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
    <div className="h-screen flex bg-slate-900">
      {/* Sidebar */}
      <div className="w-72 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white">GradeFlow</h1>
        </div>
        
        <ModelSelector />
        
        {/* Assignment List */}
        <div className="p-4 border-t border-slate-700">
          <h3 className="text-sm font-medium text-slate-400 mb-2">Assignments</h3>
          <div className="space-y-1">
            {assignments.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAssignment(a.id)}
                className={`w-full text-left p-2 rounded ${
                  selectedAssignment === a.id ? 'bg-blue-600' : 'hover:bg-slate-700'
                } text-white`}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>

        {/* Student List */}
        {selectedAssignment && (
          <div className="flex-1 overflow-auto p-4 border-t border-slate-700">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-slate-400">Students</h3>
              <span className="text-xs text-slate-500">{submissions.length}</span>
            </div>
            <div className="space-y-1">
              {submissions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSubmission(s)}
                  className={`w-full text-left p-2 rounded flex justify-between items-center ${
                    selectedSubmission?.id === s.id ? 'bg-slate-700' : 'hover:bg-slate-800'
                  }`}
                >
                  <span className="text-white text-sm truncate">{s.student_name}</span>
                  {s.final_grade !== undefined && (
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      s.final_grade === 100 ? 'bg-green-500/30 text-green-400' :
                      s.final_grade === 50 ? 'bg-yellow-500/30 text-yellow-400' :
                      'bg-red-500/30 text-red-400'
                    }`}>
                      {s.final_grade}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Rubric Snippet */}
        {selectedAssignment && (
          <div className="p-4 border-t border-slate-700">
            <h3 className="text-sm font-medium text-slate-400 mb-2">Rubric</h3>
            <div className="text-xs text-slate-300 max-h-24 overflow-auto whitespace-pre-wrap">
              {rubricText || 'No rubric available.'}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-700 space-y-2">
          <FileUpload onUpload={handleImport} accept=".zip" label="Import Submissions" />
          <button
            onClick={handleGradeAll}
            disabled={isGrading || !selectedAssignment}
            className="w-full p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 rounded text-white"
          >
            {isGrading ? 'Grading...' : 'Grade All with AI'}
          </button>
          <button
            onClick={handleExport}
            disabled={!selectedAssignment}
            className="w-full p-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 rounded text-white"
          >
            Export to Canvas CSV
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="p-4 border-b border-slate-700 bg-slate-800">
          <h2 className="text-lg font-semibold text-white">
            {assignments.find((a) => a.id === selectedAssignment)?.name || 'No assignment selected'}
          </h2>
        </div>

        {selectedSubmission ? (
          <SubmissionViewer
            submission={selectedSubmission}
            rubricText={rubricText}
            onGradeChange={handleGradeChange}
            onRequestAIGrade={handleGradeWithAI}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500">
            Select a student to view their submission
          </div>
        )}
      </div>
    </div>
  );
}