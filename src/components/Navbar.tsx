import { Link } from "@tanstack/react-router";


export function Navbar() {
  return (
    <header className="relative z-20 px-4 py-4 sm:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="rounded-lg overflow-hidden">
            <img src="/HackOS_Logo.png" alt="HackOS Logo" className="h-10 w-10 object-contain" />
          </div>
          <div>
            <div className="font-display text-xl sm:text-2xl font-black text-gold leading-none">QuizForge</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest">Real-Time Quiz Arena</div>
          </div>
        </Link>
        <nav className="hidden sm:flex items-center gap-2">
          <div className="text-[9px] text-muted-foreground/60 uppercase tracking-widest mr-2">Powered by HackOS</div>
          <Link to="/" className="btn-stone text-sm" activeOptions={{ exact: true }}>Home</Link>
          <Link
            to="/admin"
            onClick={(e) => {
              const code = prompt("Enter Admin Secret Code:");
              if (code === "#_Asif01_#_Pratyay02_#_Dipti03_#_Innofusion3_#") {
                sessionStorage.setItem("adminAuth", "true");
              } else {
                e.preventDefault();
                alert("Incorrect Admin Secret Code!");
              }
            }}
            className="btn-stone text-sm"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
