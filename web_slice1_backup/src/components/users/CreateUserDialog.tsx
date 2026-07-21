import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { Brand, Role } from "../../types";
import { Button, Field, Input, Modal, Select, Switch } from "../ui";

interface Props {
  open: boolean;
  onClose: () => void;
  roles: Role[];
  onCreated: () => void;
}

const empty = {
  name: "",
  email: "",
  username: "",
  phone: "",
  password: "",
  role_code: "",
};

export function CreateUserDialog({ open, onClose, roles, onCreated }: Props) {
  const [form, setForm] = useState({ ...empty });
  const [approved, setApproved] = useState(true);
  const [brandIds, setBrandIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const brandsQ = useQuery({ queryKey: ["brands"], queryFn: () => api.get<Brand[]>("/api/brands"), enabled: open });

  const createM = useMutation({
    mutationFn: () =>
      api.post("/api/users", {
        name: form.name,
        email: form.email || null,
        username: form.username || null,
        phone: form.phone,
        password: form.password || null,
        role_code: form.role_code,
        approved,
        brand_ids: brandIds,
      }),
    onSuccess: () => {
      onCreated();
      reset();
      onClose();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Failed to create user"),
  });

  function reset() {
    setForm({ ...empty });
    setApproved(true);
    setBrandIds([]);
    setError(null);
  }

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleBrand(id: string) {
    setBrandIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.role_code) {
      setError("Name and role are required.");
      return;
    }
    if (form.phone.replace(/\D/g, "").length < 10) {
      setError("A valid 10-digit phone number is required.");
      return;
    }
    createM.mutate();
  }

  // Admin and Platform Super Admin are not assignable from this dialog.
  const assignable = roles.filter((r) => r.code !== "platform_super_admin" && r.code !== "admin");

  return (
    <Modal open={open} onClose={onClose} title="Create User">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus />
        </Field>

        <Field label="Phone (required)">
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="10-digit mobile" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Username">
            <Input value={form.username} onChange={(e) => set("username", e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Password">
            <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} />
          </Field>
          <Field label="Role">
            <Select value={form.role_code} onChange={(e) => set("role_code", e.target.value)}>
              <option value="">Select role…</option>
              {assignable.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {/* Brand access — a user may be granted some brands, not all. */}
        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">Brand access</span>
          <div className="flex flex-wrap gap-3 rounded-md border border-slate-200 p-3">
            {(brandsQ.data ?? []).map((b) => (
              <label key={b.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={brandIds.includes(b.id)} onChange={() => toggleBrand(b.id)} />
                {b.name}
                <span className="text-xs text-slate-400">({b.scope})</span>
              </label>
            ))}
            {brandsQ.data?.length === 0 && <span className="text-sm text-slate-400">No brands.</span>}
          </div>
        </div>

        {/* Approved toggle (replaces the status dropdown). */}
        <label className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
          <span className="text-sm font-medium text-slate-700">Approved</span>
          <Switch checked={approved} onCheckedChange={setApproved} />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createM.isPending}>
            {createM.isPending ? "Creating…" : "Create User"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
