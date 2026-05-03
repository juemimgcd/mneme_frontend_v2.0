import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, BookOpen, Brain, Network, Shapes } from 'lucide-react';
import type {
  ArchiveDocument,
  GraphData,
  GrowthReportResult,
  KnowledgeBase,
  MemoryLibraryData,
  PersonalProfileResult,
} from '../types';
import { compactNumber, formatDate } from '../lib/format';

interface DashboardProps {
  activeKnowledgeBase: KnowledgeBase | null;
  knowledgeBases: KnowledgeBase[];
  documents: ArchiveDocument[];
  memoryLibrary: MemoryLibraryData | null;
  graph: GraphData | null;
  growthReport: GrowthReportResult | null;
  profile: PersonalProfileResult | null;
  loading: boolean;
}

function buildDocumentActivity(documents: ArchiveDocument[]) {
  const formatter = new Intl.DateTimeFormat('en', { weekday: 'short' });
  const buckets = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      name: formatter.format(date),
      entries: 0,
    };
  });

  documents.forEach((document) => {
    const key = new Date(document.created_at).toISOString().slice(0, 10);
    const bucket = buckets.find((item) => item.key === key);
    if (bucket) {
      bucket.entries += 1;
    }
  });

  return buckets;
}

function buildThemeIntensity(memoryLibrary: MemoryLibraryData | null) {
  const themes = memoryLibrary?.by_theme ?? [];
  return themes.slice(0, 6).map((theme, index) => ({
    name: theme.theme_name.length > 10 ? `${theme.theme_name.slice(0, 10)}…` : theme.theme_name,
    intensity: theme.count,
    rank: index + 1,
  }));
}

export function Dashboard({
  activeKnowledgeBase,
  knowledgeBases,
  documents,
  memoryLibrary,
  graph,
  growthReport,
  profile,
  loading,
}: DashboardProps) {
  const abilityTags = profile?.ability_tags?.length
    ? profile.ability_tags
    : [{ ability_name: 'Awaiting memory extraction', reason: '', evidence_entries: [] }];
  const documentActivity = buildDocumentActivity(documents);
  const themeIntensity = buildThemeIntensity(memoryLibrary);
  const themeIntensityData = themeIntensity.length ? themeIntensity : [{ name: 'No data', intensity: 0, rank: 0 }];
  const cards = [
    {
      label: 'Knowledge Bases',
      value: compactNumber(knowledgeBases.length),
      icon: Shapes,
    },
    {
      label: 'Documents',
      value: compactNumber(documents.length),
      icon: BookOpen,
    },
    {
      label: 'Memory Entries',
      value: compactNumber(memoryLibrary?.timeline.length ?? 0),
      icon: Brain,
    },
    {
      label: 'Graph Edges',
      value: compactNumber(graph?.edge_count ?? 0),
      icon: Network,
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Project Overview</h2>
          <p className="mt-2 text-sm text-brand-sub">
            {activeKnowledgeBase
              ? `Current scope: ${activeKnowledgeBase.name}`
              : 'Sign in and select a knowledge base to start synchronizing the archive.'}
          </p>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-brand-line bg-white px-5 py-4 shadow-sm">
          <Activity size={18} className="text-brand-accent" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-sub">Last Sync</p>
            <p className="mt-1 text-sm font-semibold text-brand-ink">
              {graph?.generated_at ? formatDate(graph.generated_at, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '--'}
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {cards.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-brand-line bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-lg bg-slate-50 p-2">
                <stat.icon size={18} className="text-brand-accent" />
              </div>
            </div>
            <p className="mb-1 text-xs font-medium text-brand-sub">{stat.label}</p>
            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-brand-line bg-white p-8 shadow-sm">
          <header className="mb-8 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-sub">Upload Activity</h3>
            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-brand-accent">
              {documents.length} total
            </span>
          </header>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={documentActivity}>
                <defs>
                  <linearGradient id="colorEntries" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}
                />
                <Area type="monotone" dataKey="entries" stroke="#3b82f6" fillOpacity={1} fill="url(#colorEntries)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-line bg-white p-8 shadow-sm">
          <header className="mb-8 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-sub">Theme Intensity</h3>
            <div className="flex gap-2">
              <span className="h-2 w-2 rounded-full bg-brand-accent" />
              <span className="h-2 w-2 rounded-full bg-slate-200" />
            </div>
          </header>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={themeIntensityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="intensity"
                  stroke="#0f172a"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#fff', stroke: '#0f172a', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-brand-line bg-white p-8 shadow-sm">
          <header className="mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-sub">Growth Snapshot</h3>
            <p className="mt-2 text-lg font-semibold tracking-tight text-brand-ink">
              {growthReport?.analysis_window ?? 'No analysis window yet'}
            </p>
          </header>
          {loading ? (
            <p className="text-sm text-brand-sub">Loading archive insights...</p>
          ) : growthReport ? (
            <div className="space-y-5">
              <p className="text-sm leading-7 text-brand-ink">{growthReport.stage_summary || 'No growth summary yet.'}</p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-sub">Recent Focus</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(growthReport.recent_focus.length ? growthReport.recent_focus : ['Awaiting indexed content']).slice(0, 4).map((item) => (
                      <span key={item} className="rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-brand-ink shadow-sm">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-sub">Highlights</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-brand-ink">
                    {(growthReport.highlights.length ? growthReport.highlights : ['No highlights yet']).slice(0, 3).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-sub">Next Actions</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-brand-ink">
                    {(growthReport.next_actions.length ? growthReport.next_actions : ['Index more material to unlock guidance']).slice(0, 3).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-7 text-brand-sub">No growth report is available for the selected knowledge base yet.</p>
          )}
        </div>

        <div className="rounded-2xl border border-brand-line bg-white p-8 shadow-sm">
          <header className="mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-sub">Profile Summary</h3>
          </header>
          {profile ? (
            <div className="space-y-5">
              <p className="text-sm leading-7 text-brand-ink">{profile.profile_summary || 'No profile summary yet.'}</p>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-sub">Ability Tags</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {abilityTags.slice(0, 5).map((item) => (
                    <span
                      key={item.ability_name}
                      className="rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-brand-accent"
                    >
                      {item.ability_name}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-sub">Expression Style</p>
                <p className="mt-3 text-sm leading-7 text-brand-sub">{profile.expression_style || '--'}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-7 text-brand-sub">Once the knowledge base has extracted enough memory entries, your profile summary will appear here.</p>
          )}
        </div>
      </div>
    </div>
  );
}
