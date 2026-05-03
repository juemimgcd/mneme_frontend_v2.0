import { useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  GitBranch,
  Info,
  Layout,
  Loader2,
  RefreshCcw,
  Sparkles,
} from 'lucide-react';
import type { ArchiveDocument, GraphData, KnowledgeBase, MemoryLibraryData } from '../types';
import { cn } from '../lib/utils';
import { formatBytes, formatDateTime, relativeStatusLabel } from '../lib/format';

interface NoteEditorProps {
  document: ArchiveDocument | null;
  knowledgeBase: KnowledgeBase | null;
  memoryLibrary: MemoryLibraryData | null;
  documentGraph: GraphData | null;
  loadingMemory: boolean;
  indexing: boolean;
  rebuildingMemory: boolean;
  onRunIndex: () => Promise<void>;
  onRefreshMemory: () => Promise<void>;
  onRebuildMemory: () => Promise<void>;
}

function statusTone(status: string) {
  if (['completed', 'indexed'].includes(status)) {
    return 'text-green-600 bg-green-50';
  }

  if (status === 'failed') {
    return 'text-red-600 bg-red-50';
  }

  if (['queued', 'indexing', 'parsing', 'chunking', 'embedding', 'vector_upserting'].includes(status)) {
    return 'text-amber-700 bg-amber-50';
  }

  return 'text-brand-sub bg-slate-100';
}

