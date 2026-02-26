// frontend/src/components/SubmissionViewer.tsx
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { GradeSlider } from './GradeSlider';
import { Submission, GradeResult, api } from '../services/api';

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

  const currentGrade = submission.final_grade ?? submission.grade?.recommended_grade ?? 50;

  // react-syntax-highlighter's exported component typing can be incompatible with strict React types.
  // Cast to any to avoid JSX typing issues in this small app.
  const SyntaxHighlighterAny = SyntaxHighlighter as unknown as any;

  return (
    <div className="h-full flex">
      {/* Left Panel: Submission Content */}
      <div className="w-1/2 border-r border-slate-700 flex flex-col">
        {/* Student Header */}
        <div className="p-4 border-b border-slate-700 bg-slate-800">
          <h2 className="text-xl font-bold text-white">{submission.student_name}</h2>
          {submission.canvas_id && (
            <span className="text-sm text-slate-400">ID: {submission.canvas_id}</span>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('code')}
            className={`flex-1 p-3 ${activeTab === 'code' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
          >
            Code ({submission.code_files.length})
          </button>
          <button
            onClick={() => setActiveTab('screenshots')}
            className={`flex-1 p-3 ${activeTab === 'screenshots' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
          >
            Screenshots ({submission.screenshots.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'code' && (
            <div>
              {/* File tabs */}
              {submission.code_files.length > 1 && (
                <div className="flex gap-1 p-2 bg-slate-900">
                  {submission.code_files.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedFile(i)}
                      className={`px-3 py-1 rounded text-sm ${
                        selectedFile === i ? 'bg-slate-700 text-white' : 'text-slate-400'
                      }`}
                    >
                      {f.filename}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Code display */}
              <SyntaxHighlighterAny
                language="python"
                style={vscDarkPlus}
                showLineNumbers
                customStyle={{ margin: 0, fontSize: '14px' }}
              >
                {submission.code_files[selectedFile]?.raw_code || '// No code submitted'}
              </SyntaxHighlighterAny>
            </div>
          )}

          {activeTab === 'screenshots' && (
            <div className="p-4 grid grid-cols-2 gap-4">
              {submission.screenshots.map((ss, i) => (
                <div key={i} className="bg-slate-800 rounded overflow-hidden">
                  <img
                    src={`data:image/png;base64,${ss.image_data}`}
                    alt={ss.filename}
                    className="w-full cursor-pointer hover:opacity-80"
                    onClick={() => setExpandedImage(ss.image_data)}
                  />
                  <div className="p-2">
                    <p className="text-xs text-slate-400">{ss.filename}</p>
                    <p className="text-xs text-slate-500 mt-1">OCR: {ss.ocr_text.slice(0, 100)}...</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Rubric + Grading */}
      <div className="w-1/2 flex flex-col">
        {/* Rubric Display */}
        <div className="h-1/3 p-4 border-b border-slate-700 overflow-auto bg-slate-900">
          <h3 className="text-lg font-semibold text-white mb-2">Assignment Requirements</h3>
          <pre className="text-sm text-slate-300 whitespace-pre-wrap">{rubricText}</pre>
        </div>

        {/* Grading Area */}
        <div className="flex-1 p-4 space-y-4 overflow-auto">
          {/* Button to trigger AI regrade */}
          {onRequestAIGrade && (
            <div className="flex justify-end">
              <button
                onClick={() => onRequestAIGrade(submission.id)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
              >
                {submission.grade ? 'Re-run AI Grade' : 'Grade with AI'}
              </button>
            </div>
          )}
          {/* AI Analysis */}
          {submission.grade && (
            <div className="bg-slate-800 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">AI Analysis</h4>
              
              {/* Requirements checklist */}
              <div className="space-y-1 mb-3">
                {submission.grade.meets_requirements?.map((req, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className={req.met ? 'text-green-400' : 'text-red-400'}>
                      {req.met ? '✓' : '✗'}
                    </span>
                    <span className="text-slate-300">{req.requirement}</span>
                  </div>
                ))}
              </div>

              {/* Code quality flags */}
              <div className="flex gap-2 text-xs mb-3">
                <span className={`px-2 py-1 rounded ${
                  submission.grade.code_quality?.runs ? 'bg-green-500/30' : 'bg-red-500/30'
                }`}>
                  {submission.grade.code_quality?.runs ? 'Runs ✓' : 'Errors ✗'}
                </span>
                <span className={`px-2 py-1 rounded ${
                  submission.grade.code_quality?.logic_correct ? 'bg-green-500/30' : 'bg-yellow-500/30'
                }`}>
                  {submission.grade.code_quality?.logic_correct ? 'Logic OK' : 'Logic Issues'}
                </span>
              </div>

              {/* TA Notes */}
              {submission.grade.ta_notes && (
                <p className="text-xs text-slate-500 italic">{submission.grade.ta_notes}</p>
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
            <label className="block text-sm text-slate-400 mb-1">Student Feedback</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded text-white text-sm"
              placeholder="Feedback to include in grade export..."
            />
          </div>
        </div>
      </div>

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setExpandedImage(null)}
        >
          <img
            src={`data:image/png;base64,${expandedImage}`}
            alt="Expanded screenshot"
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
        </div>
      )}
    </div>
  );
}