import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Download, ListChecks, Play, RotateCcw, SkipForward, Square, Trophy, Users, Shield } from "lucide-react";
import { useQuiz } from "@/store/quiz-store";
import { Leaderboard } from "@/components/Leaderboard";
import { toast } from "sonner";
import { useEffect, useState, useCallback } from "react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — QuizForge" }] }),
  component: Admin,
});

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <div className="wood-panel p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="mt-1 font-display text-3xl font-black text-gold">{value}</div>
        </div>
        <div className="rounded-xl gold-panel p-2.5"><Icon className="h-6 w-6" /></div>
      </div>
    </div>
  );
}

type AdminQuestion = {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
};

function Admin() {
  const { state, startQuiz, endQuiz, resetQuiz, nextQuestion, socket } = useQuiz();
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);

  const downloadResults = () => {
    const sorted = [...state.participants].sort((a, b) => b.score - a.score || a.responseTime - b.responseTime);
    const lines = ["Rank,Name,Phone,Score,Avg Response Time (s)"];
    sorted.forEach((p, i) => lines.push(`${i + 1},${p.name},${p.phone},${p.score},${p.responseTime}`));
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "quizforge-results.csv"; a.click();
    URL.revokeObjectURL(url);
  };
  // Auth lives ONLY in React state — never persisted to sessionStorage / localStorage / cookies.
  // Every page visit or refresh requires a fresh login.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminId, setAdminId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const ADMIN_ID = "innofusion";
  const ADMIN_PASSWORD = "#_Asif01_#_Pratyay02_#_Dipti03_#_Innofusion3_#";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminId === ADMIN_ID && adminPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Invalid ID or password. Please try again.");
      setAdminPassword(""); // clear password on failure for security
    }
  };

  // Admin joins the socket room on mount
  useEffect(() => {
    if (socket) {
      socket.emit("admin_join");
    }
  }, [socket]);

  // Fetch questions from admin status endpoint
  const fetchAdminData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/status`);
      const data = await res.json();
      if (data.success && data.questions) {
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // Question Management State
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [qFormData, setQFormData] = useState({ question: "", options: ["", "", "", ""], correctIndex: 0 });

  const openAddModal = () => {
    setQFormData({ question: "", options: ["", "", "", ""], correctIndex: 0 });
    setEditingQuestionId(null);
    setIsQuestionModalOpen(true);
  };

  const openEditModal = (q: AdminQuestion) => {
    const opts = [...q.options];
    while (opts.length < 4) opts.push("");
    const correctIdx = Math.max(0, q.options.indexOf(q.correct_answer));
    setQFormData({ question: q.question, options: opts.slice(0, 4), correctIndex: correctIdx });
    setEditingQuestionId(q.id);
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const correct_answer = qFormData.options[qFormData.correctIndex];
    if (!qFormData.question || qFormData.options.some(o => !o.trim()) || !correct_answer) {
      toast.error("Please fill all fields properly");
      return;
    }

    const payload = {
      question: qFormData.question,
      options: qFormData.options.filter(o => o.trim()),
      correct_answer
    };

    try {
      let res;
      if (editingQuestionId) {
        res = await fetch(`${API_BASE}/api/admin/questions/${editingQuestionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE}/api/admin/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }
      
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setIsQuestionModalOpen(false);
        fetchAdminData();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Failed to save question");
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/questions/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Question deleted");
        fetchAdminData();
      }
    } catch (err) {
      toast.error("Failed to delete question");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="px-4 py-10 sm:py-16 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="mx-auto w-full max-w-md wood-panel p-8"
        >
          <div className="text-center mb-8">
            <div className="mx-auto inline-flex rounded-xl gold-panel p-3 mb-3">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="font-display text-3xl font-black text-gold">Admin Login</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your credentials to access the war room.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5" autoComplete="off">
            {/* ID field */}
            <div>
              <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-gold">
                Admin ID
              </label>
              <input
                type="text"
                value={adminId}
                onChange={e => setAdminId(e.target.value)}
                placeholder="Enter admin ID"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                required
                className="w-full rounded-lg border-2 border-border bg-input/50 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none transition-colors"
              />
            </div>

            {/* Password field */}
            <div>
              <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-gold">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="new-password"
                  required
                  className="w-full rounded-lg border-2 border-border bg-input/50 px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold transition-colors text-xs font-bold uppercase tracking-wider"
                  tabIndex={-1}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-xs text-destructive font-semibold"
              >
                ⚠️ {error}
              </motion.p>
            )}

            <button
              type="submit"
              className="btn-medieval w-full text-lg"
              disabled={!adminId || !adminPassword}
            >
              <Shield className="h-5 w-5" /> Access Dashboard
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <img src="/admin.png" alt="Admin" className="h-20 sm:h-24 object-contain drop-shadow-xl" />
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-black text-gold">⚔️ Quiz Master Dashboard</h1>
              <p className="text-sm text-muted-foreground">Command the battle from the war room.</p>
            </div>
          </div>
          <div className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest border-2 ${
            state.status === "running" ? "border-emerald-400 text-emerald-300 bg-emerald-400/10" :
            state.status === "finished" ? "border-orange-400 text-orange-300 bg-orange-400/10" :
            "border-border text-muted-foreground"
          }`}>
            Status: {state.status}
          </div>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Participants" value={state.participants.length} icon={Users} />
          <StatCard label="Quiz Status" value={state.status.toUpperCase()} icon={Trophy} />
          <StatCard label="Current Question" value={state.status === "idle" || state.status === "lobby" ? "—" : state.currentQuestionIndex + 1} icon={ListChecks} />
          <StatCard label="Total Questions" value={state.totalQuestions || questions.length} icon={ListChecks} />
        </div>

        <div className="wood-panel p-6">
          <h2 className="font-display text-xl font-bold text-gold mb-4">⚜️ Battle Controls</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <button
              onClick={() => { startQuiz(); toast.success("⚔️ The battle has begun!"); }}
              disabled={state.participants.length === 0 || state.status === "running"}
              className="btn-medieval disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="h-5 w-5" /> Start Quiz
            </button>
            <button
              onClick={() => { nextQuestion(); toast("Next round!"); }}
              disabled={state.status !== "running"}
              className="btn-medieval disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <SkipForward className="h-5 w-5" /> Next Question
            </button>
            <button
              onClick={() => { endQuiz(); toast.success("Battle ended."); }}
              disabled={state.status !== "running"}
              className="btn-stone disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Square className="h-5 w-5" /> End Quiz
            </button>
            <button
              onClick={() => { if (confirm("Reset everything? This wipes all participants.")) { resetQuiz(); toast.success("Arena reset."); } }}
              className="btn-stone"
            >
              <RotateCcw className="h-5 w-5" /> Reset Quiz
            </button>
            <Link to="/leaderboard" className="btn-stone">
              <Trophy className="h-5 w-5" /> Live Leaderboard
            </Link>
            <Link to="/quiz" className="btn-stone">
              <ListChecks className="h-5 w-5" /> View Quiz Screen
            </Link>
            {state.status === "finished" && (
              <button onClick={downloadResults} className="btn-medieval">
                <Download className="h-5 w-5" /> Download Results
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="wood-panel p-6">
            <h2 className="font-display text-xl font-bold text-gold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" /> Participants ({state.participants.length})
            </h2>
            {state.participants.length === 0 ? (
              <p className="text-sm text-muted-foreground">No warriors have enlisted yet.</p>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {state.participants.map(p => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border-2 border-border/60 bg-card/40 px-4 py-2.5">
                    <div>
                      <div className="font-bold">{p.name}</div>
                      <div className="text-xs text-muted-foreground">📞 {p.phone}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display font-black text-gold">{p.score}</div>
                      <div className="text-xs text-muted-foreground">pts</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Leaderboard participants={state.participants} />
        </div>

        <div className="wood-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold text-gold">📜 Question Bank ({questions.length})</h2>
            <button onClick={openAddModal} className="btn-medieval py-1.5 px-4 text-sm flex items-center gap-2">
              <span className="text-xl leading-none">+</span> Add Question
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto space-y-2 text-sm pr-2">
            {questions.map((q, i) => (
              <div key={q.id} className={`rounded-lg border-2 px-4 py-2.5 flex items-center justify-between ${
                i === state.currentQuestionIndex && state.status === "running"
                  ? "border-gold bg-gold/10" : "border-border/60 bg-card/40"
              }`}>
                <div>
                  <div className="font-bold">Q{i + 1}. {q.question}</div>
                  <div className="text-xs text-emerald-400 mt-0.5">✓ {q.correct_answer}</div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => openEditModal(q)} className="p-2 rounded-md hover:bg-white/10 text-muted-foreground hover:text-gold transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {questions.length === 0 && (
              <div className="text-center p-6 text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
                No questions found. Add your first question to begin!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Question Modal */}
      <AnimatePresence>
        {isQuestionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="wood-panel p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-black text-gold">
                  {editingQuestionId ? "Edit Question" : "Add New Question"}
                </h2>
                <button onClick={() => setIsQuestionModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveQuestion} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gold mb-2">Question Text</label>
                  <textarea
                    value={qFormData.question}
                    onChange={e => setQFormData(prev => ({ ...prev, question: e.target.value }))}
                    className="w-full rounded-lg border-2 border-border bg-input/50 px-4 py-3 text-foreground focus:border-gold focus:outline-none min-h-[100px]"
                    placeholder="Enter the question here..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gold mb-2">Options & Correct Answer</label>
                  <div className="space-y-3">
                    {qFormData.options.map((opt, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border-2 ${qFormData.correctIndex === i ? 'border-emerald-500 bg-emerald-500/10' : 'border-border bg-input/30'}`}>
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={qFormData.correctIndex === i}
                          onChange={() => setQFormData(prev => ({ ...prev, correctIndex: i }))}
                          className="w-5 h-5 accent-emerald-500"
                        />
                        <div className="grid h-8 w-8 place-items-center rounded-md gold-panel font-display font-black text-sm shrink-0">
                          {String.fromCharCode(65 + i)}
                        </div>
                        <input
                          type="text"
                          value={opt}
                          onChange={e => {
                            const newOpts = [...qFormData.options];
                            newOpts[i] = e.target.value;
                            setQFormData(prev => ({ ...prev, options: newOpts }));
                          }}
                          placeholder={`Option ${i + 1}`}
                          className="w-full bg-transparent border-none focus:outline-none focus:ring-0 px-2"
                          required
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Select the radio button next to the correct option.</p>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t-2 border-border/50">
                  <button type="button" onClick={() => setIsQuestionModalOpen(false)} className="btn-stone">Cancel</button>
                  <button type="submit" className="btn-medieval">{editingQuestionId ? "Save Changes" : "Add Question"}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