export function NoteEditor({
  document,
  knowledgeBase,
  memoryLibrary,
  documentGraph,
  loadingMemory,
  indexing,
  rebuildingMemory,
  onRunIndex,
  onRefreshMemory,
  onRebuildMemory,
}: NoteEditorProps) {
  const [preview, setPreview] = useState(false);

  const relatedConnections = useMemo(() => {
    if (!documentGraph) {
      return [];
    }

    const nodesById = new Map(documentGraph.nodes.map((node) => [node.id, node]));
    return documentGraph.edges
      .filter((edge) => edge.edge_type === 'related')
      .map((edge) => {
        const source = nodesById.get(edge.source);
        const target = nodesById.get(edge.target);
        const counterpart = source?.entity_id === document?.id ? target : source;
        return {
          id: edge.id,
          label: counterpart?.label ?? 'Related document',
          score: Number(edge.metadata.relationship_score ?? 0),
          shared: Number(edge.metadata.shared_memory_count ?? 0),
        };
      })
      .filter((item, index, list) => item.label && list.findIndex((candidate) => candidate.label === item.label) === index)
      .slice(0, 5);
  }, [documentGraph, document?.id]);

  if (!document) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-white p-12 text-center">
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-line bg-slate-50">
          <BookOpen className="text-brand-sub opacity-40" size={32} />
        </div>
        <h2 className="mb-2 text-2xl font-semibold tracking-tight text-brand-ink">Select a Document</h2>
        <p className="max-w-xs text-sm leading-relaxed text-brand-sub">
          Choose a file from the archive index to inspect extraction results, graph relationships, and indexing status.
        </p>
      </div>
    );
  }

  const memoryEntries = memoryLibrary?.timeline ?? [];
  const themeGroups = memoryLibrary?.by_theme ?? [];
  const typeGroups = Object.entries(memoryLibrary?.by_type ?? {});

  return (
    <div className="flex h-full flex-1 overflow-hidden bg-white">
      <div className="flex h-full flex-1 flex-col border-r border-brand-line">
        <header className="flex items-center justify-between border-b border-brand-line px-8 py-6">
          <div className="flex-1">
            <h2 className="truncate text-2xl font-semibold tracking-tight text-brand-ink">{document.file_name}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-sub">Doc: {document.id}</span>
              <span className={cn('rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider', statusTone(document.status))}>
                {relativeStatusLabel(document.status)}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-green-600">
                KB: {knowledgeBase?.name ?? document.knowledge_base_id}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setPreview((value) => !value)}
              className={cn(
                'rounded-lg border border-brand-line p-2.5 transition-all',
                preview ? 'border-brand-accent bg-slate-50 text-brand-accent' : 'text-brand-sub hover:bg-slate-50',
              )}
              title="Toggle grouped view"
            >
              <Layout size={18} />
            </button>
            <button
              onClick={onRunIndex}
              disabled={indexing}
              className="flex items-center gap-2 rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-accent/20 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {indexing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
              {['completed', 'indexed'].includes(document.status) ? 'Reindex' : 'Run Index'}
            </button>
          </div>
        </header>

        <main className="flex flex-1 overflow-hidden">
          <div className="flex h-full flex-1 flex-col px-8 py-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-sub">
                  {preview ? 'Theme groups' : 'Extracted memory timeline'}
                </p>
                <p className="mt-2 text-sm text-brand-sub">
                  {preview
                    ? 'Grouped concepts extracted from this document.'
                    : 'Chronological memory entries synthesized from the indexed content.'}
                </p>
              </div>
              <button
                onClick={onRefreshMemory}
                disabled={loadingMemory}
                className="rounded-lg border border-brand-line px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-sub transition-colors hover:border-brand-accent hover:text-brand-accent disabled:opacity-50"
              >
                {loadingMemory ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto pr-2">
              {loadingMemory ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Loader2 size={28} className="mb-4 animate-spin text-brand-accent" />
                  <p className="text-sm text-brand-sub">Loading document memory library...</p>
                </div>
              ) : preview ? (
                themeGroups.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {themeGroups.map((theme) => (
                      <div key={theme.theme_name} className="rounded-2xl border border-brand-line bg-slate-50 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-base font-semibold tracking-tight text-brand-ink">{theme.theme_name}</h3>
                          <span className="rounded-md bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-sub shadow-sm">
                            {theme.count}
                          </span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {theme.entries.slice(0, 8).map((entry) => (
                            <span key={entry} className="rounded-md border border-brand-line bg-white px-2.5 py-1 text-[11px] font-semibold text-brand-ink">
                              {entry}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyDocumentState />
                )
              ) : memoryEntries.length > 0 ? (
                <div className="space-y-4">
                  {memoryEntries.map((entry) => (
                    <article key={entry.entry_id} className="rounded-2xl border border-brand-line bg-slate-50 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold tracking-tight text-brand-ink">{entry.entry_name}</h3>
                          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-sub">
                            {entry.entry_type} · {formatDateTime(entry.created_at)}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-brand-sub" />
                      </div>
                      <p className="mt-4 text-sm leading-7 text-brand-ink">{entry.summary}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyDocumentState />
              )}
            </div>
          </div>
        </main>

        <footer className="border-t border-brand-line bg-slate-50/50 px-8 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              document.file_type.toUpperCase(),
              formatBytes(document.file_size),
              formatDateTime(document.created_at),
              `${memoryEntries.length} entries`,
            ].map((item) => (
              <span
                key={item}
                className="rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-accent"
              >
                {item}
              </span>
            ))}
          </div>
        </footer>
      </div>

      <div className="flex h-full w-80 flex-col bg-slate-50">
        <header className="flex items-center justify-between border-b border-brand-line px-6 py-6">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-brand-sub">Archive Signals</h3>
          <Sparkles size={16} className="text-brand-accent" />
        </header>

        <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-6">
          <div>
            <header className="mb-4 flex items-center gap-2">
              <Info size={14} className="text-brand-accent" />
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-brand-sub">Document Summary</h4>
            </header>
            <div className="rounded-xl border border-brand-line bg-white p-4 text-sm leading-relaxed text-brand-ink shadow-sm">
              {memoryEntries[0]?.summary ||
                'Run indexing on this document to populate extraction summaries, theme groups, and related graph edges.'}
            </div>
          </div>

          <div>
            <header className="mb-4 flex items-center gap-2">
              <GitBranch size={14} className="text-brand-accent" />
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-brand-sub">Related Documents</h4>
            </header>
            {relatedConnections.length > 0 ? (
              <div className="space-y-3">
                {relatedConnections.map((item) => (
                  <div key={item.id} className="rounded-xl border border-brand-line bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold tracking-tight text-brand-ink">{item.label}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-brand-sub">
                      <span>{item.shared} shared memories</span>
                      <span>{item.score.toFixed(2)} score</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-7 text-brand-sub">
                Document relationships appear here after memory extraction has enough shared concepts to compare.
              </p>
            )}
          </div>

          <div>
            <header className="mb-4 flex items-center gap-2">
              <Sparkles size={14} className="text-brand-accent" />
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-brand-sub">Type Groups</h4>
            </header>
            <div className="space-y-3">
              {typeGroups.length ? (
                typeGroups.slice(0, 4).map(([type, values]) => (
                  <div key={type} className="rounded-xl border border-brand-line bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold tracking-tight text-brand-ink">{type}</p>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-sub">{values.length}</span>
                    </div>
                    <p className="mt-2 line-clamp-3 text-xs leading-6 text-brand-sub">{values.slice(0, 4).join(' / ')}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-7 text-brand-sub">No grouped memory types are available yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 pt-0">
          <button
            onClick={onRebuildMemory}
            disabled={rebuildingMemory}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-lg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {rebuildingMemory ? 'Rebuilding Memory...' : 'Rebuild KB Memory'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyDocumentState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-line bg-slate-50">
        <Sparkles size={22} className="text-brand-accent opacity-50" />
      </div>
      <p className="text-lg font-semibold tracking-tight text-brand-ink">Awaiting extraction</p>
      <p className="mt-3 max-w-md text-sm leading-7 text-brand-sub">
        This document does not have memory entries yet. Run the indexing task and wait for the backend pipeline to finish.
      </p>
    </div>
  );
}
