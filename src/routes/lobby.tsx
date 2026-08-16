import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Swords, Users } from "lucide-react";
import { useEffect } from "react";
import { useQuiz } from "@/store/quiz-store";

export const Route = createFileRoute("/lobby")({
  head: () => ({ meta: [{ title: "Waiting Lobby — QuizForge" }] }),
  component: Lobby,
});

function Lobby() {
  const { state, me } = useQuiz();
  const navigate = useNavigate();

  useEffect(() => {
    if (!me) navigate({ to: "/join" });
  }, [me, navigate]);

  useEffect(() => {
    if (state.status === "running") navigate({ to: "/quiz" });
    if (state.status === "finished") navigate({ to: "/results" });
  }, [state.status, navigate]);

  if (!me) return null;

  return (
    <div className="px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="wood-panel p-8 text-center"
        >
          <motion.div
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block"
          >
            <img src="/warrior.png" alt="Warrior" className="h-24 sm:h-32 object-contain drop-shadow-2xl" />
          </motion.div>
          <h1 className="mt-4 font-display text-3xl sm:text-4xl font-black text-gold text-stroke">
            Waiting For Quiz Master To Start
          </h1>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-card/50 px-4 py-1.5 text-xs uppercase tracking-widest">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live · Awaiting Battle Horn
          </div>

          <div className="mt-6 inline-block gold-panel rounded-xl px-6 py-4 text-left">
            <div className="text-xs uppercase tracking-widest opacity-70">Your Warrior</div>
            <div className="font-display text-2xl font-black">{me.name}</div>
          </div>
        </motion.div>

        <div className="wood-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gold" />
              <h2 className="font-display text-xl font-bold text-gold">Warriors In Camp</h2>
            </div>
            <div className="rounded-lg gold-panel px-3 py-1 text-sm font-black">
              {state.participants.length}
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto space-y-2 pr-2">
            {state.participants.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center justify-between rounded-lg border-2 px-4 py-3 ${
                  p.id === me.id ? "border-gold bg-gold/10" : "border-border/60 bg-card/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg gold-panel font-black">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold">{p.name}</div>
                  </div>
                </div>
                {p.id === me.id && <span className="text-xs font-bold text-gold uppercase tracking-widest">You</span>}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border-2 border-destructive/50 bg-destructive/10 p-4 text-center text-sm">
          ⚠️ Once the quiz starts, new participants cannot join.
        </div>
      </div>
    </div>
  );
}
