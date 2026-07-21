import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Leads Insights — the interactive panel: pick a date range and/or type a
// territory (e.g. "mumbai"); results refresh instantly. Funnel = came →
// converted / quotation / customer / sales order. Territory mode adds the
// per-pincode breakdown with responsible partners + recent actions taken.
// Leads Insights — one clean panel: filters on top (brand, dates, territory),
// a spacious funnel, per-brand segmentation, a readable status list, and the
// territory drill-down. Role-scoped server-side.
export function LeadsInsights() {
  const [brand, setBrand] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [territory, setTerritory] = useState('');
  const [debouncedTerritory, setDebouncedTerritory] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerritory(territory.trim()), 400);
    return () => clearTimeout(t);
  }, [territory]);

  const params = new URLSearchParams();
  if (brand !== 'all') params.set('brand', brand);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (debouncedTerritory) params.set('territory', debouncedTerritory);
  const { data, isFetching } = useQuery<any>({
    queryKey: [`/api/erp/leads-insights?${params.toString()}`],
    placeholderData: (prev: any) => prev,
  });

  const num = (v: any) => (v === undefined || v === null ? '\u2026' : Number(v).toLocaleString('en-IN'));
  const maxStatus = Math.max(1, ...(data?.statuses ?? []).map((s: any) => s.count));

  const funnelStep = (label: string, value: any, color: string, last = false) => (
    <>
      <div className="flex-1 min-w-[7.5rem] rounded-xl bg-gray-50 px-4 py-4 text-center">
        <p className={`text-3xl font-bold ${color}`}>{num(value)}</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
      {!last && <div className="hidden sm:block text-2xl text-gray-300 self-center">&rsaquo;</div>}
    </>
  );

  const inputCls = 'rounded-md border border-gray-200 px-3 py-2 text-sm bg-white';

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Leads &mdash; {data?.company ?? 'P91 India'}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              What is coming in, per brand, and what happened to it. Results respect your role.
            </p>
          </div>
          {isFetching && <span className="text-xs text-muted-foreground">updating&hellip;</span>}
        </div>
        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg bg-gray-50 p-3">
          <label className="text-sm">
            <span className="block text-xs text-muted-foreground mb-1">Brand</span>
            <select value={brand} onChange={(e) => setBrand(e.target.value)} className={inputCls}>
              <option value="all">All brands</option>
              {(data?.brands ?? []).map((b: any) => (
                <option key={b.brand} value={b.brand}>{b.brand}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-xs text-muted-foreground mb-1">From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
          </label>
          <label className="text-sm">
            <span className="block text-xs text-muted-foreground mb-1">To</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
          </label>
          <label className="text-sm flex-1 min-w-[14rem]">
            <span className="block text-xs text-muted-foreground mb-1">Territory / City / State</span>
            <input placeholder="e.g. Mumbai, Bengaluru, Karnataka&hellip;" value={territory}
              onChange={(e) => setTerritory(e.target.value)} className={`w-full ${inputCls}`} />
          </label>
          {(brand !== 'all' || from || to || territory) && (
            <button onClick={() => { setBrand('all'); setFrom(''); setTo(''); setTerritory(''); }}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-muted-foreground hover:bg-gray-100">
              Clear filters
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* The funnel */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Lead funnel</h4>
          <div className="flex flex-wrap gap-2">
            {funnelStep('Leads came', data?.came, 'text-gray-900')}
            {funnelStep('Converted', data?.converted, 'text-purple-600')}
            {funnelStep('Quotation', data?.quotation, 'text-blue-600')}
            {funnelStep('Customer', data?.customers, 'text-green-600')}
            {funnelStep(
              data?.soAmount !== undefined
                ? `Sales orders \u00b7 \u20b9${Math.round(data?.soAmount ?? 0).toLocaleString('en-IN')}`
                : 'Sales orders',
              data?.soCount, 'text-emerald-700', true)}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Unassigned in this view: <span className="font-semibold text-foreground">{num(data?.unassigned)}</span>
            {' '}&mdash; {num(data?.unassignedWithPin)} have a pincode (auto-matchable),{' '}
            {num(data?.unassignedNoPin)} need the salesperson to get one.
          </p>
        </div>

        {/* Brand segmentation + status list */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h4 className="text-sm font-semibold mb-3">By brand</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Unassigned</TableHead>
                  <TableHead className="text-right">Assigned</TableHead>
                  <TableHead className="text-right">Converted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.brands ?? []).map((b: any) => (
                  <TableRow key={b.brand} className={brand === b.brand ? 'bg-green-50' : ''}>
                    <TableCell className="font-medium">
                      <button className="hover:underline" onClick={() => setBrand(brand === b.brand ? 'all' : b.brand)}>
                        {b.brand}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">{num(b.total)}</TableCell>
                    <TableCell className="text-right text-yellow-700">{num(b.unassigned)}</TableCell>
                    <TableCell className="text-right">{num(b.assigned)}</TableCell>
                    <TableCell className="text-right text-purple-700">{num(b.converted)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-1 text-xs text-muted-foreground">Click a brand to focus the whole panel on it.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">By status</h4>
            <div className="space-y-2">
              {(data?.statuses ?? []).map((s: any) => (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 text-sm">{s.name}</span>
                  <div className="h-2 flex-1 rounded-full bg-gray-100">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${(s.count / maxStatus) * 100}%` }} />
                  </div>
                  <span className="w-16 shrink-0 text-right text-sm font-medium">{num(s.count)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Territory drill-down */}
        {debouncedTerritory && (
          <div className="rounded-lg border border-gray-200 p-4 space-y-6">
            <h4 className="text-sm font-semibold">
              Territory &ldquo;{debouncedTerritory}&rdquo; &mdash; pincodes, responsible partners &amp; actions
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pincode</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                      <TableHead className="text-right">Assigned</TableHead>
                      <TableHead>Responsible partners</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.pincodes ?? []).map((r: any) => (
                      <TableRow key={r.pincode}>
                        <TableCell className="font-mono text-xs">{r.pincode}</TableCell>
                        <TableCell className="text-right">{r.leads}</TableCell>
                        <TableCell className="text-right">{r.assigned}</TableCell>
                        <TableCell className="text-xs">{r.responsible || '\u2014'}</TableCell>
                      </TableRow>
                    ))}
                    {(data?.pincodes ?? []).length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                        No leads matched this territory.
                      </TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div>
                <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  What was done on these leads
                </h5>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {(data?.activity ?? []).map((a: any, i: number) => (
                    <div key={i} className="text-sm border-l-2 border-gray-200 pl-3">
                      <span className="font-medium">{a.actor}</span>{' '}
                      <span className="text-muted-foreground">{a.event}</span>
                      {a.to && <span> &rarr; {a.to}</span>} &mdash; {a.lead}
                      <span className="block text-xs text-muted-foreground">
                        {new Date(a.at).toLocaleString()}{a.note ? ` \u00b7 ${a.note}` : ''}
                      </span>
                    </div>
                  ))}
                  {(data?.activity ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground">No recorded actions yet for this territory.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
