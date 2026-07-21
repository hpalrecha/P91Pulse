import { useState } from 'react';
import { Info, Pencil, Check, X, Loader2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMe } from '@/lib/useMe';
import { useAnnotationMode } from '@/lib/annotation-mode';
import type { WidgetMeta } from '@/config/widget-registry';
import {
  useWidgetInfoMap,
  resolveWidgetInfo,
  useSaveWidgetInfo,
  useWidgetComments,
  useAddWidgetComment,
} from '@/hooks/useWidgetInfo';

/**
 * Developer-only "i" affordance for a dashboard box. Renders nothing for
 * non-developers, so it's safe to drop anywhere. The popover has two tabs:
 *   • Info  — what the metric means / its source / formula (editable, DB-backed)
 *   • Notes — a shared comment thread for the box
 * Both are keyed by the same stable `widgetId`.
 */
export function InfoDot({
  widgetId,
  className,
  fallbackLabel,
}: {
  widgetId: string;
  className?: string;
  /** Friendly default label when the widget has no registry/DB entry (e.g. sidebar tabs). */
  fallbackLabel?: string;
}) {
  const { isDeveloper } = useMe();
  const annotate = useAnnotationMode();
  const [open, setOpen] = useState(false);
  const { data: rows } = useWidgetInfoMap(isDeveloper);

  if (!isDeveloper) return null;

  const meta = resolveWidgetInfo(widgetId, rows, fallbackLabel);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Info: ${meta.label}`}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'inline-flex items-center justify-center rounded-full transition-colors',
            annotate
              ? 'text-blue-600 bg-blue-50 ring-2 ring-blue-300'
              : 'text-gray-400 hover:text-blue-600',
            className,
          )}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" onClick={(e) => e.stopPropagation()}>
        <Tabs defaultValue="info">
          <div className="px-3 pt-3">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="notes">
                Notes <CommentCount widgetId={widgetId} enabled={open} />
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="info" className="m-0">
            <InfoPanel widgetId={widgetId} meta={meta} />
          </TabsContent>
          <TabsContent value="notes" className="m-0">
            <NotesPanel widgetId={widgetId} enabled={open} />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

function CommentCount({ widgetId, enabled }: { widgetId: string; enabled: boolean }) {
  const { data } = useWidgetComments(widgetId, enabled);
  const open = (data || []).filter((c) => !c.resolved).length;
  if (!open) return null;
  return (
    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
      {open}
    </Badge>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</div>
      <div className="text-xs text-gray-700 whitespace-pre-wrap">{value}</div>
    </div>
  );
}

function InfoPanel({ widgetId, meta }: { widgetId: string; meta: WidgetMeta }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<WidgetMeta>(meta);
  const save = useSaveWidgetInfo();

  const onEdit = () => {
    setDraft(meta);
    setEditing(true);
  };
  const onSave = async () => {
    await save.mutateAsync({
      widgetId,
      label: draft.label,
      description: draft.description,
      source: draft.source,
      formula: draft.formula,
      freshness: draft.freshness,
    });
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="text-sm font-semibold text-gray-900">{meta.label}</div>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
        {meta.description && (
          <div className="text-xs text-gray-700 whitespace-pre-wrap">{meta.description}</div>
        )}
        <Row label="Source" value={meta.source} />
        <Row label="Formula" value={meta.formula} />
        <Row label="Freshness" value={meta.freshness} />
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3">
      <Field label="Label">
        <Input
          value={draft.label}
          onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          className="h-7 text-xs"
        />
      </Field>
      <Field label="Description">
        <Textarea
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          className="min-h-[56px] text-xs"
        />
      </Field>
      <Field label="Source">
        <Textarea
          value={draft.source || ''}
          onChange={(e) => setDraft({ ...draft, source: e.target.value })}
          className="min-h-[40px] text-xs"
        />
      </Field>
      <Field label="Formula">
        <Input
          value={draft.formula || ''}
          onChange={(e) => setDraft({ ...draft, formula: e.target.value })}
          className="h-7 text-xs"
        />
      </Field>
      <Field label="Freshness">
        <Input
          value={draft.freshness || ''}
          onChange={(e) => setDraft({ ...draft, freshness: e.target.value })}
          className="h-7 text-xs"
        />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" className="h-7" onClick={() => setEditing(false)} disabled={save.isPending}>
          <X className="mr-1 h-3.5 w-3.5" /> Cancel
        </Button>
        <Button size="sm" className="h-7" onClick={onSave} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 h-3.5 w-3.5" />}
          Save
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</div>
      {children}
    </div>
  );
}

function NotesPanel({ widgetId, enabled }: { widgetId: string; enabled: boolean }) {
  const { data: comments, isLoading } = useWidgetComments(widgetId, enabled);
  const add = useAddWidgetComment(widgetId);
  const [body, setBody] = useState('');

  const onAdd = async () => {
    const text = body.trim();
    if (!text) return;
    await add.mutateAsync({ body: text, pagePath: window.location.pathname });
    setBody('');
  };

  return (
    <div className="flex max-h-80 flex-col p-3">
      <div className="mb-2 flex-1 space-y-2 overflow-y-auto">
        {isLoading && <div className="text-xs text-gray-400">Loading…</div>}
        {!isLoading && (comments || []).length === 0 && (
          <div className="text-xs text-gray-400">No notes yet. Add the first one.</div>
        )}
        {(comments || []).map((c) => (
          <div key={c.id} className="rounded border border-gray-100 bg-gray-50 p-2">
            <div className="mb-0.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-700">{c.authorName || `User ${c.userId}`}</span>
              <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
            </div>
            <div className="text-xs text-gray-700 whitespace-pre-wrap">{c.body}</div>
          </div>
        ))}
      </div>
      <div className="space-y-2 border-t pt-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a note for the team…"
          className="min-h-[44px] text-xs"
        />
        <div className="flex justify-end">
          <Button size="sm" className="h-7" onClick={onAdd} disabled={add.isPending || !body.trim()}>
            {add.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
            Add note
          </Button>
        </div>
      </div>
    </div>
  );
}

export default InfoDot;
