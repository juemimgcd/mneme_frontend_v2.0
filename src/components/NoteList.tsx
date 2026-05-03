import { Clock, FileText, Sparkles, Trash2 } from 'lucide-react';
import type { ArchiveDocument } from '../types';
import { cn } from '../lib/utils';
import { formatDate, relativeStatusLabel } from '../lib/format';

interface NoteListProps {
  documents: ArchiveDocument[];
  selectedDocumentId: string | null;
  onSelectDocument: (document: ArchiveDocument) => void;
  onDeleteDocument: (id: string) => void;
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

export function NoteList({
  documents,
  selectedDocumentId,
  onSelectDocument,
  onDeleteDocument,
}: NoteListProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden border-r border-brand-line bg-brand-sidebar">
      <div className="flex items-center justify-between border-b border-brand-line p-6">
        <h3 className="text-sm font-semibold tracking-tight">Index</h3>
        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-sub">{documents.length} Documents</span>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto overflow-x-hidden">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center opacity-40">
            <FileText size={32} strokeWidth={1.5} />
            <p className="mt-4 text-xs font-medium tracking-tight">No Documents Yet</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-line">
            {documents.map((document) => (
              <div
                key={document.id}
                onClick={() => onSelectDocument(document)}
                className={cn(
                  'group relative cursor-pointer p-5 transition-all',
                  selectedDocumentId === document.id ? 'bg-slate-50' : 'hover:bg-slate-50/50',
                )}
              >
                <div className="mb-1.5 flex items-start justify-between gap-4">
                  <h4
                    className={cn(
                      'truncate pr-3 text-[15px] font-semibold tracking-tight',
                      selectedDocumentId === document.id ? 'text-brand-accent' : 'text-brand-ink',
                    )}
                  >
                    {document.file_name}
                  </h4>
                  {['completed', 'indexed'].includes(document.status) ? (
                    <Sparkles size={12} className="text-brand-accent" />
                  ) : null}
                </div>

                <p className="mb-4 line-clamp-2 text-[13px] leading-relaxed text-brand-sub">
                  {document.file_type.toUpperCase()} document routed to {relativeStatusLabel(document.status)} state.
                </p>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand-sub">
                    <Clock size={10} />
                    {formatDate(document.created_at)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-sm bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-accent">
                      {document.file_type}
                    </span>
                    <span className={cn('rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider', statusTone(document.status))}>
                      {relativeStatusLabel(document.status)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteDocument(document.id);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-2 text-red-600 opacity-0 transition-opacity hover:bg-red-50 hover:opacity-100 group-hover:opacity-40"
                >
                  <Trash2 size={14} />
                </button>

                {selectedDocumentId === document.id ? (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-accent" />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
