// Country types
export interface Country {
  code: string;
  name: string;
  nameKo?: string;
}

// Auth types
export interface SessionData {
  studentId: string;
  createdAt: number;
  expiresAt: number;
}

export interface AuthState {
  isLoggedIn: boolean;
  studentId: string | null;
  isLoading: boolean;
}

export interface LoginResponse {
  studentId: string;
  isNewUser: boolean;
  lastLoginAt: string;
}

// Policy Issue types
export interface PolicyIssue {
  issue: string;
  description: string;
  importance_score: number;
  frequency_score: number;
  total_score: number;
}

// Topic types
export interface Topic {
  title: string;
  description: string;
}

// Analysis types
export interface Rationale {
  relevance: string;
  feasibility: string;
  impact: string;
}

export interface Methodology {
  methodology: string;
  explanation: string;
}

/** A reference as proposed by the AI, before web verification. */
export interface AiReference {
  authors: string[];
  year: number;
  title: string;
  venue: string;
}

export interface AnalysisData {
  rationale: Rationale;
  data_sources: string[];
  /** Plain strings appear only in analyses saved before references became structured. */
  key_references: Array<AiReference | string>;
  methodologies: Methodology[];
  policy_questions: string[];
  /** Absent in analyses generated or saved before literature discovery was added. */
  search_queries?: string[];
}

// Verified sources types
export type SourceType = 'government' | 'international_org' | 'academic' | 'ngo' | 'other';

export interface VerifiedDataSource {
  name: string;
  url: string;
  description: string;
  source_type: SourceType;
  verified_at: string;
}

export interface VerifiedReference {
  title: string;
  authors: string[];
  year: number;
  source: string;
  url?: string;
  doi?: string;
  /** Citation count from the registry that confirmed the work; absent for web-search matches. */
  cited_by_count?: number;
  verified_at: string;
}

// Saved analysis types
export interface SavedAnalysis {
  id: string;
  student_id: string;
  country: string;
  interest: string;
  selected_issue: string;
  issue_importance_score: number | null;
  issue_frequency_score: number | null;
  topic_title: string;
  analysis_data: AnalysisData;
  verified_data_sources: VerifiedDataSource[] | null;
  verified_references: VerifiedReference[] | null;
  /** Null for analyses saved before unverified suggestions were stored. */
  unverified_data_sources: string[] | null;
  unverified_references: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface SavedAnalysisSummary {
  id: string;
  country: string;
  interest: string;
  selected_issue: string;
  topic_title: string;
  created_at: string;
}

// API Response types
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Step state types
export interface StepState {
  currentStep: number;
  country: string;
  interest: string;
  issues: PolicyIssue[];
  selectedIssue: PolicyIssue | null;
  topics: Topic[];
  selectedTopic: Topic | null;
  analysis: AnalysisData | null;
  verifiedDataSources: VerifiedDataSource[];
  verifiedReferences: VerifiedReference[];
  unverifiedDataSources: string[];
  unverifiedReferences: string[];
}
