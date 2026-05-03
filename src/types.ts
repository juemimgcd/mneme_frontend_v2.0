export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface UserProfile {
  id: number;
  username: string;
  display_name: string | null;
  avatar_url: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface KnowledgeBase {
  id: string;
  user_id: number;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
}

export type DocumentStatus =
  | 'uploaded'
  | 'queued'
  | 'indexing'
  | 'parsing'
  | 'chunking'
  | 'embedding'
  | 'vector_upserting'
  | 'completed'
  | 'indexed'
  | 'failed'
  | 'canceled';

export interface ArchiveDocument {
  id: string;
  user_id: number;
  knowledge_base_id: string;
  file_name: string;
  file_type: string;
  status: DocumentStatus | string;
  created_at: string;
  file_size?: number;
}

export interface DocumentIndexTask {
  task_id: string;
  document_id: string;
  knowledge_base_id: string;
  status: string;
  message: string;
}

export interface TaskRecord {
  id: string;
  task_type: string;
  target_id: string;
  status: string;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemoryTimelineItem {
  entry_id: string;
  entry_name: string;
  entry_type: string;
  summary: string;
  created_at: string;
}

export interface MemoryThemeItem {
  theme_name: string;
  entries: string[];
  count: number;
}

export interface MemoryLibraryData {
  timeline: MemoryTimelineItem[];
  by_type: Record<string, string[]>;
  by_theme: MemoryThemeItem[];
}

export interface ProfileThemeItem {
  theme_name: string;
  reason: string;
  evidence_entries: string[];
}

export interface AbilityTagItem {
  ability_name: string;
  reason: string;
  evidence_entries: string[];
}

export interface PersonalProfileResult {
  knowledge_base_id: string;
  entry_count: number;
  profile_summary: string;
  main_themes: ProfileThemeItem[];
  ability_tags: AbilityTagItem[];
  expression_style: string;
  growth_focus: string[];
}

export interface ThemeChangeItem {
  theme_name: string;
  change_type: string;
  reason: string;
  evidence_entries: string[];
}

export interface GrowthReportResult {
  knowledge_base_id: string;
  analysis_window: string;
  stage_summary: string;
  recent_focus: string[];
  theme_changes: ThemeChangeItem[];
  highlights: string[];
  blockers: string[];
  next_actions: string[];
}

export interface GrowthAdviceAction {
  area: string;
  why_now: string;
  action: string;
  first_step: string;
  evidence_entries: string[];
}

export interface GrowthAdviceResult {
  knowledge_base_id: string;
  focus_goal: string | null;
  advice_summary: string;
  current_priorities: string[];
  action_suggestions: GrowthAdviceAction[];
  avoid_list: string[];
  one_week_plan: string[];
  reflection_questions: string[];
}

export interface GraphNodeData {
  id: string;
  entity_id: string;
  node_type: 'user' | 'knowledge_base' | 'document' | 'memory_entry';
  label: string;
  parent_id: string | null;
  depth: number;
  metadata: Record<string, unknown>;
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  edge_type: 'owns' | 'contains' | 'extracts' | 'related';
  metadata: Record<string, unknown>;
}

export interface GraphData {
  scope: 'user' | 'knowledge_base' | 'document';
  generated_at: string;
  root_node_id: string;
  include_memory: boolean;
  include_relationships: boolean;
  relationship_strategy: string | null;
  relationship_scope: string | null;
  min_shared_memory_count: number | null;
  min_relationship_score: number | null;
  max_related_edges: number | null;
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  node_count: number;
  edge_count: number;
  node_type_counts: Record<string, number>;
  edge_type_counts: Record<string, number>;
}

export interface CompanionCitationItem {
  document_id: string;
  chunk_id: string;
  page_no: number | null;
  text: string;
  reason: string;
}

export interface CompanionAnswerResult {
  knowledge_base_id: string;
  question: string;
  direct_answer: string;
  citations: CompanionCitationItem[];
  profile_snapshot: string;
  growth_snapshot: string;
  next_step_hint: string;
  follow_up_questions: string[];
  companion_message: string;
}

export interface AssistantTurn {
  id: string;
  question: string;
  response?: CompanionAnswerResult;
  error?: string;
}

export type View = 'dashboard' | 'notes' | 'graph' | 'review' | 'chat';
