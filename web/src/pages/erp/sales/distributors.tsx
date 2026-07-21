import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InfoDot } from '@/components/dev/InfoDot';

interface DistributorPerf {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  metadata: any;
  total_leads: number;
  conversions: number;
  warranties: number;
}

function stateOf(metadata: any): string {
  const m = typeof metadata === 'string' ? (() => { try { return JSON.parse(metadata); } catch { return {}; } })() : (metadata || {});
  return m.state || m.territory || m.city || '—';
}

export default function SalesDistributors() {
  const { data: rows = [], isLoading } = useQuery<DistributorPerf[]>({
    queryKey: ['/api/erp/sales/distributors'],
    queryFn: async () => (await apiRequest('GET', '/api/erp/sales/distributors')).json(),
    refetchInterval: 30000,
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Distributor Performance</h1>
          <InfoDot widgetId="sales.distributors.table" fallbackLabel="Distributor Performance" />
        </div>
        <p className="text-gray-500 mt-1">Leads, conversions and warranties per distributor in your scope</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Distributor</TableHead>
                <TableHead>State / Region</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Conversions</TableHead>
                <TableHead>Conv. %</TableHead>
                <TableHead>Warranties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-gray-500">Loading…</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-gray-500">No distributors in your scope yet</TableCell></TableRow>
              ) : rows.map(d => {
                const leads = Number(d.total_leads), conv = Number(d.conversions);
                const pct = leads > 0 ? Math.round((conv / leads) * 100) : 0;
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>{stateOf(d.metadata)}</TableCell>
                    <TableCell className="text-sm text-gray-600">{d.email}<br />{d.phone || ''}</TableCell>
                    <TableCell>{leads}</TableCell>
                    <TableCell>{conv}</TableCell>
                    <TableCell>{pct}%</TableCell>
                    <TableCell>{Number(d.warranties)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
