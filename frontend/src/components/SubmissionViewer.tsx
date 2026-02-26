// frontend/src/components/SubmissionViewer.tsx
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { GradeSlider } from './GradeSlider';
import { Submission } from '../services/api';

interface SubmissionViewerProps {
  submission: Submission;
  rubricText: string;
  onGradeChange: (submissionId: number, grade: 0 | 50 | 100) => void;
  onRequestAIGrade?: (submissionId: number) => void;
}

export function SubmissionViewer({ submission, rubricText, onGradeChange, onRequestAIGrade }: SubmissionViewerProps) {
  const [activeTab, setActiveTab] = useState<'code' | 'screenshots'>('code');
  const [selectedFile, setSelectedFile] = useState(0);
  const [feedback, setFeedback] = useState(submission.grade?.feedback || '');
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [isGrading, setIsGrading] = useState(false);

  const currentGrade = submission.final_grade ?? submission.grade?.recommended_grade ?? 50;

  // react-syntax-highlighter's exported component typing can be incompatible with strict React types.
  // Cast to any to avoid JSX typing issues in this small app.
  const SyntaxHighlighterAny = SyntaxHighlighter as unknown as any;

  const handleAIGrade = async () => {
    if (!onRequestAIGrade) return;
    setIsGrading(true);
    try {
      await onRequestAIGrade(submission.id);
    } catch (err) {
      console.error('Failed to grade with AI:', err);
    }
    setIsGrading(false);
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left Panel: Submission Content */}
      <div className="w-1/2 border-r border-slate-700/50 flex flex-col bg-slate-900/30">
        {/* Student Header */}
        <div className="p-5 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/80 to-slate-800/40">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/20">
              {submission.student_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{submission.student_name}</h2>
              {submission.canvas_id && (
                <span className="text-sm text-slate-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                  Canvas ID: {submission.canvas_id}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-700/50">
          <button
            onClick={() => setActiveTab('code')}
            className={`flex-1 p-4 flex items-center justify-center gap-2 transition-all ${
              activeTab === 'code' 
                ? 'bg-slate-800/80 text-white border-b-2 border-blue-500' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Code ({submission.code_files.length})
          </button>
          <button
            onClick={() => setActiveTab('screenshots')}
            className={`flex-1 p-4 flex items-center justify-center gap-2 transition-all ${
              activeTab === 'screenshots' 
                ? 'bg-slate-800/80 text-white border-b-2 border-blue-500' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Screenshots ({submission.screenshots.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'code' && (
            <div>
              {/* File tabs */}
              {submission.code_files.length > 1 && (
                <div className="flex gap-1 p-3 bg-slate-900/50 border-b border-slate-700/30 overflow-x-auto">
                  {submission.code_files.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedFile(i)}
                      className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                        selectedFile === i 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                          : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      {f.filename}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Code display */}
              {submission.code_files.length > 0 ? (
                <div className="relative">
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-slate-800/80 rounded text-slate-400 backdrop-blur-sm">
                      {submission.code_files[selectedFile]?.line_count || 0} lines
                    </span>
                  </div>
                  <SyntaxHighlighterAny
                    language="python"
                    style={vscDarkPlus}
                    showLineNumbers
                    customStyle={{ 
                      margin: 0, 
                      fontSize: '14px',
                      background: 'transparent',
                      padding: '1rem',
                    }}
                    lineNumberStyle={{
                      minWidth: '3em',
                      paddingRight: '1em',
                      color: '#475569',
                    }}
                  >
                    {submission.code_files[selectedFile]?.raw_code || '# No code submitted'}
                  </SyntaxHighlighterAny>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-500">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    No code files submitted
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'screenshots' && (
            <div className="p-4">
              {submission.screenshots.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {submission.screenshots.map((ss, i) => (
                    <div key={i} className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/30 hover:border-slate-600/50 transition-all group">
                      <div className="relative">
                        <img
                          src={`data:image/png;base64,${ss.image_data}`}
                          alt={ss.filename}
                          className="w-full cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setExpandedImage(ss.image_data)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                          <span className="text-white text-sm bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                            Click to enlarge
                          </span>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-slate-300 mb-1">{ss.filename}</p>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {ss.ocr_text || 'No text detected'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-500">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    No screenshots submitted
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Rubric + Grading */}
      <div className="w-1/2 flex flex-col bg-slate-900/20">
        {/* Rubric Display */}
        <div className="h-1/3 p-5 border-b border-slate-700/50 overflow-auto">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h3 className="text-lg font-semibold text-white">Assignment Requirements</h3>
          </div>
          <pre className="text-sm text-slate-300 whitespace-pre-wrap bg-slate-800/30 p-4 rounded-xl border border-slate-700/30">
            {rubricText || 'No rubric available'}
          </pre>
        </div>

        {/* Grading Area */}
        <div className="flex-1 p-5 space-y-5 overflow-auto">
          {/* Button to trigger AI regrade */}
          {onRequestAIGrade && (
            <div className="flex justify-end">
              <button
                onClick={handleAIGrade}
                disabled={isGrading}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 rounded-lg text-white text-sm font-medium transition-all shadow-lg shadow-blue-600/20 disabled:shadow-none flex items-center gap-2"
              >
                {isGrading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {submission.grade ? 'Re-run AI Grade' : 'Grade with AI'}
                  </>
                )}
              </button>
            </div>
          )}

          {/* AI Analysis */}
          {submission.grade && (
            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/30">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h4 className="text-white font-semibold">AI Analysis</h4>
              </div>
              
              {/* Requirements checklist */}
              {submission.grade.meets_requirements && submission.grade.meets_requirements.length > 0 && (
                <div className="space-y-2 mb-4">
                  {submission.grade.meets_requirements.map((req, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-slate-900/30">
                      <span className={`flex items-center justify-center w-5 h-5 rounded-full mt-0.5 ${
                        req.met ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {req.met ? (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </span>
                      <div className="flex-1">
                        <span className="text-sm text-slate-300">{req.requirement}</span>
                        {req.notes && (
                          <p className="text-xs text-slate-500 mt-1">{req.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Code quality flags */}
              {submission.grade.code_quality && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    submission.grade.code_quality.runs 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {submission.grade.code_quality.runs ? '✓ Runs' : '✗ Errors'}
                  </span>
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    submission.grade.code_quality.logic_correct 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {submission.grade.code_quality.logic_correct ? '✓ Logic OK' : '⚠ Logic Issues'}
                  </span>
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    submission.grade.code_quality.style_acceptable 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {submission.grade.code_quality.style_acceptable ? '✓ Style OK' : '⚠ Style Issues'}
                  </span>
                </div>
              )}

              {/* TA Notes */}
              {submission.grade.ta_notes && (
                <div className="bg-slate-900/30 rounded-lg p-3 border-l-2 border-purple-500/50">
                  <p className="text-xs text-slate-400 italic">{submission.grade.ta_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Grade Slider */}
          <GradeSlider
            value={currentGrade as 0 | 50 | 100}
            recommended={submission.grade?.recommended_grade}
            confidence={submission.grade?.confidence}
            onChange={(grade) => onGradeChange(submission.id, grade)}
          />

          {/* Feedback Editor */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Student Feedback
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="w-full p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder-slate-500 resize-none"
              placeholder="Add feedback to include in the grade export..."
            />
          </div>
        </div>
      </div>

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-8"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-full max-h-full">
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors flex items-center gap-2"
            >
              <span className="text-sm">Press ESC or click to close</span>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={`data:image/png;base64,${expandedImage}`}
              alt="Expanded screenshot"
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}