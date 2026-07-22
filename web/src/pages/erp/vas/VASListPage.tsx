import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export interface VASColumn {
  key: string;
  label: string;
  fallback?: string;   // read this key if `key` is empty
  badge?: boolean;     // render as a status badge
  date?: boolean;      // format as a date
  bool?: boolean;      // render Yes/No
}

function cell(row: any, col: VASColumn) {
  let v = row[col.key];
  if ((v === undefined || v === null || v === '') && col.fallback) v = row[col.fallback];
  if (col.bool) return v ? 'Yes' : 'No';
  if (col.date && v) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleString();
  }
  if (v === undefined || v === null || v === '') return '—';
  return String(v);
}

// Generic read-only list for a VAS collection proxied through /api/vas/*.
// VAS returns its own shapes; we defensively render the requested columns and
// gracefully handle "not linked in VAS" (the SSO mint failing).
export function VASListPage({
  title, description, endpoint, columns,
}: { title: string; description: string; endpoint: string; columns: VASColumn[] }) {
  const { data, isLoading, error } = useQuery<any>({ queryKey: [endpoint] });
  const rows: any[] = Array.isArray(data) ? data : data?.data ?? data?.workOrders ?? data?.jobCards ?? data?.allocations ?? [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title} ({rows.length})</CardTitle>
          <CardDescription>Live from Pulse VAS via your single Pulse login.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-sm text-amber-700 py-4">
              Couldn't load from VAS. If you were just given VAS access, it may take a moment to link — try again shortly.
            </p>
          )}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((c) => <TableHead key={c.key}>{c.label}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow><TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground py-6">Loading…</TableCell></TableRow>
                )}
                {!isLoading && rows.length === 0 && !error && (
                  <TableRow><TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground py-6">Nothing here yet.</TableCell></TableRow>
                )}
                {rows.map((row, i) => (
                  <TableRow key={row.id || i}>
                    {columns.map((c) => (
                      <TableCell key={c.key}>
                        {c.badge ? <Badge variant="outline">{cell(row, c)}</Badge> : cell(row, c)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
