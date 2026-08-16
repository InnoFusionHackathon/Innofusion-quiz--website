import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Crown, Home, Medal, Trophy } from "lucide-react";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Leaderboard } from "@/components/Leaderboard";
import { useQuiz } from "@/store/quiz-store";

export const Route = createFileRoute("/results")({
  head: () => ({ meta: [{ title: "Final Results — QuizForge" }] }),
  component: Results,
});

function Results() {
  const { state, resetQuiz } = useQuiz();
  const sorted = [...state.participants].sort((a, b) => b.score - a.score || a.responseTime - b.responseTime);
  const top3 = sorted.slice(0, 3);

  useEffect(() => {
    const fire = () => confetti({ particleCount: 120, spread: 90, origin: { y: 0.4 }, colors: ["#FFD700", "#F97316", "#fff", "#3B2416"] });
    fire();
    const id = setInterval(fire, 1800);
    return () => clearInterval(id);
  }, []);


  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const heights = ["h-32", "h-44", "h-24"];
  const ranks = [2, 1, 3];
  const icons = [<Trophy key="t" className="h-7 w-7 text-slate-200" />, <Crown key="c" className="h-9 w-9 text-yellow-300" />, <Medal key="m" className="h-6 w-6 text-orange-400" />];

  return (
    <div className="px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center flex flex-col items-center"
        >
          <img src="/leaderboard.png" alt="Trophy Scene" className="h-48 sm:h-64 object-contain drop-shadow-2xl mb-[-30px] relative z-10" />
          <h1 className="font-display text-5xl sm:text-7xl font-black text-gold text-stroke relative z-20">🏆 Quiz Finished</h1>
          <p className="mt-3 text-muted-foreground">The dust settles. The champions are crowned.</p>
        </motion.div>

        {top3.length > 0 && (
          <div className="flex items-end justify-center gap-3 sm:gap-6">
            {podiumOrder.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.2, type: "spring" }}
                className="flex flex-col items-center"
              >
                <div className="mb-3 text-center">
                  {icons[i]}
                  <div className="mt-1 font-display text-base sm:text-xl font-black truncate max-w-[120px]">{p.name}</div>
                  <div className="text-sm text-gold font-bold">{p.score} pts</div>
                </div>
                <div className={`gold-panel w-24 sm:w-32 ${heights[i]} flex items-start justify-center pt-2 font-display text-3xl font-black`}>
                  {ranks[i]}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <Leaderboard participants={state.participants} />

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link to="/" className="btn-stone" onClick={() => resetQuiz()}>
            <Home className="h-5 w-5" /> Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
