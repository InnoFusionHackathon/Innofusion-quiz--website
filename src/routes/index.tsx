import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Crown, Shield, Swords, Timer, Trophy, Users } from "lucide-react";

export const Route = createFileRoute("/")(({
  head: () => ({
    meta: [
      { title: "QuizForge — Real-Time Quiz Arena | HackOS" },
      { name: "description", content: "Real-time competitive quiz battles. Speed-based scoring, live leaderboard, medieval gaming UI. Powered by HackOS." },
    ],
  }),
  component: Landing,
}));

const features = [
  { icon: Trophy, title: "Real-Time Leaderboard", desc: "Live ranks update after every battle round." },
  { icon: Timer, title: "Speed-Based Scoring", desc: "Faster answers earn more glory points." },
  { icon: Shield, title: "Curated Questions", desc: "Expertly forged questions across all domains." },
  { icon: Users, title: "Live Competition", desc: "Warriors clash simultaneously in the arena." },
];

function Landing() {
  return (
    <div className="px-4 sm:px-8 relative min-h-screen">
      <div 
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/bg.png)' }}
      />
      <section className="relative z-10 mx-auto max-w-5xl pt-8 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/40 px-4 py-1.5 text-xs uppercase tracking-widest text-gold"
        >
          <Crown className="h-3.5 w-3.5" /> HackOS presents QuizForge
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: "spring" }}
          className="mt-6 font-display text-5xl sm:text-7xl lg:text-8xl font-black text-gold text-stroke leading-[0.95]"
        >
          QuizForge
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="mt-2 font-display text-lg sm:text-2xl text-gold/70 uppercase tracking-[0.15em]"
        >
          Live Quiz Battle
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="mt-4 text-base sm:text-xl text-muted-foreground"
        >
          ⚔️ Think Fast. Answer Faster. Conquer the Leaderboard. ⚔️
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/join" className="btn-medieval text-lg w-full sm:w-auto">
            <Swords className="h-5 w-5" /> Join Quiz
          </Link>
          <Link
            to="/admin"
            className="btn-stone text-lg w-full sm:w-auto"
          >
            <Shield className="h-5 w-5" /> Admin Login
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}
          className="mt-16 flex justify-center"
        >
          <div className="relative">
            <div className="absolute inset-0 blur-3xl bg-gold/20 rounded-full" />
            <div className="relative rotate-[-2deg] hover:rotate-0 transition-transform">
              <img src="/warrior.png" alt="Warrior" className="h-48 sm:h-64 object-contain animate-pulse drop-shadow-2xl" />
            </div>
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl pb-20">
        <h2 className="text-center font-display text-3xl sm:text-4xl font-black text-gold mb-10">⚜️ Battle Features ⚜️</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="wood-panel p-6 text-center"
            >
              <div className="mx-auto mb-4 inline-flex rounded-xl gold-panel p-3">
                <f.icon className="h-7 w-7" />
              </div>
              <h3 className="font-display text-lg font-bold text-gold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
