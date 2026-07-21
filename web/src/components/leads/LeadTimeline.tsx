import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  GitCommitHorizontal,
  Tag,
  Loader2,
  Clock,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

type EventType = 'comment' | 'status_change' | 'field_change' | 'created';
type EventSource = 'erp' | 'pulse';

interface FieldChange {
  field: string;
  from: string | null;
  to: string | null;
}

interface TimelineEvent {
  id: string;
  type: EventType;
  source: EventSource;
  timestamp: string;
  actor: string;
  body: string;
  changes?: FieldChange[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function actorInitials(actor: string): string {
  return actor
    .split(/[\s@]+/)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('');
}

function formatActor(actor: string): string {
  // Convert email-like owners to a friendly label
  if (actor === 'Administrator') return 'System';
  if (actor.includes('@')) return actor.split('@')[0].replace(/[._]/g, ' ');
  return actor;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EventIcon({ type, source }: { type: EventType; source: EventSource }) {
  if (type === 'comment') {
    return (
      <div className={`flex h-7 w-7 items-center justify-center rounded-full
        ${source === 'pulse' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
        <MessageSquare className="h-3.5 w-3.5" />
      </div>
    );
  }
  if (type === 'status_change') {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-purple-600">
        <Tag className="h-3.5 w-3.5" />
      </div>
    );
  }
  // field_change | created
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600">
      <GitCommitHorizontal className="h-3.5 w-3.5" />
    </div>
  );
}

function SourceBadge({ source }: { source: EventSource }) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium
      ${source === 'erp' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
      {source === 'erp' ? 'ERP' : 'Pulse'}
    </span>
  );
}

function FieldChangeRow({ change }: { change: FieldChange }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-1 text-xs text-gray-600">
      <span className="font-medium text-gray-700">{change.field}:</span>
      {change.from ? (
        <span className="text-red-500 line-through">{change.from}</span>
      ) : (
        <span className="text-gray-400 italic">(empty)</span>
      )}
      <span className="text-gray-400">→</span>
      {change.to ? (
        <span className="text-green-600">{change.to}</span>
      ) : (
        <span className="text-gray-400 italic">(empty)</span>
      )}
    </div>
  );
}

function TimelineItem({ event }: { event: TimelineEvent }) {
  const actor = formatActor(event.actor);
  const ts = new Date(event.timestamp);

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <EventIcon type={event.type} source={event.source} />
        <div className="w-px flex-1 bg-gray-100 mt-1" />
      </div>

      <div className="pb-5 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[10px]">{actorInitials(actor)}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-gray-800">{actor}</span>
          <SourceBadge source={event.source} />
          <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
            {format(ts, 'MMM d, yyyy h:mm a')}
          </span>
        </div>

        {event.type === 'field_change' && event.changes?.length ? (
          <div className="space-y-1 mt-1">
            {event.changes.map((c, i) => (
              <FieldChangeRow key={i} change={c} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{event.body}</p>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface LeadTimelineProps {
  leadId: number;
}

export default function LeadTimeline({ leadId }: LeadTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [erpLeadId, setErpLeadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!leadId) return;
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetch(`/api/erp/leads/${leadId}/timeline`, { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (cancelled) return;
        setEvents(data.items ?? []);
        setErpLeadId(data.erpLeadId ?? null);
      })
      .catch(err => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [leadId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading timeline…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-40 text-red-500 text-sm">
        Failed to load timeline: {error}
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
        <Clock className="h-8 w-8 mb-2 opacity-30" />
        <p>No activity recorded yet</p>
        {erpLeadId && (
          <p className="text-xs mt-1 text-gray-300">ERP Lead: {erpLeadId}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {erpLeadId && (
        <p className="text-xs text-gray-400 mb-3">
          ERP Lead: <span className="font-mono">{erpLeadId}</span>
          {' · '}
          {events.length} event{events.length !== 1 ? 's' : ''}
        </p>
      )}
      <ScrollArea className="h-[400px] pr-3">
        <div>
          {events.map(event => (
            <TimelineItem key={event.id} event={event} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
