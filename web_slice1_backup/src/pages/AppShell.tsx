import { useAuth } from "../lib/auth";
import { UserManagement } from "./UserManagement";
import { Badge } from "../components/ui";

// Single-tab shell for Slice 1. As more modules land, the sidebar grows and a
// router selects the active page; each nav item is gated by permission.
export function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="text-lg font-bold text-primary">P91 Pulse</div>
          <div className="text-xs text-slate-500">Operational platform</div>
        </div>
        <nav className="flex-1 p-3">
          <a className="flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
            User Management
          </a>
        </nav>
        <div className="border-t border-slate-200 p-3 text-sm">
          <div className="mb-1 font-medium">{user?.name}</div>
          <div className="mb-2">
            <Badge tone="amber">{user?.role}</Badge>
          </div>
          <button onClick={logout} className="text-slate-500 hover:text-slate-800">
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <UserManagement />
      </main>
    </div>
  );
}
