import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Leaderboard } from "@/components/Leaderboard";
import { useQuiz } from "@/store/quiz-store";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({ meta: [{ title: "Live Leaderboard — QuizForge" }] }),
  component: LeaderboardPage,
});

const scoringTable = [
  { time: "1 sec", points: 95 },
  { time: "2 sec", points: 90 },
  { time: "3 sec", points: 85 },
  { time: "5 sec", points: 75 },
  { time: "10 sec", points: 50 },
  { time: "Wrong / No Answer", points: 0 },
];

function LeaderboardPage() {
  const { state, me } = useQuiz();
  return (
    <div className="px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col items-center">
          <img src="/leaderboard.png" alt="Trophy Scene" className="h-40 sm:h-56 object-contain drop-shadow-2xl mb-[-20px] relative z-10" />
          <motion.h1
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="text-center font-display text-4xl sm:text-5xl font-black text-gold text-stroke relative z-20"
          >
            🏆 Live Leaderboard 🏆
          </motion.h1>
        </div>

        <Leaderboard participants={state.participants} highlightId={me?.id} />

        <div className="wood-panel p-6">
          <h2 className="font-display text-xl font-bold text-gold mb-4">⚜️ Scoring Codex</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            {scoringTable.map(r => (
              <div key={r.time} className="flex items-center justify-between rounded-lg border-2 border-border/50 bg-card/40 px-4 py-2">
                <span className="text-sm text-muted-foreground">{r.time}</span>
                <span className="font-display font-black text-gold">{r.points}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
