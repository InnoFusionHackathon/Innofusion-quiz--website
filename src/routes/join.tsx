import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Swords } from "lucide-react";
import { useState } from "react";
import { useQuiz } from "@/store/quiz-store";
import { toast } from "sonner";

export const Route = createFileRoute("/join")({
  head: () => ({ meta: [{ title: "Join the Battle — QuizForge" }] }),
  component: Join,
});

function Join() {
  const { joinAsParticipant, state } = useQuiz();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!name.trim() || name.trim().length < 3) errs.name = "Name must be at least 3 characters";
    if (!/^\d{10}$/.test(phone)) errs.phone = "Phone must be exactly 10 digits";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (state.status === "running" || state.status === "finished") {
      toast.error("Battle already underway. New warriors cannot join!");
      return;
    }

    setIsSubmitting(true);
    try {
      await joinAsParticipant(name.trim(), phone);
      toast.success("You have entered the arena!");
      navigate({ to: "/lobby" });
    } catch (error: any) {
      toast.error(error.message || "Failed to join the quiz");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-10 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md wood-panel p-8"
      >
        <div className="text-center mb-6">
          <div className="mx-auto inline-flex rounded-xl gold-panel p-3 mb-3">
            <Swords className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-black text-gold">Enlist for Battle</h1>
          <p className="mt-2 text-sm text-muted-foreground">Forge your identity, warrior.</p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-gold">Full Name</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full rounded-lg border-2 border-border bg-input/50 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
            />
            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
          </div>
          <div>
            <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-gold">Phone Number</label>
            <input
              type="tel" value={phone} maxLength={10}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="10-digit number"
              className="w-full rounded-lg border-2 border-border bg-input/50 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
            />
            {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-medieval w-full text-lg disabled:opacity-50">
            <Swords className="h-5 w-5" /> {isSubmitting ? "Joining..." : "Join Battle"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
