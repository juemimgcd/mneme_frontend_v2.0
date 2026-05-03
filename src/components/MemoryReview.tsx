import { useMemo, useState } from 'react';
import { Brain, Check, RefreshCcw, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { MemoryLibraryData } from '../types';

interface ReviewProps {
  memoryLibrary: MemoryLibraryData | null;
}

export function MemoryReview({ memoryLibrary }: ReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});

  const reviewQueue = useMemo(() => memoryLibrary?.timeline ?? [], [memoryLibrary]);
  const currentEntry = reviewQueue[currentIndex];

  const handleScore = (score: number) => {
    if (!currentEntry) {
      return;
    }

    setScores((previous) => ({
      ...previous,
      [currentEntry.entry_id]: score,
    }));

    if (currentIndex < reviewQueue.length - 1) {
      setCurrentIndex((value) => value + 1);
      setShowAnswer(false);
    } else {
      setCurrentIndex(-1);
    }
  };

  if (reviewQueue.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-12 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-brand-accent">
          <Check size={32} />
        </div>
        <h2 className="mb-2 text-2xl font-semibold">Archive Synchronized</h2>
        <p className="max-w-xs text-sm text-brand-sub">
          There are no memory entries available for review yet. Indexing documents will populate this session.
        </p>
      </div>
    );
  }

  if (currentIndex === -1) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-12 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-brand-accent">
          <Check size={32} />
        </div>
        <h2 className="mb-2 text-2xl font-semibold">Session Complete</h2>
        <p className="max-w-sm text-sm leading-7 text-brand-sub">
          You reviewed {reviewQueue.length} extracted memory entries. Use the graph and assistant views to continue exploring connections.
        </p>
        <button
          onClick={() => {
            setCurrentIndex(0);
            setShowAnswer(false);
          }}
          className="mt-8 rounded-lg bg-brand-ink px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
        >
          Restart Session
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-slate-50 p-8">
      <header className="mb-12 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Brain size={20} className="text-brand-accent" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-sub">Memory Cycle</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight">Active Recall Session</h2>
        <div className="mt-4 flex justify-center gap-1">
          {reviewQueue.map((item, index) => (
            <div
              key={item.entry_id}
              className={`h-1 w-8 rounded-full transition-all ${
                index === currentIndex ? 'bg-brand-accent' : index < currentIndex ? 'bg-brand-ink' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </header>

      <div className="relative w-full max-w-2xl perspective-1000">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentEntry.entry_id}
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: -90 }}
            transition={{ duration: 0.4 }}
            className="relative flex min-h-[420px] w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-brand-line bg-white p-10 text-center shadow-xl"
          >
            <div className="pointer-events-none absolute top-0 right-0 p-8 opacity-[0.03]">
              <RefreshCcw size={200} />
            </div>

            {!showAnswer ? (
              <>
                <h3 className="mb-6 text-3xl font-bold tracking-tighter text-brand-ink">{currentEntry.entry_name}</h3>
                <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-sub">{currentEntry.entry_type}</p>
                <p className="mb-12 text-sm text-brand-sub">Recall the meaning, evidence, and why this concept matters.</p>
                <button
                  onClick={() => setShowAnswer(true)}
                  className="rounded-2xl bg-brand-accent px-8 py-4 text-sm font-bold text-white shadow-lg shadow-brand-accent/30 transition-all hover:scale-105 active:scale-95"
                >
                  Show Summary
                </button>
              </>
            ) : (
              <div className="flex h-full w-full flex-col">
                <div className="mb-8 flex-1 overflow-y-auto pr-2 text-left">
                  <div className="rounded-2xl bg-slate-50 p-6 text-sm leading-7 text-brand-ink">{currentEntry.summary}</div>
                </div>

                <div className="flex flex-col gap-6 border-t border-brand-line pt-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-sub">How well did you remember this?</p>
                  <div className="flex justify-between gap-3">
                    {[
                      { label: 'Hard', color: 'text-red-500 bg-red-50', icon: X, score: 1 },
                      { label: 'Good', color: 'text-brand-ink bg-slate-100', icon: RefreshCcw, score: 2 },
                      { label: 'Easy', color: 'text-green-600 bg-green-50', icon: Sparkles, score: 3 },
                    ].map((button) => (
                      <button
                        key={button.label}
                        onClick={() => handleScore(button.score)}
                        className={`flex flex-1 flex-col items-center justify-center rounded-2xl py-4 transition-all hover:scale-105 active:scale-95 ${button.color}`}
                      >
                        <button.icon size={20} className="mb-2" />
                        <span className="text-xs font-bold uppercase tracking-wider">{button.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex gap-3 text-xs text-brand-sub">
        <span>Reviewed: {Object.keys(scores).length}</span>
        <span>Remaining: {Math.max(reviewQueue.length - Math.max(currentIndex, 0) - 1, 0)}</span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `.perspective-1000 { perspective: 1000px; }` }} />
    </div>
  );
}
