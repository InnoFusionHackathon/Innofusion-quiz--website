import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { QuizProvider } from "@/store/quiz-store";
import { Particles } from "@/components/Particles";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Toaster } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="wood-panel max-w-md p-10 text-center">
        <h1 className="font-display text-7xl font-black text-gold text-stroke">404</h1>
        <h2 className="mt-4 font-display text-xl font-bold">Lost in the wilderness</h2>
        <p className="mt-2 text-sm text-muted-foreground">This path does not exist on the battle map.</p>
        <Link to="/" className="btn-medieval mt-6 inline-flex">Return to Camp</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="wood-panel max-w-md p-8 text-center">
        <h1 className="font-display text-2xl font-bold text-gold">The battle was interrupted</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something broke. Try again or return home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="btn-medieval">Try again</button>
          <a href="/" className="btn-stone">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "QuizForge — Real-Time Quiz Arena | HackOS" },
      { name: "description", content: "Real-time competitive quiz arena. Think fast, answer faster, conquer the leaderboard. Powered by HackOS." },
      { property: "og:title", content: "QuizForge | HackOS" },
      { property: "og:description", content: "Real-Time Competitive Quiz Arena. Think Fast. Answer Faster." },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=MedievalSharp&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <QuizProvider>
        <Particles />
        <div className="relative z-10 flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1"><Outlet /></main>
          <Footer />
        </div>
        <Toaster theme="dark" position="top-center" richColors />
      </QuizProvider>
    </QueryClientProvider>
  );
}
