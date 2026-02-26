// frontend/src/services/api.ts
const API_BASE = 'http://localhost:8000/api';

export interface Provider {
  id: string;
  name: string;
  requires_key: boolean;
  models?: string[];
}

export interface Student {
  name: string;
  canvas_id: string | null;
  submission_id: number;
  files_count: number;
}

export interface GradeResult {
  recommended_grade: 0 | 50 | 100;
  confidence: 'high' | 'medium' | 'low';
  meets_requirements: Array<{
    requirement: string;
    met: boolean;
    notes: string;
  }>;
  code_quality: {
    runs: boolean;
    logic_correct: boolean;
    style_acceptable: boolean;
    issues: string[];
  };
  feedback: string;
  ta_notes: string;
}

export interface Submission {
  id: number;
  student_name: string;
  canvas_id: string | null;
  code_files: Array<{
    filename: string;
    raw_code: string;
    line_count: number;
    functions: string[];
  }>;
  screenshots: Array<{
    filename: string;
    ocr_text: string;
    image_data: string; // base64
  }>;
  grade?: GradeResult;
  final_grade?: 0 | 50 | 100;
}

export const api = {
  // Providers
  async getProviders(): Promise<{ providers: Provider[] }> {
    const res = await fetch(`${API_BASE}/providers`);
    return res.json();
  },

  async setProvider(provider: string, model?: string): Promise<void> {
    const form = new FormData();
    form.append('provider', provider);
    if (model) form.append('model', model);
    await fetch(`${API_BASE}/config/provider`, { method: 'POST', body: form });
  },

  async getProviderConfig(): Promise<{ provider: string; model?: string }> {
    const res = await fetch(`${API_BASE}/config/provider`);
    return res.json();
  },

  // Assignments
  async createAssignment(name: string, rubric: File, syllabus?: File): Promise<{ assignment_id: number }> {
    const form = new FormData();
    form.append('name', name);
    form.append('rubric_file', rubric);
    if (syllabus) form.append('syllabus_file', syllabus);
    const res = await fetch(`${API_BASE}/assignments`, { method: 'POST', body: form });
    return res.json();
  },

  async getAssignments(): Promise<Array<{ id: number; name: string }>> {
    const res = await fetch(`${API_BASE}/assignments`);
    return res.json();
  },

  async getAssignment(id: number): Promise<{ id: number; name: string; rubric_text: string; syllabus_text?: string }> {
    const res = await fetch(`${API_BASE}/assignments/${id}`);
    return res.json();
  },

  // Submissions
  async importFolder(assignmentId: number, zipFile: File): Promise<{ imported: number; students: Student[] }> {
    const form = new FormData();
    form.append('archive', zipFile);
    const res = await fetch(`${API_BASE}/assignments/${assignmentId}/import-folder`, {
      method: 'POST',
      body: form,
    });
    return res.json();
  },

  async getSubmissions(assignmentId: number): Promise<Submission[]> {
    const res = await fetch(`${API_BASE}/assignments/${assignmentId}/submissions`);
    return res.json();
  },

  async getSubmission(submissionId: number): Promise<Submission> {
    const res = await fetch(`${API_BASE}/submissions/${submissionId}`);
    return res.json();
  },

  // Grading
  async gradeSubmission(assignmentId: number, submissionId: number): Promise<GradeResult> {
    const res = await fetch(`${API_BASE}/assignments/${assignmentId}/grade/${submissionId}`, {
      method: 'POST',
    });
    return res.json();
  },

  async gradeAll(assignmentId: number): Promise<{ graded: number }> {
    const res = await fetch(`${API_BASE}/assignments/${assignmentId}/grade-all`, {
      method: 'POST',
    });
    return res.json();
  },

  async setFinalGrade(submissionId: number, grade: 0 | 50 | 100): Promise<void> {
    await fetch(`${API_BASE}/submissions/${submissionId}/grade`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grade }),
    });
  },

  // Export
  async exportGrades(assignmentId: number): Promise<Blob> {
    const res = await fetch(`${API_BASE}/assignments/${assignmentId}/export`);
    return res.blob();
  },
};