import { useState } from 'react';
import { ArrowUpRight, Loader2, MessageSquareQuote, Sparkles } from 'lucide-react';
import type { AssistantTurn, KnowledgeBase } from '../types';

interface AssistantPanelProps {
  knowledgeBase: KnowledgeBase | null;
  turns: AssistantTurn[];
  pending: boolean;
  onAsk: (question: string) => Promise<void>;
}

export function AssistantPanel({ knowledgeBase, turns, pending, onAsk }: AssistantPanelProps) {
  const [question, setQuestion] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) {
      return;
    }

    setQuestion('');
    await onAsk(trimmed);
  };

  return (
    <div className="h-full bg-brand-bg p-8 md:p-10">
      <div className="grid h-full gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="flex min-h-0 flex-col rounded-[24px] border border-brand-line bg-white shadow-sm">
          <header className="border-b border-brand-line px-8 py-6">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-sub">
              <MessageSquareQuote size={14} />
              Companion Session
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              {knowledgeBase ? knowledgeBase.name : 'Select a knowledge base'}
            </h2>
            <p className="mt-2 text-sm text-brand-sub">
              Ask across indexed documents and get a response grounded in retrieval, growth context, and profile signals.
            </p>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
            {turns.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-line bg-slate-50">
                  <Sparkles size={26} className="text-brand-accent opacity-70" />
                </div>
                <p className="text-lg font-semibold tracking-tight">Start a grounded conversation</p>
                <p className="mt-3 max-w-md text-sm leading-7 text-brand-sub">
                  Suitable prompts include asking for a document summary, comparing themes across uploads, or requesting a
                  concrete next step from your current knowledge base.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {turns.map((turn) => (
                  <article key={turn.id} className="space-y-4 rounded-[20px] border border-brand-line bg-slate-50/60 p-5">
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-sub">Question</p>
                      <p className="mt-2 text-sm leading-7 text-brand-ink">{turn.question}</p>
                    </div>

                    {turn.error ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{turn.error}</div>
                    ) : turn.response ? (
                      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                        <div className="rounded-2xl border border-brand-line bg-white p-5 shadow-sm">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-sub">Direct Answer</p>
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-brand-ink">
                            {turn.response.direct_answer}
                          </p>
                          <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-7 text-brand-sub">
                            {turn.response.companion_message}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-2xl border border-brand-line bg-white p-5 shadow-sm">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-sub">Next Step</p>
                            <p className="mt-3 text-sm leading-7 text-brand-ink">{turn.response.next_step_hint}</p>
                          </div>

                          <div className="rounded-2xl border border-brand-line bg-white p-5 shadow-sm">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-sub">Snapshots</p>
                            <div className="mt-3 space-y-3 text-sm leading-7 text-brand-sub">
                              <p>{turn.response.profile_snapshot}</p>
                              <p>{turn.response.growth_snapshot}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {turn.response?.citations?.length ? (
                      <div className="rounded-2xl border border-brand-line bg-white p-5 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-sub">Citations</p>
                        <div className="mt-4 space-y-3">
                          {turn.response.citations.slice(0, 4).map((citation) => (
                            <div key={citation.chunk_id} className="rounded-xl border border-brand-line bg-slate-50 px-4 py-3">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-accent">
                                  {citation.document_id}
                                </span>
                                {citation.page_no ? (
                                  <span className="text-[10px] font-medium text-brand-sub">P.{citation.page_no}</span>
                                ) : null}
                              </div>
                              <p className="mt-2 text-sm leading-6 text-brand-ink">{citation.reason}</p>
                              <p className="mt-2 line-clamp-3 text-xs leading-6 text-brand-sub">{citation.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </article>
                ))}

                {pending && (
                  <div className="flex items-center justify-center gap-3 rounded-2xl border border-brand-line bg-white px-4 py-6 text-sm text-brand-sub">
                    <Loader2 size={16} className="animate-spin text-brand-accent" />
                    Companion is building a response...
                  </div>
                )}
              </div>
            )}
          </div>

          <footer className="border-t border-brand-line px-6 py-5">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={knowledgeBase ? 'Ask about your archive...' : 'Choose a knowledge base first'}
                disabled={!knowledgeBase || pending}
                rows={3}
                className="min-h-[90px] flex-1 resize-none rounded-2xl border border-brand-line bg-slate-50 px-4 py-3 text-sm leading-7 outline-none transition-colors focus:border-brand-accent disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!knowledgeBase || pending || !question.trim()}
                className="flex h-[90px] w-[90px] items-center justify-center rounded-2xl bg-brand-accent text-white shadow-sm shadow-brand-accent/20 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                title="Send question"
              >
                <ArrowUpRight size={22} />
              </button>
            </form>
          </footer>
        </section>

        <aside className="flex min-h-0 flex-col gap-5">
          <div className="rounded-[24px] border border-brand-line bg-white p-6 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-sub">Current Scope</p>
            <p className="mt-3 text-lg font-semibold tracking-tight text-brand-ink">
              {knowledgeBase?.name ?? 'No active knowledge base'}
            </p>
            <p className="mt-2 text-sm leading-7 text-brand-sub">
              The assistant uses the active knowledge base for retrieval and combines it with growth and profile analysis.
            </p>
          </div>

          <div className="rounded-[24px] border border-brand-line bg-white p-6 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-sub">Suggested Prompts</p>
            <div className="mt-4 space-y-3">
              {[
                'Summarize the strongest themes in this knowledge base.',
                'Which documents look most connected right now?',
                'What should I work on next based on recent growth?',
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setQuestion(prompt)}
                  className="w-full rounded-2xl border border-brand-line bg-slate-50 px-4 py-3 text-left text-sm leading-6 text-brand-ink transition-colors hover:border-brand-accent hover:bg-blue-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-brand-line bg-slate-900 p-6 text-white shadow-lg">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Session Trace</p>
            <div className="mt-4 space-y-3 text-sm text-slate-100">
              <div className="flex items-center justify-between">
                <span>Turns</span>
                <span className="font-semibold">{turns.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Latest state</span>
                <span className="font-semibold">{pending ? 'Thinking' : turns[0] ? 'Ready' : '--'}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
