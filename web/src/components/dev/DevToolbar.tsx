import { useQuery } from '@tanstack/react-query';
import { Code2, Eye, MessageSquare, LogOut } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useMe } from '@/lib/useMe';
import { useAnnotationMode, setAnnotationMode } from '@/lib/annotation-mode';

/**
 * Developer toolbar (prod, gated by the developer capability). Provides the
 * role/user impersonation switcher, the "Viewing as … Exit" banner, and the
 * annotation-mode toggle. Rendered at the top of the dashboard content area;
 * renders nothing for non-developers.
 *
 * Phase 1 is identity-only: switching changes what the UI gates to (via /me),
 * while data endpoints still scope to the real developer. The banner says so.
 * A full page reload after each switch cascades the new identity everywhere
 * (the sidebar reads /me on mount and its route guard redirects to the section).
 */
interface ImpersonatableUser {
  id: number;
  name: string;
  role: string;
  brand?: string | null;
  territory?: string | null;
}

const PREVIEW_ROLES = [
  'admin',
  'distributor',
  'detailer',
  'installer',
  'national_sales_manager',
  'regional_sales_manager',
  'salesperson',
];

export function DevToolbar() {
  const { isDeveloper, impersonating } = useMe();
  const annotate = useAnnotationMode();

  const { data: users } = useQuery<ImpersonatableUser[]>({
    queryKey: ['/api/erp/dev/impersonatable-users'],
    enabled: isDeveloper,
  });

  if (!isDeveloper) return null;

  const impersonateUser = async (userId: number) => {
    await apiRequest('POST', '/api/erp/dev/impersonate', { userId });
    window.location.reload();
  };
  const impersonateRole = async (role: string) => {
    await apiRequest('POST', '/api/erp/dev/impersonate', { role });
    window.location.reload();
  };
  const exitImpersonation = async () => {
    await apiRequest('POST', '/api/erp/dev/impersonate/exit');
    window.location.reload();
  };

  return (
    <div className="sticky top-0 z-40">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-slate-900 px-4 py-2 text-xs text-slate-200">
        <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
          <Code2 className="h-3.5 w-3.5" /> DEV
        </span>

        <label className="inline-flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" /> View as user:
          <select
            className="ml-1 max-w-[16rem] rounded bg-slate-800 px-2 py-1 text-slate-100"
            value={impersonating?.asUserId ?? ''}
            onChange={(e) => e.target.value && impersonateUser(Number(e.target.value))}
          >
            <option value="">— select —</option>
            {(users || []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} · {u.role}
                {u.territory ? ` · ${u.territory}` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="inline-flex items-center gap-1">
          role preview:
          <select
            className="ml-1 rounded bg-slate-800 px-2 py-1 text-slate-100"
            value={impersonating && impersonating.asUserId === null ? impersonating.asRole : ''}
            onChange={(e) => e.target.value && impersonateRole(e.target.value)}
          >
            <option value="">— select —</option>
            {PREVIEW_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <label className="ml-auto inline-flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5" /> Annotation mode
          <Switch checked={annotate} onCheckedChange={setAnnotationMode} />
        </label>
      </div>

      {impersonating && (
        <div className="flex items-center justify-between gap-3 bg-amber-400 px-4 py-1.5 text-xs font-medium text-amber-950">
          <span>
            Viewing as <strong>{impersonating.asName}</strong> ({impersonating.asRole})
            {impersonating.asUserId === null
              ? ' — role preview (UI only, data still yours)'
              : ' — data scoped to this user · read-only'}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 bg-amber-950/10 hover:bg-amber-950/20"
            onClick={exitImpersonation}
          >
            <LogOut className="mr-1 h-3.5 w-3.5" /> Exit
          </Button>
        </div>
      )}
    </div>
  );
}

export default DevToolbar;
