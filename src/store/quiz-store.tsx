/**
 * store/quiz-store.tsx
 * --------------------
 * Central quiz state management connected to the Flask backend
 * via Socket.IO (real-time events) and REST API (join, leaderboard, etc.).
 *
 * Replaces the previous localStorage-only approach with real-time
 * server-backed state synchronization.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";

// ── Backend URL ────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// ── Types ──────────────────────────────────────────────────────

export type Question = {
  id: string;
  question: string;
  options: string[];
  correct_answer?: string;
};

export type Participant = {
  id: string;
  name: string;
  phone: string;
  score: number;
  responseTime: number;
  answers: {
    questionId: string;
    selected: string;
    timeMs: number;
    correct: boolean;
    points: number;
  }[];
};

export type QuizStatus = "idle" | "lobby" | "running" | "finished";
export type QuizPhase = "intro" | "answering" | "reveal";

export type QuizState = {
  status: QuizStatus;
  participants: Participant[];
  currentQuestionIndex: number;
  totalQuestions: number;
  phase: QuizPhase;
  phaseStartedAt: number;
  currentQuestion: Question | null;
  correctAnswer: string | null;
  leaderboard: Participant[];
};

// ── Storage Keys ───────────────────────────────────────────────
const ME_KEY = "startup-clash-me";

// ── Default State ──────────────────────────────────────────────
const defaultState: QuizState = {
  status: "idle",
  participants: [],
  currentQuestionIndex: 0,
  totalQuestions: 0,
  phase: "intro",
  phaseStartedAt: 0,
  currentQuestion: null,
  correctAnswer: null,
  leaderboard: [],
};

// ── Context ────────────────────────────────────────────────────

type Ctx = {
  state: QuizState;
  me: Participant | null;
  socket: Socket | null;
  joinAsParticipant: (name: string, phone: string) => Promise<Participant | null>;
  setMe: (p: Participant | null) => void;
  startQuiz: () => void;
  endQuiz: () => void;
  resetQuiz: () => void;
  nextQuestion: () => void;
  setPhase: (p: QuizPhase) => void;
  submitAnswer: (
    participantId: string,
    selectedOption: string,
    timeMs: number
  ) => void;
};

const QuizContext = createContext<Ctx | null>(null);

// ── Provider ───────────────────────────────────────────────────

export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<QuizState>(defaultState);
  const [me, setMeState] = useState<Participant | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(ME_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const socketRef = useRef<Socket | null>(null);
  const answerSubmittedForQuestion = useRef<string | null>(null);

  // Persist "me" in localStorage for page refresh survival
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (me) localStorage.setItem(ME_KEY, JSON.stringify(me));
    else localStorage.removeItem(ME_KEY);
  }, [me]);

  // ── Socket.IO Connection ──────────────────────────────────

  useEffect(() => {
    // Extract path from SOCKET_URL if it has a sub-path (like /clash-founders-backend)
    const socketUrlObj = new URL(SOCKET_URL, window.location.origin);
    const basePath = socketUrlObj.pathname === "/" ? "" : socketUrlObj.pathname;
    const socketPath = `${basePath}/socket.io`;

    const socket = io(socketUrlObj.origin, {
      path: socketPath,
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🔌 Connected to quiz server:", socket.id);

      // If we have a stored participant, rejoin the lobby
      const storedMe = localStorage.getItem(ME_KEY);
      if (storedMe) {
        const parsed = JSON.parse(storedMe);
        socket.emit("join_lobby", { participant_id: parsed.id });
      }
    });

    socket.on("disconnect", () => {
      console.log("🔌 Disconnected from quiz server");
    });

    socket.on("connect_error", (err) => {
      console.error("Socket Error:", err);
    });

    socket.on("connection_ack", (data: any) => {
      console.log("✅ Server acknowledged:", data.message);
    });

    // ── Quiz Events ────────────────────────────────────────

    socket.on("quiz_state_update", (data: any) => {
      console.log("📡 Quiz state update:", data);
      setState((prev) => ({
        ...prev,
        status:
          data.status === "waiting"
            ? "lobby"
            : data.status === "completed"
              ? "finished"
              : data.status === "running"
                ? "running"
                : prev.status,
        currentQuestionIndex: data.current_question_index ?? prev.currentQuestionIndex,
        totalQuestions: data.total_questions ?? prev.totalQuestions,
      }));
    });

    socket.on("participant_joined", (participant: any) => {
      console.log("👤 Participant joined:", participant.name);
      setState((prev) => {
        const exists = prev.participants.some((p) => p.id === participant.id);
        if (exists) {
          return {
            ...prev,
            participants: prev.participants.map((p) =>
              p.id === participant.id ? participant : p
            ),
          };
        }
        return {
          ...prev,
          participants: [...prev.participants, participant],
        };
      });
    });

    socket.on("quiz_started", (data: any) => {
      console.log("🚀 Quiz started:", data.message);
      setState((prev) => ({
        ...prev,
        status: "running",
        totalQuestions: data.total_questions ?? prev.totalQuestions,
      }));
    });

    socket.on("show_question", (data: any) => {
      console.log("📖 Phase 1 (Intro):", data.question);
      // Reset the answer tracker for the new question
      answerSubmittedForQuestion.current = null;
      setState((prev) => ({
        ...prev,
        status: "running",
        phase: "intro",
        phaseStartedAt: Date.now(),
        currentQuestion: {
          id: data.question_id,
          question: data.question,
          options: [],
        },
        currentQuestionIndex: (data.question_number ?? 1) - 1,
        totalQuestions: data.total_questions ?? prev.totalQuestions,
        correctAnswer: null,
      }));
    });

    socket.on("show_options", (data: any) => {
      console.log("🎯 Phase 2 (Answering):", data.options);
      setState((prev) => ({
        ...prev,
        phase: "answering",
        phaseStartedAt: Date.now(),
        currentQuestion: {
          id: data.question_id,
          question: data.question,
          options: data.options,
        },
      }));
    });

    socket.on("show_correct_answer", (data: any) => {
      console.log("✅ Reveal phase:", data);
      setState((prev) => ({
        ...prev,
        phase: data.phase,
        correctAnswer: data.correct_answer,
        // Make sure options are present for the final reveal UI
        currentQuestion: prev.currentQuestion
          ? { ...prev.currentQuestion, options: data.options }
          : prev.currentQuestion,
      }));
    });

    socket.on("answer_submitted", (data: any) => {
      console.log("📝 Answer result:", data);
      if (data.success && data.is_correct) {
        // Update local "me" score
        setMeState((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            score: prev.score + (data.points ?? 0),
          };
          return updated;
        });
      }
    });

    socket.on("leaderboard_update", (data: any) => {
      console.log("📊 Leaderboard updated:", data.leaderboard?.length, "entries");
      setState((prev) => ({
        ...prev,
        leaderboard: data.leaderboard ?? [],
        participants: data.leaderboard ?? prev.participants,
      }));

      // Update "me" from leaderboard data if found
      setMeState((prev) => {
        if (!prev) return prev;
        const myEntry = data.leaderboard?.find(
          (p: any) => p.id === prev.id
        );
        if (myEntry) {
          return {
            ...prev,
            score: myEntry.score,
            responseTime: myEntry.responseTime ?? prev.responseTime,
            answers: myEntry.answers ?? prev.answers,
          };
        }
        return prev;
      });
    });

    socket.on("quiz_finished", (data: any) => {
      console.log("🏁 Quiz finished:", data.message);
      setState((prev) => ({
        ...prev,
        status: "finished",
        leaderboard: data.leaderboard ?? prev.leaderboard,
        participants: data.leaderboard ?? prev.participants,
      }));
    });

    socket.on("error", (data: any) => {
      console.error("❌ Socket error:", data.message);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // ── REST API Actions ──────────────────────────────────────

  const joinAsParticipant = useCallback(
    async (name: string, phone: string): Promise<Participant | null> => {
      try {
        const response = await fetch(`${API_BASE}/api/participant/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message);
        }

        const participant: Participant = {
          id: data.participant.id,
          name: data.participant.name,
          phone: data.participant.phone,
          score: data.participant.score ?? 0,
          responseTime: data.participant.responseTime ?? 0,
          answers: data.participant.answers ?? [],
        };

        setMeState(participant);

        // Join the Socket.IO lobby room
        if (socketRef.current) {
          socketRef.current.emit("join_lobby", {
            participant_id: participant.id,
          });
        }

        // Update local state
        setState((prev) => ({
          ...prev,
          status: prev.status === "idle" ? "lobby" : prev.status,
          participants: [...prev.participants.filter(p => p.id !== participant.id), participant],
        }));

        return participant;
      } catch (error: any) {
        console.error("Join error:", error.message);
        throw error;
      }
    },
    []
  );

  const startQuiz = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("admin_start_quiz");
    }
  }, []);

  const endQuiz = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("admin_end_quiz");
    }
  }, []);

  const resetQuiz = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/admin/reset`, { method: "POST" });
      setState(defaultState);
      setMeState(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(ME_KEY);
      }
    } catch (error) {
      console.error("Reset error:", error);
    }
  }, []);

  const nextQuestion = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("admin_next_question");
    }
  }, []);

  const setPhase = useCallback((_phase: QuestionPhase) => {
    // Phases are now controlled by the server via Socket.IO events.
    // This is kept for local UI compatibility but doesn't need to do anything.
  }, []);

  const submitAnswer = useCallback(
    (participantId: string, selectedOption: string, timeMs: number) => {
      // Prevent duplicate submissions for the same question
      const questionId = state.currentQuestion?.id;
      if (answerSubmittedForQuestion.current === questionId) {
        console.log("Answer already submitted for this question");
        return;
      }

      if (socketRef.current) {
        answerSubmittedForQuestion.current = questionId ?? null;
        socketRef.current.emit("submit_answer", {
          participant_id: participantId,
          selected_option: selectedOption,
          response_time_ms: timeMs,
        });
      }
    },
    [state.currentQuestion?.id]
  );

  // ── Fetch initial data on mount ──────────────────────────

  useEffect(() => {
    const fetchInitialState = async () => {
      try {
        const [stateRes, participantsRes] = await Promise.all([
          fetch(`${API_BASE}/api/quiz-state`),
          fetch(`${API_BASE}/api/participants`),
        ]);

        const stateData = await stateRes.json();
        const participantsData = await participantsRes.json();

        if (stateData.success) {
          const serverStatus = stateData.state.status;
          let mappedStatus: QuizStatus = "idle";
          if (serverStatus === "waiting") mappedStatus = "lobby";
          else if (serverStatus === "running") mappedStatus = "running";
          else if (serverStatus === "completed") mappedStatus = "finished";

          setState((prev) => ({
            ...prev,
            status: mappedStatus,
            currentQuestionIndex: stateData.state.current_question_index ?? 0,
            totalQuestions: stateData.state.total_questions ?? 0,
            participants: participantsData.success
              ? participantsData.participants
              : prev.participants,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch initial state:", error);
      }
    };

    fetchInitialState();
  }, []);

  // ── Context Value ────────────────────────────────────────

  const ctx: Ctx = {
    state,
    me,
    socket: socketRef.current,
    joinAsParticipant,
    setMe: setMeState,
    startQuiz,
    endQuiz,
    resetQuiz,
    nextQuestion,
    setPhase,
    submitAnswer,
  };

  return <QuizContext.Provider value={ctx}>{children}</QuizContext.Provider>;
}

// ── Hook ───────────────────────────────────────────────────────

export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuiz must be used within QuizProvider");
  return ctx;
}

// ── Scoring Helper (for local UI feedback) ─────────────────────

export function calculatePoints(timeMs: number) {
  const seconds = Math.max(0, timeMs / 1000);
  return Math.max(10, 100 - Math.floor(seconds * 5));
}
