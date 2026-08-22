import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useQuiz, calculatePoints } from "@/store/quiz-store";

export const Route = createFileRoute("/quiz")({
  head: () => ({ meta: [{ title: "Live Battle — QuizForge" }] }),
  component: Quiz,
});

const INTRO_SECONDS = 5;
const ANSWER_SECONDS = 10;
const REVEAL_SECONDS = 4;

function Quiz() {
  const { state, me, submitAnswer, nextQuestion } = useQuiz();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [floatPoints, setFloatPoints] = useState<number | null>(null);
  const [answerStartedAt, setAnswerStartedAt] = useState<number>(0);

  useEffect(() => {
    if (!me) navigate({ to: "/join" });
    else if (state.status === "lobby" || state.status === "idle") navigate({ to: "/lobby" });
    else if (state.status === "finished") navigate({ to: "/results" });
  }, [me, state.status, navigate]);

  // Reset on question change
  useEffect(() => {
    setSelected(null);
    setFloatPoints(null);
  }, [state.currentQuestionIndex, state.currentQuestion?.id]);

  useEffect(() => {
    if (state.phase === "answering") setAnswerStartedAt(Date.now());
  }, [state.phase, state.currentQuestionIndex]);

  const q = state.currentQuestion;
  if (!q || !me) return null;

  // Find the correct answer index for reveal phase highlighting
  const correctAnswerText = state.correctAnswer;
  const correctIndex = q.options.findIndex((opt) => opt === correctAnswerText);

  const handleSelect = (option: string) => {
    if (selected !== null || state.phase !== "answering") return;
    setSelected(option);
    const timeMs = Date.now() - answerStartedAt;
    submitAnswer(me.id, option, timeMs);

    // Check if the selected option matches correct answer (optimistic)
    const pts = calculatePoints(timeMs);
    // We'll get the real result from the server, but show optimistic feedback
    setFloatPoints(pts);
    setTimeout(() => setFloatPoints(null), 1200);
  };

  return (
    <div className="px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="rounded-lg gold-panel px-4 py-2 font-display font-black">
            Question {state.currentQuestionIndex + 1} of {state.totalQuestions}
          </div>
          <div className="rounded-lg bg-card/50 border-2 border-border px-4 py-2 text-sm">
            Warrior: <span className="font-bold text-gold">{me.name}</span> · Score:{" "}
            <span className="font-display font-black text-gold">{me.score}</span>
          </div>
        </div>

        <motion.div
          key={q.id}
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="wood-panel p-6 sm:p-10 text-center"
        >
          <div className="text-xs uppercase tracking-widest text-gold mb-4">⚔️ The Challenge ⚔️</div>
          <h2 className="font-display text-2xl sm:text-4xl font-black leading-tight">{q.question}</h2>
        </motion.div>

        {/* Phase: intro - countdown only (no options from server yet) */}
        {state.phase === "intro" && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-sm text-muted-foreground uppercase tracking-widest">Brace yourself...</div>
            <CountdownTimer
              duration={INTRO_SECONDS}
              size={140}
              resetKey={`intro-${state.currentQuestionIndex}-${q.id}`}
            />
          </div>
        )}

        {/* Phase: answering - options + timer */}
        {state.phase === "answering" && q.options.length > 0 && (
          <>
            <div className="flex flex-col items-center gap-3">
              <CountdownTimer
                duration={ANSWER_SECONDS}
                size={110}
                resetKey={`answer-${state.currentQuestionIndex}-${q.id}`}
              />
              {selected !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  className="rounded-full bg-emerald-500/20 border border-emerald-400 px-4 py-1.5 text-sm font-bold text-emerald-300"
                >
                  ✓ Answer Submitted
                </motion.div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 relative">
              {q.options.map((opt, i) => {
                const isSelected = selected === opt;
                return (
                  <motion.button
                    key={i}
                    whileHover={{ scale: selected === null ? 1.02 : 1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(opt)}
                    disabled={selected !== null}
                    className={`text-left rounded-xl border-2 p-4 sm:p-5 font-bold transition-all ${
                      isSelected
                        ? "border-gold bg-gold/20 ring-2 ring-gold"
                        : "border-border bg-card/60 hover:border-gold/60"
                    } ${selected !== null && !isSelected ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-lg gold-panel font-display font-black">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-base sm:text-lg">{opt}</span>
                    </div>
                  </motion.button>
                );
              })}
              <AnimatePresence>
                {floatPoints !== null && (
                  <motion.div
                    key="float"
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 0, y: -80 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2 }}
                    className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 font-display text-4xl font-black text-emerald-400 text-stroke"
                  >
                    +{floatPoints}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* Phase: reveal */}
        {state.phase === "reveal" && q.options.length > 0 && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {q.options.map((opt, i) => {
                const isCorrect = i === correctIndex;
                const isSelected = selected === opt;
                return (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                    className={`rounded-xl border-2 p-4 sm:p-5 font-bold flex items-center gap-3 ${
                      isCorrect
                        ? "border-emerald-400 bg-emerald-500/20"
                        : isSelected
                        ? "border-destructive bg-destructive/20"
                        : "border-border bg-card/30 opacity-60"
                    }`}
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-lg gold-panel font-display font-black">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {isCorrect && <Check className="h-6 w-6 text-emerald-400" />}
                    {isSelected && !isCorrect && <X className="h-6 w-6 text-destructive" />}
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="wood-panel p-6 text-center"
            >
              <div className="text-xs uppercase tracking-widest text-gold mb-1">Correct Answer</div>
              <div className="font-display text-2xl font-black text-emerald-400">
                {correctAnswerText ?? "—"}
              </div>
              <div className="mt-3 text-lg">
                {selected === correctAnswerText ? (
                  <span className="text-emerald-400 font-bold">✓ Victory — well fought!</span>
                ) : selected !== null ? (
                  <span className="text-destructive font-bold">✗ Fallen — try the next round.</span>
                ) : (
                  <span className="text-muted-foreground">No answer submitted.</span>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-6 mt-8"
            >
              <div className="wood-panel p-6">
                <h2 className="font-display text-2xl font-black text-gold mb-6 flex items-center justify-center gap-2">
                  🏆 Live Standings 🏆
                </h2>
                <div className="space-y-3">
                  {state.leaderboard.slice(0, 5).map((p, i) => (
                    <div key={p.id} className={`flex items-center justify-between p-4 rounded-xl border-2 ${p.id === me.id ? 'border-emerald-400 bg-emerald-500/20' : 'border-gold/30 bg-gold/5'}`}>
                      <div className="flex items-center gap-4">
                        <span className="font-display text-xl font-bold text-gold w-8 text-left">#{i + 1}</span>
                        <span className="font-bold text-lg">{p.name}</span>
                        {p.id === me.id && <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold ml-2">(You)</span>}
                      </div>
                      <div className="font-display font-black text-2xl text-gold">
                        {p.score} <span className="text-sm text-muted-foreground font-sans">pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Show player's own rank if they are not in the top 5 */}
              {(() => {
                const myRank = state.leaderboard.findIndex(p => p.id === me.id) + 1;
                if (myRank > 5) {
                  return (
                    <div className="wood-panel p-4 flex items-center justify-between border-emerald-400 bg-emerald-500/10">
                      <div className="flex items-center gap-4">
                        <span className="font-display text-lg font-bold text-emerald-400 w-8 text-left">#{myRank}</span>
                        <span className="font-bold text-emerald-400">Your Current Rank</span>
                      </div>
                      <div className="font-display font-black text-xl text-emerald-400">
                        {me.score} <span className="text-xs text-muted-foreground font-sans">pts</span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="text-center text-sm text-muted-foreground mt-4">
                Waiting for the next battle...
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
