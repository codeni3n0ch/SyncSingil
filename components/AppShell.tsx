import Sidebar from "./Sidebar";
import { Search } from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="shell">
    <Sidebar/>
    <main className="main">
      <header className="top">
        <input className="search" placeholder="⌕  Search borrower, loan or ID..." />
        <div className="muted">SyncSINGIL Management System</div>
      </header>
      <div className="content">{children}</div>
    </main>
  </div>;
}
