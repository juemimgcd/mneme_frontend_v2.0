import { useMemo, useState } from 'react';
import { ArrowRight, KeyRound, UserRound } from 'lucide-react';

interface AuthScreenProps {
  apiBaseUrl: string;
  busy: boolean;
  error: string | null;
  onSubmit: (payload: {
    mode: 'login' | 'register';
    username: string;
    password: string;
    displayName: string;
  }) => Promise<void>;
}

export function AuthScreen({ apiBaseUrl, busy, error, onSubmit }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const helperText = useMemo(
    () =>
      mode === 'login'
        ? '连接现有知识库、文档和问答能力。'
        : '先创建账号，系统会自动为你准备默认知识库。',
    [mode],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({ mode, username, password, displayName });
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-ink flex items-center justify-center p-8">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.15fr_0.85fr] border border-brand-line bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] overflow-hidden rounded-[28px]">
        <section className="p-10 lg:p-14 border-b lg:border-b-0 lg:border-r border-brand-line bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-line px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-sub">
            MindArchive
          </div>
          <h1 className="mt-8 text-4xl font-semibold tracking-tight max-w-lg">
            Preserve the current interface, but let it speak to your real backend.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-brand-sub">
            This workspace now expects your Agentic RAG service for authentication, knowledge bases, graph data,
            memory extraction, and companion answers.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ['Documents', '上传后直接进入索引与记忆提取流程'],
              ['Graph', '按知识库回显真实节点和关系'],
              ['Companion', '用后端问答与成长快照回答问题'],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-2xl border border-brand-line bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-sub">{title}</p>
                <p className="mt-3 text-sm leading-6 text-brand-ink">{detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-brand-line bg-slate-50 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-sub">Backend Endpoint</p>
            <p className="mt-2 break-all font-mono text-xs text-brand-ink">{apiBaseUrl}</p>
          </div>
        </section>

        <section className="p-10 lg:p-12">
          <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
            {[
              ['login', '登录'],
              ['register', '注册'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value as 'login' | 'register')}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  mode === value ? 'bg-white text-brand-ink shadow-sm' : 'text-brand-sub hover:text-brand-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-8">
            <p className="text-2xl font-semibold tracking-tight">{mode === 'login' ? 'Welcome back' : 'Create access'}</p>
            <p className="mt-2 text-sm text-brand-sub">{helperText}</p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-sub">
                  <UserRound size={14} />
                  Display Name
                </span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="例如：James Dalton"
                  className="w-full rounded-xl border border-brand-line bg-white px-4 py-3.5 text-sm outline-none transition-colors focus:border-brand-accent"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-sub">
                <UserRound size={14} />
                Username
              </span>
              <input
                required
                minLength={3}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="your_username"
                className="w-full rounded-xl border border-brand-line bg-white px-4 py-3.5 text-sm outline-none transition-colors focus:border-brand-accent"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-sub">
                <KeyRound size={14} />
                Password
              </span>
              <input
                required
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="至少 8 位"
                className="w-full rounded-xl border border-brand-line bg-white px-4 py-3.5 text-sm outline-none transition-colors focus:border-brand-accent"
              />
            </label>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-accent px-5 py-3.5 text-sm font-semibold text-white shadow-sm shadow-brand-accent/20 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? 'Connecting...' : mode === 'login' ? 'Enter Workspace' : 'Create Account'}
              <ArrowRight size={16} />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
