import {
  Brain,
  BookOpen,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Share2,
  Zap,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { initialsFromName } from '../lib/format';
import type { UserProfile, View } from '../types';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onUploadDocument: () => void;
  user: UserProfile | null;
  uploadBusy?: boolean;
}

export function Sidebar({ currentView, onViewChange, onUploadDocument, user, uploadBusy = false }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'notes', icon: BookOpen, label: 'Documents' },
    { id: 'graph', icon: Share2, label: 'Knowledge Graph' },
    { id: 'review', icon: Brain, label: 'Memory Review' },
    { id: 'chat', icon: MessageSquare, label: 'Assistant' },
  ] as const;

  const displayName = user?.display_name || user?.username || 'MindArchive';

  return (
    <aside className="sticky top-0 flex h-screen w-[240px] flex-col border-r border-brand-line bg-brand-sidebar px-6 py-8">
      <div className="mb-12 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-accent text-white">
          <Zap size={18} fill="currentColor" />
        </div>
        <span className="text-lg font-semibold tracking-tight">MindArchive</span>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all',
              currentView === item.id
                ? 'bg-[#f1f5f9] text-brand-ink'
                : 'text-brand-sub hover:bg-slate-50 hover:text-brand-ink',
            )}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto border-t border-brand-line pt-8">
        <button
          onClick={onUploadDocument}
          disabled={uploadBusy}
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 py-3 text-sm font-medium text-white shadow-sm shadow-brand-accent/20 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={18} />
          {uploadBusy ? 'Uploading...' : 'Add Document'}
        </button>

        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-ink text-xs font-semibold text-white">
            {initialsFromName(displayName)}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight">{displayName}</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-brand-sub">
              {user ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
