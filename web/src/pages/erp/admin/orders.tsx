import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { InfoDot } from '@/components/dev/InfoDot';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RefreshCw,
  Building2,
  Truck,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Clock,
  Package,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface OrderLineItem {
  id: number;
  itemCode: string;
  itemName: string;
  qty: number;
  rate: string;
  amount: string;
  bypassDistributor: boolean;
}

interface Order {
  id: number;
  placedByName: string;
  placedByRole: string;
  routedTo: string;
  distributorName: string | null;
  fulfillmentTag: string;
  totalAmount: string;
  erpOrderName: string | null;
  erpSyncStatus: string;
  erpSyncError: string | null;
  createdAt: string;
  items: OrderLineItem[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtINR(amount: number | string) {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
}

function SyncBadge({ status, erpName }: { status: string; erpName: string | null }) {
  if (status === 'synced' && erpName) {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 gap-1">
        <CheckCircle2 className="w-3 h-3" /> {erpName}
      </Badge>
    );
  }
  if (status === 'failed') {
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200 gap-1">
        <AlertCircle className="w-3 h-3" /> Sync Failed
      </Badge>
    );
  }
  if (status === 'local_only') {
    return (
      <Badge className="bg-gray-100 text-gray-600 border-gray-200 gap-1">
        <Package className="w-3 h-3" /> Local Only
      </Badge>
    );
  }
  return (
    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 gap-1">
      <Clock className="w-3 h-3" /> Pending
    </Badge>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    detailer: 'bg-blue-100 text-blue-800 border-blue-200',
    distributor: 'bg-purple-100 text-purple-800 border-purple-200',
    admin: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return <Badge className={`capitalize ${map[role] ?? 'bg-gray-100'}`}>{role}</Badge>;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const [routedToFilter, setRoutedToFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  // ── Data fetching ────────────────────────────────────────────────────────

  const { data: orders = [], isLoading, refetch } = useQuery<Order[]>({
    queryKey: ['/api/orders/admin'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/orders/admin');
      return res.json();
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/orders/sync-items');
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Item sync complete', description: `${data.synced} items synced from ERPNext.` });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/items'] });
    },
    onError: (err: Error) => {
      toast({ title: 'Sync failed', description: err.message, variant: 'destructive' });
    },
  });

  // ── Filter ───────────────────────────────────────────────────────────────

  const filtered = orders.filter(o => {
    const matchRoute = routedToFilter === 'all' || o.routedTo === routedToFilter;
    const matchRole = roleFilter === 'all' || o.placedByRole === roleFilter;
    return matchRoute && matchRole;
  });

  // ── Metrics ──────────────────────────────────────────────────────────────

  const totalRevenue = orders.reduce((s, o) => s + parseFloat(o.totalAmount), 0);
  const synced = orders.filter(o => o.erpSyncStatus === 'synced').length;
  const failed = orders.filter(o => o.erpSyncStatus === 'failed').length;
  const toDistributor = orders.filter(o => o.routedTo === 'distributor').length;

  // ── Toggle expand ─────────────────────────────────────────────────────────

  function toggleExpand(id: number) {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="mt-1 text-sm text-gray-500">All orders from distributors and detailers across the network.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            {syncMutation.isPending
              ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Syncing…</>
              : <><Package className="w-4 h-4 mr-2" /> Sync Catalog</>
            }
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-lg p-2"><ShoppingCart className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-xs text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
              <InfoDot widgetId="admin.orders.totalOrders" fallbackLabel="Total Orders" className="ml-auto self-start" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-lg p-2"><BarChart3 className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-xs text-gray-500">Total Value</p>
                <p className="text-xl font-bold text-gray-900">{fmtINR(totalRevenue)}</p>
              </div>
              <InfoDot widgetId="admin.orders.totalValue" fallbackLabel="Total Value" className="ml-auto self-start" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-lg p-2"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-xs text-gray-500">ERP Synced</p>
                <p className="text-2xl font-bold text-gray-900">{synced}</p>
              </div>
              <InfoDot widgetId="admin.orders.erpSynced" fallbackLabel="ERP Synced" className="ml-auto self-start" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 rounded-lg p-2"><Truck className="w-5 h-5 text-purple-600" /></div>
              <div>
                <p className="text-xs text-gray-500">Via Distributor</p>
                <p className="text-2xl font-bold text-gray-900">{toDistributor}</p>
              </div>
              <InfoDot widgetId="admin.orders.viaDistributor" fallbackLabel="Via Distributor" className="ml-auto self-start" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <Select value={routedToFilter} onValueChange={setRoutedToFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Routed to" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Routes</SelectItem>
            <SelectItem value="company">Company (P91)</SelectItem>
            <SelectItem value="distributor">Distributor</SelectItem>
          </SelectContent>
        </Select>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Placed by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="detailer">Detailer</SelectItem>
            <SelectItem value="distributor">Distributor</SelectItem>
          </SelectContent>
        </Select>

        {(routedToFilter !== 'all' || roleFilter !== 'all') && (
          <Button variant="ghost" size="sm" onClick={() => { setRoutedToFilter('all'); setRoleFilter('all'); }}>
            Clear filters
          </Button>
        )}

        <span className="text-sm text-gray-400 self-center ml-auto inline-flex items-center gap-2">
          <span>
            Showing {filtered.length} of {orders.length} orders
            {failed > 0 && (
              <span className="ml-2 text-red-500 font-medium">• {failed} sync failure{failed !== 1 ? 's' : ''}</span>
            )}
          </span>
          <InfoDot widgetId="admin.orders.list" fallbackLabel="Orders List" />
        </span>
      </div>

      {/* Orders list */}
      {isLoading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading orders…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <ShoppingCart className="w-12 h-12 opacity-30 mb-3" />
          <p className="font-medium">No orders found</p>
          <p className="text-xs mt-1">Orders placed by detailers and distributors will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const expanded = expandedOrders.has(order.id);
            return (
              <Card key={order.id} className="overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`mt-0.5 shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                      order.routedTo === 'distributor' ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                      {order.routedTo === 'distributor'
                        ? <Truck className="w-4 h-4 text-blue-600" />
                        : <Building2 className="w-4 h-4 text-purple-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900">Order #{order.id}</span>
                        <RoleBadge role={order.placedByRole} />
                        <SyncBadge status={order.erpSyncStatus} erpName={order.erpOrderName} />
                      </div>
                      <p className="text-sm text-gray-700 mt-0.5">
                        <span className="font-medium">{order.placedByName}</span>
                        <span className="text-gray-400 mx-1">·</span>
                        {order.fulfillmentTag}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="font-bold text-gray-900">{fmtINR(order.totalAmount)}</span>
                    {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {expanded && (
                  <div className="border-t bg-gray-50 px-4 py-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Line Items</p>
                    <div className="space-y-1">
                      {order.items.map(li => (
                        <div key={li.id} className="flex justify-between text-sm">
                          <span className="text-gray-700 flex items-center gap-1.5">
                            {li.itemName}
                            <span className="text-gray-400">× {li.qty}</span>
                            {li.bypassDistributor && (
                              <Badge className="bg-purple-100 text-purple-600 border-purple-200 text-xs py-0">Direct</Badge>
                            )}
                          </span>
                          <span className="font-medium">{fmtINR(li.amount)}</span>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-sm font-bold">
                      <span>Total</span>
                      <span>{fmtINR(order.totalAmount)}</span>
                    </div>
                    {order.erpSyncError && (
                      <p className="text-xs text-red-500 mt-2 break-words">
                        <span className="font-medium">Sync error:</span> {order.erpSyncError}
                      </p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
