import { useAuth } from "./lib/auth";
import { Login } from "./pages/Login";
import { AppShell } from "./pages/AppShell";
import { Spinner } from "./components/ui";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return user ? <AppShell /> : <Login />;
}
