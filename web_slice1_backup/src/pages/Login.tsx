import { useState } from "react";
import { useAuth } from "../lib/auth";
import { Button, Card, Field, Input } from "../components/ui";

export function Login() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(identifier, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold">P91 Pulse</h1>
          <p className="text-sm text-slate-500">Sign in to your account</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email or username">
            <Input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="admin@p91.local"
              autoFocus
            />
          </Field>
          <Field label="Password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
