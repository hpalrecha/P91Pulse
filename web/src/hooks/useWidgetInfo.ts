import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { WIDGET_DEFAULTS, type WidgetMeta } from '@/config/widget-registry';

/**
 * Editable per-widget info ("i" boxes) + comments, all developer-only and
 * DB-backed. Read = DB row ?? code default (see widget-registry.ts).
 *
 * Every InfoDot shares one `/api/erp/dev/widget-info` query (React Query dedupes
 * by key), so the whole page costs a single fetch.
 */
export interface WidgetInfoRow {
  widgetId: string;
  label?: string | null;
  description?: string | null;
  source?: string | null;
  formula?: string | null;
  freshness?: string | null;
  updatedBy?: number | null;
  updatedAt?: string | null;
}

export interface WidgetComment {
  id: number;
  widgetId: string;
  pagePath?: string | null;
  userId: number;
  brand?: string | null;
  body: string;
  resolved: boolean;
  createdAt: string;
  authorName?: string | null;
}

const WIDGET_INFO_KEY = ['/api/erp/dev/widget-info'];

/** All saved info rows. `enabled` gates so it only fires for developers. */
export function useWidgetInfoMap(enabled = true) {
  return useQuery<WidgetInfoRow[]>({
    queryKey: WIDGET_INFO_KEY,
    enabled,
  });
}

/** Effective content for one widget = DB override merged over the code default.
 *  `fallbackLabel` gives a friendly default label for widgets with no registry
 *  entry (e.g. sidebar tabs keyed by route). */
export function resolveWidgetInfo(
  widgetId: string,
  rows?: WidgetInfoRow[],
  fallbackLabel?: string,
): WidgetMeta {
  const def: WidgetMeta =
    WIDGET_DEFAULTS[widgetId] || { id: widgetId, label: fallbackLabel || widgetId, description: '' };
  const row = rows?.find((r) => r.widgetId === widgetId);
  if (!row) return def;
  const pick = (v: string | null | undefined, d?: string) =>
    v != null && v !== '' ? v : d;
  return {
    id: widgetId,
    label: pick(row.label, def.label) || def.label,
    description: pick(row.description, def.description) || '',
    source: pick(row.source, def.source),
    formula: pick(row.formula, def.formula),
    freshness: pick(row.freshness, def.freshness),
  };
}

/** Upsert the editable info content for a widget. */
export function useSaveWidgetInfo() {
  return useMutation({
    mutationFn: async (data: { widgetId: string } & Partial<WidgetMeta>) => {
      const { widgetId, ...body } = data;
      const res = await apiRequest(
        'PUT',
        `/api/erp/dev/widget-info/${encodeURIComponent(widgetId)}`,
        body,
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WIDGET_INFO_KEY });
    },
  });
}

/** Comments thread for one widget. */
export function useWidgetComments(widgetId: string, enabled = true) {
  return useQuery<WidgetComment[]>({
    queryKey: ['/api/erp/dev/comments', widgetId],
    queryFn: async () => {
      const res = await apiRequest(
        'GET',
        `/api/erp/dev/comments?widgetId=${encodeURIComponent(widgetId)}`,
      );
      return res.json();
    },
    enabled: enabled && !!widgetId,
  });
}

/** Add a comment to a widget. */
export function useAddWidgetComment(widgetId: string) {
  return useMutation({
    mutationFn: async (payload: { body: string; pagePath?: string; brand?: string }) => {
      const res = await apiRequest('POST', '/api/erp/dev/comments', {
        widgetId,
        ...payload,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/erp/dev/comments', widgetId] });
    },
  });
}
