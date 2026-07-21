import { useQuery } from '@tanstack/react-query';

/**
 * Identity hook — the single source of truth for "who am I (right now)".
 *
 * Backed by GET /api/erp/me, which (for a developer with the impersonation
 * capability) returns the *impersonated* identity in Phase 1 so the whole UI
 * gates to that role. `_isDeveloper` is always computed from the REAL user, so
 * the dev toolbar stays visible to exit impersonation even while "viewing as" a
 * non-developer role.
 *
 * Sharing one React Query cache key (`/api/erp/me`) means the sidebar, the dev
 * toolbar, and every InfoDot read the same identity and invalidate together.
 */
export interface Impersonation {
  realUserId: number;
  asUserId: number | null;
  asRole: string;
  asName: string;
}

export interface Me {
  id: number;
  name: string;
  role: string;
  email?: string;
  _isDeveloper?: boolean;
  _impersonating?: Impersonation | null;
  [key: string]: any;
}

export function useMe() {
  const query = useQuery<Me | null>({
    queryKey: ['/api/erp/me'],
  });

  const me = query.data ?? null;

  return {
    ...query,
    me,
    isDeveloper: !!me?._isDeveloper,
    impersonating: me?._impersonating ?? null,
  };
}
