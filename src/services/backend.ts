import type {
  ArchiveDocument,
  AuthToken,
  CompanionAnswerResult,
  DocumentIndexTask,
  GraphData,
  GrowthAdviceResult,
  GrowthReportResult,
  KnowledgeBase,
  MemoryLibraryData,
  PersonalProfileResult,
  TaskRecord,
  UserProfile,
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '');
const API_PREFIX = import.meta.env.VITE_API_PREFIX ?? '';

type RequestOptions = Omit<RequestInit, 'body'> & {
  token?: string;
  body?: BodyInit | FormData | Record<string, unknown> | undefined;
};

function joinPath(prefix: string, path: string) {
  const normalizedPrefix = prefix.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedPrefix}${normalizedPath}`;
}

function buildCandidatePaths(path: string) {
  const candidates = [API_PREFIX, '', '/api/v1']
    .map((prefix) => joinPath(prefix, path))
    .filter((candidate, index, list) => list.indexOf(candidate) === index);

  return candidates;
}

function extractErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if ('detail' in payload && typeof payload.detail === 'string') {
    return payload.detail;
  }

  if ('message' in payload && typeof payload.message === 'string') {
    return payload.message;
  }

  return null;
}

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, body, headers: rawHeaders, ...rest } = options;
  const headers = new Headers(rawHeaders);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let requestBody: BodyInit | undefined;
  if (body instanceof FormData) {
    requestBody = body;
  } else if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
    requestBody = JSON.stringify(body);
  }

  let lastError: Error | null = null;

  for (const candidatePath of buildCandidatePaths(path)) {
    const response = await fetch(`${API_BASE_URL}${candidatePath}`, {
      ...rest,
      headers,
      body: requestBody,
    });

    if (response.status === 404 && API_PREFIX) {
      lastError = new Error(`Not found for ${candidatePath}`);
      continue;
    }

    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;

    if (!response.ok) {
      throw new Error(extractErrorMessage(payload) ?? `Request failed (${response.status})`);
    }

    if (payload && typeof payload === 'object' && 'code' in payload && payload.code !== 0) {
      throw new Error(extractErrorMessage(payload) ?? 'Request failed');
    }

    if (payload && typeof payload === 'object' && 'data' in payload) {
      return payload.data as T;
    }

    return payload as T;
  }

  throw lastError ?? new Error(`Unable to resolve request path for ${path}`);
}

export const authApi = {
  login(username: string, password: string) {
    return requestJson<AuthToken>('/auth/login', {
      method: 'POST',
      body: { username, password },
    });
  },
  register(username: string, password: string, displayName: string) {
    return requestJson<UserProfile>('/auth/register', {
      method: 'POST',
      body: {
        username,
        password,
        display_name: displayName || null,
      },
    });
  },
  me(token: string) {
    return requestJson<UserProfile>('/auth/me', { token });
  },
};

export const knowledgeBaseApi = {
  list(userId: number, token: string) {
    return requestJson<{ items: KnowledgeBase[]; total: number }>(`/users/${userId}/knowledge-bases`, { token });
  },
  create(userId: number, token: string, name: string, description?: string) {
    return requestJson<KnowledgeBase>(`/users/${userId}/knowledge-bases`, {
      method: 'POST',
      token,
      body: {
        name,
        description: description || null,
      },
    });
  },
};

export const documentApi = {
  list(token: string, knowledgeBaseId?: string) {
    const query = knowledgeBaseId ? `?knowledge_base_id=${encodeURIComponent(knowledgeBaseId)}` : '';
    return requestJson<{ items: ArchiveDocument[]; total: number }>(`/kb/documents${query}`, { token });
  },
  upload(token: string, file: File, knowledgeBaseId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (knowledgeBaseId) {
      formData.append('knowledge_base_id', knowledgeBaseId);
    }

    return requestJson<ArchiveDocument & { document_id?: string }>('/kb/documents/upload', {
      method: 'POST',
      token,
      body: formData,
    });
  },
  index(token: string, documentId: string) {
    return requestJson<DocumentIndexTask>(`/kb/documents/${documentId}/index`, {
      method: 'POST',
      token,
    });
  },
  delete(token: string, documentId: string) {
    return requestJson<unknown>(`/kb/documents/${documentId}`, {
      method: 'DELETE',
      token,
    });
  },
};

export const memoryApi = {
  byKnowledgeBase(token: string, knowledgeBaseId: string) {
    return requestJson<MemoryLibraryData>(`/memory/knowledge-bases/${knowledgeBaseId}/library`, { token });
  },
  byDocument(token: string, documentId: string) {
    return requestJson<MemoryLibraryData>(`/memory/documents/${documentId}/library`, { token });
  },
  rebuild(token: string, knowledgeBaseId: string) {
    return requestJson<{ entry_count: number }>(`/memory/knowledge-bases/${knowledgeBaseId}/rebuild`, {
      method: 'POST',
      token,
    });
  },
};

export const analysisApi = {
  growth(token: string, knowledgeBaseId: string, recentDays = 30) {
    return requestJson<GrowthReportResult>(
      `/analysis/knowledge-bases/${knowledgeBaseId}/growth?recent_days=${recentDays}`,
      { token },
    );
  },
  profile(token: string, knowledgeBaseId: string) {
    return requestJson<PersonalProfileResult>(`/profile/knowledge-bases/${knowledgeBaseId}`, { token });
  },
  advice(token: string, knowledgeBaseId: string, focusGoal?: string) {
    return requestJson<GrowthAdviceResult>(`/advice/knowledge-bases/${knowledgeBaseId}`, {
      method: 'POST',
      token,
      body: {
        focus_goal: focusGoal || null,
      },
    });
  },
};

export const graphApi = {
  byKnowledgeBase(
    token: string,
    knowledgeBaseId: string,
    options: {
      includeMemory?: boolean;
      includeRelationships?: boolean;
      minSharedMemoryCount?: number;
      minRelationshipScore?: number;
      maxRelatedEdges?: number;
    } = {},
  ) {
    const params = new URLSearchParams({
      include_memory: String(options.includeMemory ?? false),
      include_relationships: String(options.includeRelationships ?? true),
      min_shared_memory_count: String(options.minSharedMemoryCount ?? 2),
      min_relationship_score: String(options.minRelationshipScore ?? 0.35),
      max_related_edges: String(options.maxRelatedEdges ?? 80),
    });

    return requestJson<GraphData>(`/graph/knowledge-bases/${knowledgeBaseId}?${params.toString()}`, { token });
  },
  byDocument(
    token: string,
    documentId: string,
    options: {
      includeMemory?: boolean;
      includeRelationships?: boolean;
      relationshipScope?: 'knowledge_base' | 'user';
    } = {},
  ) {
    const params = new URLSearchParams({
      include_memory: String(options.includeMemory ?? false),
      include_relationships: String(options.includeRelationships ?? true),
      relationship_scope: options.relationshipScope ?? 'knowledge_base',
    });

    return requestJson<GraphData>(`/graph/documents/${documentId}?${params.toString()}`, { token });
  },
};

export const companionApi = {
  ask(token: string, knowledgeBaseId: string, question: string, topK = 4) {
    return requestJson<CompanionAnswerResult>(`/companion/knowledge-bases/${knowledgeBaseId}/reply`, {
      method: 'POST',
      token,
      body: {
        question,
        top_k: topK,
      },
    });
  },
};

export const taskApi = {
  get(token: string, taskId: string) {
    return requestJson<TaskRecord>(`/tasks/${taskId}`, { token });
  },
};

export const backendConfig = {
  apiBaseUrl: API_BASE_URL,
};
