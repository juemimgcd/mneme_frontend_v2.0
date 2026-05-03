import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, ChevronDown, LogOut, Search } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { MemoryReview } from './components/MemoryReview';
import { AssistantPanel } from './components/AssistantPanel';
import { AuthScreen } from './components/AuthScreen';
import {
  analysisApi,
  authApi,
  backendConfig,
  companionApi,
  documentApi,
  graphApi,
  knowledgeBaseApi,
  memoryApi,
  taskApi,
} from './services/backend';
import type {
  ArchiveDocument,
  AssistantTurn,
  GraphData,
  GrowthReportResult,
  KnowledgeBase,
  MemoryLibraryData,
  PersonalProfileResult,
  UserProfile,
  View,
} from './types';
import { initialsFromName } from './lib/format';

const STORAGE_TOKEN_KEY = 'mindarchive_token';
const TERMINAL_TASK_STATUSES = new Set(['completed', 'failed', 'canceled', 'indexed']);

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [token, setToken] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : window.localStorage.getItem(STORAGE_TOKEN_KEY),
  );
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [appError, setAppError] = useState<string | null>(null);

  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKnowledgeBaseId, setSelectedKnowledgeBaseId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<ArchiveDocument[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [memoryLibrary, setMemoryLibrary] = useState<MemoryLibraryData | null>(null);
  const [selectedDocumentMemory, setSelectedDocumentMemory] = useState<MemoryLibraryData | null>(null);
  const [growthReport, setGrowthReport] = useState<GrowthReportResult | null>(null);
  const [profile, setProfile] = useState<PersonalProfileResult | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [documentGraph, setDocumentGraph] = useState<GraphData | null>(null);

  const [assistantTurns, setAssistantTurns] = useState<AssistantTurn[]>([]);
  const [assistantPending, setAssistantPending] = useState(false);

  const [dataLoading, setDataLoading] = useState(false);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [rebuildingMemory, setRebuildingMemory] = useState(false);
  const [pendingTaskIds, setPendingTaskIds] = useState<Record<string, string>>({});
  const [graphOptions, setGraphOptions] = useState({
    includeMemory: false,
    includeRelationships: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedKnowledgeBase = useMemo(
    () => knowledgeBases.find((item) => item.id === selectedKnowledgeBaseId) ?? null,
    [knowledgeBases, selectedKnowledgeBaseId],
  );
  const selectedDocument = useMemo(
    () => documents.find((item) => item.id === selectedDocumentId) ?? null,
    [documents, selectedDocumentId],
  );
  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return documents;
    }

    return documents.filter((document) =>
      [document.file_name, document.file_type, document.status].some((value) => value.toLowerCase().includes(query)),
    );
  }, [documents, searchQuery]);

  const hydrateSession = useCallback(async (sessionToken: string) => {
    const profile = await authApi.me(sessionToken);
    setUser(profile);
    return profile;
  }, []);

  const refreshKnowledgeBases = useCallback(
    async (sessionUser: UserProfile, sessionToken: string, preferredKnowledgeBaseId?: string | null) => {
      const response = await knowledgeBaseApi.list(sessionUser.id, sessionToken);
      setKnowledgeBases(response.items);
      setSelectedKnowledgeBaseId((previous) => {
        if (preferredKnowledgeBaseId && response.items.some((item) => item.id === preferredKnowledgeBaseId)) {
          return preferredKnowledgeBaseId;
        }
        if (previous && response.items.some((item) => item.id === previous)) {
          return previous;
        }
        return response.items[0]?.id ?? null;
      });
      return response.items;
    },
    [],
  );

  const refreshKnowledgeBaseData = useCallback(
    async (
      knowledgeBaseId: string,
      options: {
        background?: boolean;
        preferredDocumentId?: string | null;
      } = {},
    ) => {
      if (!token) {
        return;
      }

      if (!options.background) {
        setDataLoading(true);
      }

      try {
        const [documentResult, memoryResult, growthResult, profileResult, graphResult] = await Promise.all([
          documentApi.list(token, knowledgeBaseId),
          memoryApi.byKnowledgeBase(token, knowledgeBaseId),
          analysisApi.growth(token, knowledgeBaseId),
          analysisApi.profile(token, knowledgeBaseId),
          graphApi.byKnowledgeBase(token, knowledgeBaseId, {
            includeMemory: graphOptions.includeMemory,
            includeRelationships: graphOptions.includeRelationships,
          }),
        ]);

        setDocuments(documentResult.items);
        setMemoryLibrary(memoryResult);
        setGrowthReport(growthResult);
        setProfile(profileResult);
        setGraphData(graphResult);
        setAssistantTurns([]);
        setSelectedDocumentId((previous) => {
          if (options.preferredDocumentId && documentResult.items.some((item) => item.id === options.preferredDocumentId)) {
            return options.preferredDocumentId;
          }
          if (previous && documentResult.items.some((item) => item.id === previous)) {
            return previous;
          }
          return documentResult.items[0]?.id ?? null;
        });
      } catch (error) {
        setAppError(error instanceof Error ? error.message : 'Failed to load knowledge base data.');
      } finally {
        if (!options.background) {
          setDataLoading(false);
        }
      }
    },
    [graphOptions.includeMemory, graphOptions.includeRelationships, token],
  );

  const refreshSelectedDocument = useCallback(
    async (documentId: string) => {
      if (!token) {
        return;
      }

      setDocumentLoading(true);
      try {
        const [memoryResult, graphResult] = await Promise.all([
          memoryApi.byDocument(token, documentId),
          graphApi.byDocument(token, documentId, {
            includeMemory: true,
            includeRelationships: true,
          }),
        ]);
        setSelectedDocumentMemory(memoryResult);
        setDocumentGraph(graphResult);
      } catch (error) {
        setAppError(error instanceof Error ? error.message : 'Failed to load document details.');
      } finally {
        setDocumentLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (!token) {
      setUser(null);
      setKnowledgeBases([]);
      setSelectedKnowledgeBaseId(null);
      setDocuments([]);
      setSelectedDocumentId(null);
      setMemoryLibrary(null);
      setSelectedDocumentMemory(null);
      setGrowthReport(null);
      setProfile(null);
      setGraphData(null);
      setDocumentGraph(null);
      return;
    }

    let cancelled = false;

    const loadSession = async () => {
      try {
        const sessionUser = await hydrateSession(token);
        if (cancelled) {
          return;
        }
        await refreshKnowledgeBases(sessionUser, token);
      } catch (error) {
        if (cancelled) {
          return;
        }
        window.localStorage.removeItem(STORAGE_TOKEN_KEY);
        setToken(null);
        setAuthError(error instanceof Error ? error.message : 'Session expired.');
      }
    };

    loadSession();
    return () => {
      cancelled = true;
    };
  }, [hydrateSession, refreshKnowledgeBases, token]);

  useEffect(() => {
    if (!selectedKnowledgeBaseId || !token) {
      return;
    }

    refreshKnowledgeBaseData(selectedKnowledgeBaseId);
  }, [refreshKnowledgeBaseData, selectedKnowledgeBaseId, token]);

  useEffect(() => {
    if (!selectedDocumentId || !token) {
      setSelectedDocumentMemory(null);
      setDocumentGraph(null);
      return;
    }

    refreshSelectedDocument(selectedDocumentId);
  }, [refreshSelectedDocument, selectedDocumentId, token]);

  useEffect(() => {
    const tasks = Object.entries(pendingTaskIds);
    if (!token || tasks.length === 0) {
      return;
    }

    const intervalId = window.setInterval(async () => {
      for (const [documentId, taskId] of tasks) {
        try {
          const task = await taskApi.get(token, taskId);
          if (!TERMINAL_TASK_STATUSES.has(task.status)) {
            continue;
          }

          setPendingTaskIds((previous) => {
            const next = { ...previous };
            delete next[documentId];
            return next;
          });

          if (task.status === 'failed' && task.error_message) {
            setAppError(task.error_message);
          }

          if (selectedKnowledgeBaseId) {
            await refreshKnowledgeBaseData(selectedKnowledgeBaseId, {
              background: true,
              preferredDocumentId: documentId,
            });
          }
        } catch (error) {
          setAppError(error instanceof Error ? error.message : 'Failed to poll indexing task.');
        }
      }
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [pendingTaskIds, refreshKnowledgeBaseData, selectedKnowledgeBaseId, token]);

  const persistToken = (nextToken: string | null) => {
    if (nextToken) {
      window.localStorage.setItem(STORAGE_TOKEN_KEY, nextToken);
    } else {
      window.localStorage.removeItem(STORAGE_TOKEN_KEY);
    }
    setToken(nextToken);
  };

  const handleAuthSubmit = async (payload: {
    mode: 'login' | 'register';
    username: string;
    password: string;
    displayName: string;
  }) => {
    setAuthBusy(true);
    setAuthError(null);

    try {
      if (payload.mode === 'register') {
        await authApi.register(payload.username, payload.password, payload.displayName);
      }

      const auth = await authApi.login(payload.username, payload.password);
      persistToken(auth.access_token);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = () => {
    persistToken(null);
    setView('dashboard');
    setAssistantTurns([]);
    setPendingTaskIds({});
  };

  const handleUploadDocument = () => {
    if (!selectedKnowledgeBaseId) {
      setAppError('Please select a knowledge base first.');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !token || !selectedKnowledgeBaseId) {
      return;
    }

    setUploadBusy(true);
    setAppError(null);

    try {
      const uploadResult = await documentApi.upload(token, file, selectedKnowledgeBaseId);
      const uploadedId = uploadResult.id ?? uploadResult.document_id;
      if (selectedKnowledgeBaseId) {
        await refreshKnowledgeBaseData(selectedKnowledgeBaseId, {
          background: true,
          preferredDocumentId: uploadedId,
        });
      }
      setView('notes');
      if (uploadedId) {
        setSelectedDocumentId(uploadedId);
        const task = await documentApi.index(token, uploadedId);
        setPendingTaskIds((previous) => ({
          ...previous,
          [uploadedId]: task.task_id,
        }));
      }
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setUploadBusy(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!token || !selectedKnowledgeBaseId) {
      return;
    }

    const shouldDelete = window.confirm('Delete this document from the current knowledge base?');
    if (!shouldDelete) {
      return;
    }

    try {
      await documentApi.delete(token, documentId);
      await refreshKnowledgeBaseData(selectedKnowledgeBaseId, { background: true });
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Delete failed.');
    }
  };

  const handleRunIndex = useCallback(
    async (documentId?: string) => {
      const targetId = documentId ?? selectedDocumentId;
      if (!token || !targetId) {
        return;
      }

      try {
        const task = await documentApi.index(token, targetId);
        setPendingTaskIds((previous) => ({
          ...previous,
          [targetId]: task.task_id,
        }));
      } catch (error) {
        setAppError(error instanceof Error ? error.message : 'Unable to start indexing.');
      }
    },
    [selectedDocumentId, token],
  );

  const handleRebuildMemory = async () => {
    if (!token || !selectedKnowledgeBaseId) {
      return;
    }

    setRebuildingMemory(true);
    try {
      await memoryApi.rebuild(token, selectedKnowledgeBaseId);
      await refreshKnowledgeBaseData(selectedKnowledgeBaseId, { background: true });
      if (selectedDocumentId) {
        await refreshSelectedDocument(selectedDocumentId);
      }
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Memory rebuild failed.');
    } finally {
      setRebuildingMemory(false);
    }
  };

  const handleAskAssistant = async (question: string) => {
    if (!token || !selectedKnowledgeBaseId) {
      return;
    }

    const turnId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
    setAssistantPending(true);
    setAssistantTurns((previous) => [{ id: turnId, question }, ...previous]);

    try {
      const response = await companionApi.ask(token, selectedKnowledgeBaseId, question);
      setAssistantTurns((previous) =>
        previous.map((item) => (item.id === turnId ? { ...item, response } : item)),
      );
    } catch (error) {
      setAssistantTurns((previous) =>
        previous.map((item) =>
          item.id === turnId
            ? { ...item, error: error instanceof Error ? error.message : 'Assistant request failed.' }
            : item,
        ),
      );
    } finally {
      setAssistantPending(false);
    }
  };

  if (!token || !user) {
    return <AuthScreen apiBaseUrl={backendConfig.apiBaseUrl} busy={authBusy} error={authError} onSubmit={handleAuthSubmit} />;
  }

  return (
    <div className="flex h-screen bg-brand-bg text-brand-ink selection:bg-brand-accent selection:text-white">
      <Sidebar
        currentView={view}
        onViewChange={setView}
        onUploadDocument={handleUploadDocument}
        user={user}
        uploadBusy={uploadBusy}
      />

      <main className="flex h-screen flex-1 flex-col overflow-hidden">
        <header className="z-10 flex h-20 items-center justify-between border-b border-brand-line bg-white px-10">
          <div className="flex items-center gap-4">
            <div className="group flex w-80 items-center gap-4 rounded-lg bg-[#f1f5f9] px-4 py-2.5">
              <Search size={16} className="text-brand-sub" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-brand-sub"
              />
              <span className="rounded border border-brand-line px-1.5 py-0.5 text-[10px] text-brand-sub opacity-50">⌘K</span>
            </div>

            <div className="hidden items-center gap-2 rounded-lg border border-brand-line bg-white px-3 py-2.5 md:flex">
              <select
                value={selectedKnowledgeBaseId ?? ''}
                onChange={(event) => setSelectedKnowledgeBaseId(event.target.value || null)}
                className="bg-transparent text-sm font-medium outline-none"
              >
                {knowledgeBases.map((knowledgeBase) => (
                  <option key={knowledgeBase.id} value={knowledgeBase.id}>
                    {knowledgeBase.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="text-brand-sub" />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-brand-sub transition-colors hover:text-brand-ink">
              <Bell size={20} />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full border-2 border-white bg-brand-accent" />
            </button>
            <div className="h-6 w-px bg-brand-line" />
            <button
              onClick={handleLogout}
              className="hidden items-center gap-2 text-sm font-medium text-brand-sub transition-colors hover:text-brand-ink lg:flex"
            >
              <LogOut size={16} />
              Log out
            </button>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold tracking-tight">{user.display_name || user.username}</p>
                <p className="text-xs text-brand-sub">{selectedKnowledgeBase?.name ?? 'No knowledge base selected'}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-ink text-xs font-bold text-white">
                {initialsFromName(user.display_name || user.username)}
              </div>
            </div>
          </div>
        </header>

        {appError ? (
          <div className="border-b border-red-100 bg-red-50 px-10 py-3 text-sm text-red-700">{appError}</div>
        ) : null}

        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {view === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="custom-scrollbar h-full overflow-y-auto p-10"
              >
                <Dashboard
                  activeKnowledgeBase={selectedKnowledgeBase}
                  knowledgeBases={knowledgeBases}
                  documents={documents}
                  memoryLibrary={memoryLibrary}
                  graph={graphData}
                  growthReport={growthReport}
                  profile={profile}
                  loading={dataLoading}
                />
              </motion.div>
            )}

            {view === 'notes' && (
              <motion.div key="notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-full">
                <div className="w-96">
                  <NoteList
                    documents={filteredDocuments}
                    selectedDocumentId={selectedDocumentId}
                    onSelectDocument={(document) => setSelectedDocumentId(document.id)}
                    onDeleteDocument={handleDeleteDocument}
                  />
                </div>
                <div className="flex-1">
                  <NoteEditor
                    document={selectedDocument}
                    knowledgeBase={selectedKnowledgeBase}
                    memoryLibrary={selectedDocumentMemory}
                    documentGraph={documentGraph}
                    loadingMemory={documentLoading}
                    indexing={!!(selectedDocument && pendingTaskIds[selectedDocument.id])}
                    rebuildingMemory={rebuildingMemory}
                    onRunIndex={() => handleRunIndex()}
                    onRefreshMemory={() => (selectedDocumentId ? refreshSelectedDocument(selectedDocumentId) : Promise.resolve())}
                    onRebuildMemory={handleRebuildMemory}
                  />
                </div>
              </motion.div>
            )}

            {view === 'graph' && (
              <motion.div key="graph" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <KnowledgeGraph
                  graph={graphData}
                  includeMemory={graphOptions.includeMemory}
                  includeRelationships={graphOptions.includeRelationships}
                  loading={dataLoading}
                  onToggleIncludeMemory={(value) => setGraphOptions((previous) => ({ ...previous, includeMemory: value }))}
                  onToggleIncludeRelationships={(value) =>
                    setGraphOptions((previous) => ({ ...previous, includeRelationships: value }))
                  }
                  onDocumentClick={(documentId) => {
                    setSelectedDocumentId(documentId);
                    setView('notes');
                  }}
                />
              </motion.div>
            )}

            {view === 'review' && (
              <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <MemoryReview memoryLibrary={memoryLibrary} />
              </motion.div>
            )}

            {view === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <AssistantPanel
                  knowledgeBase={selectedKnowledgeBase}
                  turns={assistantTurns}
                  pending={assistantPending}
                  onAsk={handleAskAssistant}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelected}
        className="hidden"
        accept=".pdf,.txt,.md,.docx,.pptx,.xlsx,.xls,.csv,.json,.xml,.html,.htm,.epub"
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: rgba(20, 20, 20, 0.05); }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(20, 20, 20, 0.2); }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(20, 20, 20, 0.4); }
          `,
        }}
      />
    </div>
  );
}
