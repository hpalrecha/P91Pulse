import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Role, UserRow } from "../types";
import { Badge, Button, Card, Input, Select, Spinner } from "../components/ui";
import { CreateUserDialog } from "../components/users/CreateUserDialog";
import { PermissionEditor } from "../components/users/PermissionEditor";

function statusTone(status: string, active: boolean) {
  if (!active) return "slate";
  return status === "approved" ? "green" : status === "rejected" ? "red" : "blue";
}

export function UserManagement() {
  const { can } = useAuth();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [permUser, setPermUser] = useState<UserRow | null>(null);

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (role) params.set("role", role);
  if (status) params.set("status", status);
  const qs = params.toString();

  const usersQ = useQuery({
    queryKey: ["users", qs],
    queryFn: () => api.get<UserRow[]>(`/api/users${qs ? `?${qs}` : ""}`),
  });
  const rolesQ = useQuery({ queryKey: ["roles"], queryFn: () => api.get<Role[]>("/api/roles") });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["users"] });

  const setStatusM = useMutation({
    mutationFn: (v: { id: string; status: string }) => api.post(`/api/users/${v.id}/status`, { status: v.status }),
    onSuccess: invalidate,
  });
  const setActiveM = useMutation({
    mutationFn: (v: { id: string; is_active: boolean }) => api.post(`/api/users/${v.id}/active`, { is_active: v.is_active }),
    onSuccess: invalidate,
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => api.del(`/api/users/${id}`),
    onSuccess: invalidate,
  });

  const rows = usersQ.data ?? [];
  const roleOptions = useMemo(() => rolesQ.data ?? [], [rolesQ.data]);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-slate-500">Create, approve and permission users in your organization.</p>
        </div>
        {can("users_rbac", "create") && <Button onClick={() => setCreateOpen(true)}>+ Create User</Button>}
      </div>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Input placeholder="Search name, email, phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          {roleOptions.map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      <Card>
        <div className="border-b border-slate-200 px-5 py-3 text-sm text-slate-500">
          {usersQ.isLoading ? "Loading…" : `${rows.length} user${rows.length === 1 ? "" : "s"}`}
        </div>

        {usersQ.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : usersQ.isError ? (
          <div className="px-5 py-12 text-center text-red-600">Failed to load users.</div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-12 text-center text-slate-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Brand</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const u = row.user;
                  return (
                    <tr key={u.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-5 py-3">
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.email ?? u.username ?? u.phone ?? "—"}</div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone="purple">{row.role_name}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={statusTone(u.status, u.is_active)}>
                          {u.is_active ? u.status : "disabled"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        {row.brand_codes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {row.brand_codes.map((c) => (
                              <Badge key={c} tone="indigo">
                                {c}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {can("users_rbac", "edit") && u.status === "pending" && (
                            <>
                              <Button variant="outline" onClick={() => setStatusM.mutate({ id: u.id, status: "approved" })}>
                                Approve
                              </Button>
                              <Button variant="ghost" onClick={() => setStatusM.mutate({ id: u.id, status: "rejected" })}>
                                Reject
                              </Button>
                            </>
                          )}
                          {can("users_rbac", "edit") && (
                            <Button
                              variant="ghost"
                              onClick={() => setActiveM.mutate({ id: u.id, is_active: !u.is_active })}
                            >
                              {u.is_active ? "Disable" : "Enable"}
                            </Button>
                          )}
                          {can("users_rbac", "edit") && (
                            <Button variant="outline" onClick={() => setPermUser(row)}>
                              Permissions
                            </Button>
                          )}
                          {can("users_rbac", "delete") && row.role_code !== "admin" && (
                            <Button
                              variant="danger"
                              onClick={() => {
                                if (confirm(`Delete ${u.name}? This cannot be undone.`)) deleteM.mutate(u.id);
                              }}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        roles={roleOptions}
        onCreated={invalidate}
      />
      {permUser && (
        <PermissionEditor user={permUser} onClose={() => setPermUser(null)} />
      )}
    </div>
  );
}
