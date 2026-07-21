import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { Permission, UserPermissions, UserRow } from "../../types";
import { Button, Modal, Spinner } from "../ui";

interface Props {
  user: UserRow;
  onClose: () => void;
}

const key = (m: string, a: string) => `${m}:${a}`;

// Modules whose flow isn't defined yet — hidden from the editor for now.
const HIDDEN_MODULES = new Set(["users_rbac", "territories_brands", "vas_jobcards"]);

// The editor shows the effective module x action grid. Toggling a cell is stored
// as an OVERRIDE relative to the role template: the backend receives only the
// cells that differ from what the role grants by default.
export function PermissionEditor({ user, onClose }: Props) {
  const qc = useQueryClient();
  const uid = user.user.id;

  const permsQ = useQuery({ queryKey: ["permissions"], queryFn: () => api.get<Permission[]>("/api/permissions") });
  const userPermsQ = useQuery({
    queryKey: ["user-permissions", uid],
    queryFn: () => api.get<UserPermissions>(`/api/users/${uid}/permissions`),
  });

  const [desired, setDesired] = useState<Set<string> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reconstruct the role TEMPLATE baseline from effective + overrides:
  //   effective = template - revokes + grants  =>  template = effective - grants + revokes
  const { modules, actions, template, effective } = useMemo(() => {
    const perms = (permsQ.data ?? []).filter((p) => !HIDDEN_MODULES.has(p.module));
    const up = userPermsQ.data;
    const modules = [...new Set(perms.map((p) => p.module))];
    const actions = [...new Set(perms.map((p) => p.action))];

    const effective = new Set(up?.effective ?? []);
    const template = new Set(effective);
    for (const o of up?.overrides ?? []) {
      if (o.granted) template.delete(key(o.module, o.action)); // grant existed only via override
      else template.add(key(o.module, o.action)); // revoke hid a template perm
    }
    return { modules, actions, template, effective };
  }, [permsQ.data, userPermsQ.data]);

  const permSet = useMemo(
    () => new Set((permsQ.data ?? []).map((p) => key(p.module, p.action))),
    [permsQ.data],
  );

  // desired defaults to the current effective set until the admin edits.
  const current = desired ?? effective;

  const saveM = useMutation({
    mutationFn: () => {
      const overrides = [];
      for (const k of permSet) {
        const inTemplate = template.has(k);
        const want = current.has(k);
        if (want !== inTemplate) {
          const [module, action] = k.split(":");
          overrides.push({ module, action, granted: want });
        }
      }
      return api.put(`/api/users/${uid}/permissions`, { overrides });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-permissions", uid] });
      onClose();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Failed to save"),
  });

  function toggle(m: string, a: string) {
    if (!permSet.has(key(m, a))) return;
    const next = new Set(current);
    const k = key(m, a);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    setDesired(next);
  }

  const loading = permsQ.isLoading || userPermsQ.isLoading;
  const overrideCount = useMemo(() => {
    let n = 0;
    for (const k of permSet) if (current.has(k) !== template.has(k)) n++;
    return n;
  }, [current, template, permSet]);

  return (
    <Modal open onClose={onClose} title={`Permissions — ${user.user.name}`} wide>
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500">
            Role <span className="font-medium text-slate-700">{user.role_name}</span> sets the defaults.
            Ticks that differ from the role are saved as per-user overrides.{" "}
            <span className="font-medium">{overrideCount}</span> override{overrideCount === 1 ? "" : "s"}.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">Module</th>
                  {actions.map((a) => (
                    <th key={a} className="px-2 py-2 text-center">
                      {a}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.map((m) => (
                  <tr key={m} className="border-t border-slate-100">
                    <td className="py-2 pr-3 font-medium text-slate-700">{m}</td>
                    {actions.map((a) => {
                      const exists = permSet.has(key(m, a));
                      const checked = current.has(key(m, a));
                      const differs = exists && checked !== template.has(key(m, a));
                      return (
                        <td key={a} className="px-2 py-2 text-center">
                          {exists ? (
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggle(m, a)}
                              className={differs ? "accent-amber-500" : "accent-slate-700"}
                              title={differs ? "override (differs from role)" : ""}
                            />
                          ) : (
                            <span className="text-slate-200">·</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-5 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setDesired(new Set(template))}>
              Reset to role defaults
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={() => saveM.mutate()} disabled={saveM.isPending}>
                {saveM.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
