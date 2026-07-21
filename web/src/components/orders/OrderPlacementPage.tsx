import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InfoDot } from '@/components/dev/InfoDot';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Package,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Building2,
  Truck,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  X,
  ShoppingBag,
  Layers,
  Tag,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface UomConversion {
  uom: string;
  conversionFactor: number;
}

interface CatalogItem {
  itemCode: string;
  itemName: string;
  brand: string;
  /** Base-UOM price for this role's price list */
  rate: number;
  standardRate: number;
  uom: string;
  uomConversions: UomConversion[];
  /**
   * Per-UOM prices from ERPNext Item Price (uom → rate).
   * Use getPriceForUom() to resolve the right price for the selected UOM.
   */
  uomPrices: Record<string, number>;
  bypassDistributor: boolean;
  stockQty: number;
  /** e.g. "PWC" (detailer/installer) or "CAD" (distributor) */
  priceList: string;
}

interface CartEntry {
  itemCode: string;
  itemName: string;
  brand: string;
  rate: number;
  qty: number;
  uom: string;
  bypassDistributor: boolean;
  priceList: string;
}

interface OrderResult {
  pulseOrderId: number;
  erpOrderName: string | null;
  erpSyncFailed: boolean;
  fulfillmentTag: string;
  routedTo: 'company' | 'distributor';
  itemCount: number;
  totalAmount: number;
}

interface PlacedOrder {
  id: number;
  placedByName: string;
  placedByRole: string;
  routedTo: string;
  distributorName: string | null;
  fulfillmentTag: string;
  totalAmount: string;
  erpOrderName: string | null;
  erpSyncStatus: string;
  createdAt: string;
  items: {
    id: number;
    itemCode: string;
    itemName: string;
    qty: number;
    uom: string;
    rate: string;
    amount: string;
  }[];
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  roleLabel: string;
  subtitle: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtINR(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function syncBadge(status: string, erpName: string | null) {
  if (status === 'synced' && erpName)
    return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs font-mono">{erpName}</Badge>;
  if (status === 'failed')
    return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">ERP Sync Failed</Badge>;
  if (status === 'local_only')
    return <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-xs">Saved Locally</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">Pending ERP</Badge>;
}

function routingTag(routedTo: string, distributorName?: string | null) {
  if (routedTo === 'distributor' && distributorName)
    return (
      <div className="flex items-center gap-1 text-blue-700 text-xs font-medium">
        <Truck className="w-3 h-3" /> {distributorName}
      </div>
    );
  return (
    <div className="flex items-center gap-1 text-purple-700 text-xs font-medium">
      <Building2 className="w-3 h-3" /> P91 India (Direct)
    </div>
  );
}

// ─── Price helper: resolve UOM-specific price ─────────────────────────────────

/**
 * Return the price for `uom` from the item's uomPrices map.
 * Falls back to `item.rate` (base-UOM price) if no UOM-specific entry exists.
 */
function getPriceForUom(item: CatalogItem, uom: string): number {
  return item.uomPrices?.[uom] ?? item.rate;
}

// ─── UOM Selector — always shown as a Select (never static text) ──────────

function UomSelect({
  item,
  value,
  onChange,
}: {
  item: CatalogItem;
  value: string;
  onChange: (uom: string) => void;
}) {
  const options = [
    { uom: item.uom, label: item.uom },
    ...(item.uomConversions ?? []).map(c => ({ uom: c.uom, label: c.uom })),
  ].filter((o, i, arr) => arr.findIndex(x => x.uom === o.uom) === i);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-7 text-xs w-24 border-gray-200 bg-white">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(o => (
          <SelectItem key={o.uom} value={o.uom} className="text-xs">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function OrderPlacementPage({ roleLabel, subtitle }: Props) {
  const { toast } = useToast();

  // UI state
  const [catalogOpen, setCatalogOpen]     = useState(false);
  const [cartOpen, setCartOpen]           = useState(false);
  const [reviewOpen, setReviewOpen]       = useState(false);
  const [successOpen, setSuccessOpen]     = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  // Cart state
  const [cart, setCart]                   = useState<CartEntry[]>([]);
  const [orderResults, setOrderResults]   = useState<OrderResult[]>([]);

  // Catalog filter state
  const [search, setSearch]               = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [brandFilter, setBrandFilter]     = useState<string>('all');

  // Per-item UOM selection (itemCode → selectedUom)
  const [selectedUoms, setSelectedUoms]   = useState<Map<string, string>>(new Map());

  // Debounce the search input (300ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // ── Data fetching ────────────────────────────────────────────────────────

  // Real-time catalog: fetches from ERPNext directly (not local DB cache)
  const {
    data: catalog = [],
    isLoading: catalogLoading,
    refetch: refetchCatalog,
    isFetching: catalogFetching,
  } = useQuery<CatalogItem[]>({
    queryKey: ['/api/orders/search'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/orders/search?q=`);
      return res.json();
    },
    enabled: catalogOpen,
    staleTime: 60_000,   // cache for 60 s — client-side filtering handles search
    refetchOnWindowFocus: false,
  });

  const {
    data: myOrders = [],
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery<PlacedOrder[]>({
    queryKey: ['/api/orders/mine'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/orders/mine');
      return res.json();
    },
  });

  // ── Catalog filtering (brand filter applied client-side) ─────────────────

  const brands = useMemo(() => {
    const set = new Set(catalog.map(i => i.brand).filter(Boolean));
    return Array.from(set).sort();
  }, [catalog]);

  const filteredCatalog = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return catalog.filter(i => {
      const matchesText = !q ||
        i.itemName.toLowerCase().includes(q) ||
        i.itemCode.toLowerCase().includes(q) ||
        (i.brand ?? '').toLowerCase().includes(q);
      const matchesBrand = brandFilter === 'all' || i.brand === brandFilter;
      return matchesText && matchesBrand;
    });
  }, [catalog, debouncedSearch, brandFilter]);

  // ── Cart helpers ─────────────────────────────────────────────────────────

  function getUomForItem(item: CatalogItem): string {
    return selectedUoms.get(item.itemCode) ?? item.uom ?? 'Nos';
  }

  function setUomForItem(itemCode: string, uom: string) {
    setSelectedUoms(prev => new Map(prev).set(itemCode, uom));
  }

  function cartTotal(): number {
    return cart.reduce((sum, e) => sum + e.rate * e.qty, 0);
  }

  function cartCount(): number {
    return cart.reduce((sum, e) => sum + e.qty, 0);
  }

  // UOM-aware: returns qty for this exact (itemCode, uom) combination
  function getQtyInCart(itemCode: string, uom: string): number {
    return cart
      .filter(e => e.itemCode === itemCode && e.uom === uom)
      .reduce((sum, e) => sum + e.qty, 0);
  }

  function addToCart(item: CatalogItem) {
    const selectedUom = getUomForItem(item);
    setCart(prev => {
      const existing = prev.find(e => e.itemCode === item.itemCode && e.uom === selectedUom);
      if (existing) {
        return prev.map(e =>
          e.itemCode === item.itemCode && e.uom === selectedUom
            ? { ...e, qty: e.qty + 1 }
            : e
        );
      }
      return [...prev, {
        itemCode: item.itemCode,
        itemName: item.itemName,
        brand: item.brand,
        rate: getPriceForUom(item, selectedUom),
        qty: 1,
        uom: selectedUom,
        bypassDistributor: item.bypassDistributor,
        priceList: item.priceList,
      }];
    });
  }

  function decreaseQty(itemCode: string, uom: string) {
    setCart(prev => {
      const entry = prev.find(e => e.itemCode === itemCode && e.uom === uom);
      if (!entry) return prev;
      if (entry.qty <= 1) return prev.filter(e => !(e.itemCode === itemCode && e.uom === uom));
      return prev.map(e =>
        e.itemCode === itemCode && e.uom === uom ? { ...e, qty: e.qty - 1 } : e
      );
    });
  }

  function incrementQty(itemCode: string, uom: string) {
    setCart(prev => prev.map(e =>
      e.itemCode === itemCode && e.uom === uom ? { ...e, qty: e.qty + 1 } : e
    ));
  }

  function removeFromCart(itemCode: string, uom: string) {
    setCart(prev => prev.filter(e => !(e.itemCode === itemCode && e.uom === uom)));
  }

  // ── Routing preview ──────────────────────────────────────────────────────

  const directItems      = cart.filter(e => e.bypassDistributor);
  const distributorItems = cart.filter(e => !e.bypassDistributor);
  const isMixedCart      = directItems.length > 0 && distributorItems.length > 0;

  // ── Order placement ──────────────────────────────────────────────────────

  const placeMutation = useMutation({
    mutationFn: async () => {
      const body = { cart: cart.map(e => ({ itemCode: e.itemCode, qty: e.qty, uom: e.uom })) };
      const res = await apiRequest('POST', '/api/orders', body);
      const data = await res.json();
      if (!res.ok && res.status !== 207) throw new Error(data.error || 'Order failed');
      return data as { success: boolean; erpSyncFailed?: boolean; orders: OrderResult[]; message?: string };
    },
    onSuccess: (data) => {
      setOrderResults(data.orders);
      setCart([]);
      setCartOpen(false);
      setReviewOpen(false);
      setCatalogOpen(false);
      setSuccessOpen(true);
      queryClient.invalidateQueries({ queryKey: ['/api/orders/mine'] });
      if (data.erpSyncFailed) {
        toast({
          title: 'Order saved — ERP sync issue',
          description: data.message || 'Your order was saved but could not be synced to ERP right now.',
          variant: 'destructive',
        });
      }
    },
    onError: (err: Error) => {
      toast({ title: 'Order failed', description: err.message, variant: 'destructive' });
    },
  });

  function toggleExpand(id: number) {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function openNewOrder() {
    setSearch('');
    setBrandFilter('all');
    setCatalogOpen(true);
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            My Orders
            <InfoDot widgetId={`${roleLabel}.orders.page`} fallbackLabel="Orders" />
          </h1>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
        <Button
          onClick={openNewOrder}
          className="bg-green-600 hover:bg-green-700 shrink-0"
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          Place New Order
        </Button>
      </div>

      {/* ── Order History ────────────────────────────────────────────────── */}
      {ordersLoading ? (
        <div className="flex justify-center py-20 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading orders…
        </div>
      ) : myOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-4">
            <ShoppingBag className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">No orders yet</h2>
          <p className="text-sm text-gray-500 max-w-xs mb-6">
            Browse the product catalog and place your first order to get started.
          </p>
          <Button onClick={openNewOrder} className="bg-green-600 hover:bg-green-700">
            <ShoppingBag className="w-4 h-4 mr-2" /> Browse Products & Order
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">
              {myOrders.length} order{myOrders.length !== 1 ? 's' : ''}
            </p>
            <Button variant="ghost" size="sm" onClick={() => refetchOrders()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
          </div>

          {myOrders.map(order => {
            const expanded = expandedOrders.has(order.id);
            return (
              <Card
                key={order.id}
                className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                      order.routedTo === 'distributor' ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                      {order.routedTo === 'distributor'
                        ? <Truck className="w-5 h-5 text-blue-600" />
                        : <Building2 className="w-5 h-5 text-purple-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900">Order #{order.id}</span>
                        {syncBadge(order.erpSyncStatus, order.erpOrderName)}
                      </div>
                      <div className="mt-0.5">{routingTag(order.routedTo, order.distributorName)}</div>
                      <p className="text-xs text-gray-400 mt-0.5">{fmtDate(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{fmtINR(order.totalAmount)}</p>
                      <p className="text-xs text-gray-400">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {expanded
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </div>
                </div>

                {expanded && (
                  <div className="border-t bg-gray-50 px-4 py-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Line Items
                    </p>
                    <div className="space-y-2">
                      {order.items.map(li => (
                        <div
                          key={li.id}
                          className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2 border border-gray-100"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-gray-800 font-medium">{li.itemName}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500">Qty: {li.qty} {li.uom || ''}</span>
                              <span className="text-xs text-gray-400">@ {fmtINR(li.rate)}</span>
                            </div>
                          </div>
                          <span className="font-semibold text-gray-900 ml-2">{fmtINR(li.amount)}</span>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between text-sm font-bold text-gray-900">
                      <span>Order Total</span>
                      <span>{fmtINR(order.totalAmount)}</span>
                    </div>
                    {order.erpOrderName && (
                      <p className="text-xs text-gray-400 mt-2">ERPNext Ref: {order.erpOrderName}</p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          CATALOG SHEET — real-time ERPNext search with role-based pricing
      ═══════════════════════════════════════════════════════════════════ */}
      <Sheet open={catalogOpen} onOpenChange={setCatalogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0 gap-0">

          {/* Catalog Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b bg-white shrink-0">
            <div>
              <SheetTitle className="text-lg font-bold">Browse Products</SheetTitle>
              <p className="text-xs text-gray-500 mt-0.5">Select items and add to cart</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="relative"
                onClick={() => setCartOpen(true)}
                disabled={cart.length === 0}
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                Cart
                {cartCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {cartCount()}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setCatalogOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search + Brand Filter */}
          <div className="px-4 py-3 border-b bg-gray-50 shrink-0 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              {catalogFetching && !catalogLoading && (
                <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 animate-spin" />
              )}
              <Input
                className="pl-9 pr-9 bg-white"
                placeholder="Search by name, code or brand…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <button
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  brandFilter === 'all'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
                }`}
                onClick={() => setBrandFilter('all')}
              >
                All Brands
              </button>
              {brands.map(b => (
                <button
                  key={b}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    brandFilter === b
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
                  }`}
                  onClick={() => setBrandFilter(b)}
                >
                  {b}
                </button>
              ))}
              <button
                className="px-2 py-1 rounded-full text-xs text-gray-400 hover:text-green-600 transition-colors"
                onClick={() => refetchCatalog()}
                title="Refresh catalog"
              >
                <RefreshCw className="w-3 h-3 inline" /> Refresh
              </button>
            </div>
          </div>

          {/* Product List */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {catalogLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin mb-3" />
                <p>Loading products…</p>
              </div>
            ) : filteredCatalog.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center">
                <Package className="w-12 h-12 opacity-30 mb-3" />
                <p className="font-medium">
                  {catalog.length === 0
                    ? 'No products available yet'
                    : 'No products match your filters'}
                </p>
                {catalog.length === 0 && (
                  <p className="text-xs mt-1 max-w-xs">
                    Products published in ERPNext will appear here. Ask your admin to publish items in Pulse.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCatalog.map(item => {
                  const selectedUom = getUomForItem(item);
                  const qtyInCart   = getQtyInCart(item.itemCode, selectedUom);
                  const stock       = parseFloat(String(item.stockQty));

                  return (
                    <div
                      key={item.itemCode}
                      className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-green-200 transition-colors"
                    >
                      {/* Item info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs shrink-0">
                            {item.brand || 'P91'}
                          </Badge>
                          {item.bypassDistributor && (
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs shrink-0">
                              Direct from P91
                            </Badge>
                          )}
                        </div>
                        <p className="font-semibold text-gray-900 text-sm mt-1 leading-snug">
                          {item.itemName}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.itemCode}</p>

                        {/* Price row */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-lg font-bold text-green-700">
                            {fmtINR(getPriceForUom(item, selectedUom))}
                          </span>
                          {getPriceForUom(item, selectedUom) !== item.standardRate && item.standardRate > 0 && (
                            <span className="text-xs text-gray-400 line-through">
                              {fmtINR(item.standardRate)}
                            </span>
                          )}
                          <span className="flex items-center gap-0.5 text-xs text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                            <Tag className="w-2.5 h-2.5" /> {item.priceList}
                          </span>
                          <span className={`text-xs ${stock > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                            {stock > 0 ? `${stock} in stock` : 'Check availability'}
                          </span>
                        </div>

                        {/* UOM Selector — always a dropdown */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">UOM:</span>
                          <UomSelect
                            item={item}
                            value={selectedUom}
                            onChange={uom => setUomForItem(item.itemCode, uom)}
                          />
                        </div>
                      </div>

                      {/* Add to Cart control */}
                      <div className="shrink-0 flex flex-col items-end gap-2">
                        {qtyInCart === 0 ? (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => addToCart(item)}
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" /> Add
                          </Button>
                        ) : (
                          <div className="flex items-center gap-1 bg-green-50 border border-green-200 rounded-lg px-2 py-1">
                            <button
                              className="w-6 h-6 flex items-center justify-center text-green-600 hover:bg-green-100 rounded"
                              onClick={() => decreaseQty(item.itemCode, selectedUom)}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-bold text-green-700 w-5 text-center">
                              {qtyInCart}
                            </span>
                            <button
                              className="w-6 h-6 flex items-center justify-center text-green-600 hover:bg-green-100 rounded"
                              onClick={() => addToCart(item)}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sticky Cart Bar */}
          {cart.length > 0 && (
            <div className="shrink-0 border-t bg-white px-4 py-3">
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                View Cart ({cartCount()} item{cartCount() !== 1 ? 's' : ''}) — {fmtINR(cartTotal())}
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ═══════════════════════════════════════════════════════════════════
          CART SHEET
      ═══════════════════════════════════════════════════════════════════ */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
          <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
            <SheetTitle className="flex items-center gap-2 text-lg font-bold">
              <ShoppingCart className="w-5 h-5" /> Your Cart
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={() => setCartOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 px-4">
              <Package className="w-12 h-12 mb-3 opacity-40" />
              <p className="font-medium">Your cart is empty</p>
              <p className="text-xs mt-1">Go back to catalog to add products</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => { setCartOpen(false); setCatalogOpen(true); }}
              >
                Browse Products
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto py-4 px-4 space-y-2">
                {cart.map(entry => (
                  <div
                    key={`${entry.itemCode}-${entry.uom}`}
                    className="flex items-start gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 leading-snug">
                        {entry.itemName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{entry.brand}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">
                          {entry.uom}
                        </span>
                        <span className="text-xs text-green-700 font-semibold">
                          {fmtINR(entry.rate)} each
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-100 rounded px-1 py-0.5">
                          {entry.priceList}
                        </span>
                      </div>
                      {entry.bypassDistributor && (
                        <span className="text-xs text-purple-600 font-medium">Direct from P91</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        className="w-7 h-7 flex items-center justify-center border rounded-lg hover:bg-gray-100"
                        onClick={() => decreaseQty(entry.itemCode, entry.uom)}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-sm font-bold">{entry.qty}</span>
                      <button
                        className="w-7 h-7 flex items-center justify-center border rounded-lg hover:bg-gray-100"
                        onClick={() => incrementQty(entry.itemCode, entry.uom)}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 ml-1"
                        onClick={() => removeFromCart(entry.itemCode, entry.uom)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="shrink-0 border-t px-4 py-4 bg-white space-y-3">
                {/* Routing preview */}
                {isMixedCart ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs space-y-1">
                    <p className="font-semibold text-amber-800 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" /> Mixed cart — 2 orders will be created
                    </p>
                    <p className="text-amber-700">
                      {directItems.length} item{directItems.length !== 1 ? 's' : ''} → P91 India (Direct)
                    </p>
                    <p className="text-amber-700">
                      {distributorItems.length} item{distributorItems.length !== 1 ? 's' : ''} → Your Distributor
                    </p>
                  </div>
                ) : directItems.length > 0 ? (
                  <div className="bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 text-xs text-purple-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> All items fulfilled directly by P91 India
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2 text-xs text-green-700 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" /> All items routed to your distributor
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {cartCount()} item{cartCount() !== 1 ? 's' : ''}
                  </span>
                  <span className="text-lg font-bold text-gray-900">{fmtINR(cartTotal())}</span>
                </div>

                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => setReviewOpen(true)}
                  disabled={placeMutation.isPending}
                >
                  Review & Place Order <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ═══════════════════════════════════════════════════════════════════
          REVIEW & CONFIRM DIALOG
      ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" /> Review Your Order
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {isMixedCart ? (
              <div className="space-y-3">
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-purple-50 px-3 py-2 flex items-center gap-2 text-xs font-semibold text-purple-800">
                    <Building2 className="w-3.5 h-3.5" /> Order 1 — Direct from P91 India
                  </div>
                  <div className="px-3 py-2 space-y-1">
                    {directItems.map(e => (
                      <div key={`${e.itemCode}-${e.uom}`} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {e.itemName}{' '}
                          <span className="text-gray-400">× {e.qty} {e.uom}</span>
                        </span>
                        <span className="font-medium">{fmtINR(e.rate * e.qty)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-green-50 px-3 py-2 flex items-center gap-2 text-xs font-semibold text-green-800">
                    <Truck className="w-3.5 h-3.5" /> Order 2 — Via your Distributor
                  </div>
                  <div className="px-3 py-2 space-y-1">
                    {distributorItems.map(e => (
                      <div key={`${e.itemCode}-${e.uom}`} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {e.itemName}{' '}
                          <span className="text-gray-400">× {e.qty} {e.uom}</span>
                        </span>
                        <span className="font-medium">{fmtINR(e.rate * e.qty)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className={`px-3 py-2 flex items-center gap-2 text-xs font-semibold ${
                  directItems.length > 0
                    ? 'bg-purple-50 text-purple-800'
                    : 'bg-green-50 text-green-800'
                }`}>
                  {directItems.length > 0
                    ? <><Building2 className="w-3.5 h-3.5" /> Fulfilled directly by P91 India</>
                    : <><Truck className="w-3.5 h-3.5" /> Routed via your Distributor</>
                  }
                </div>
                <div className="px-3 py-2 space-y-1">
                  {cart.map(e => (
                    <div key={`${e.itemCode}-${e.uom}`} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {e.itemName}{' '}
                        <span className="text-gray-400">× {e.qty} {e.uom}</span>
                      </span>
                      <span className="font-medium">{fmtINR(e.rate * e.qty)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center font-bold text-base border-t pt-3">
              <span>Total</span>
              <span className="text-green-700">{fmtINR(cartTotal())}</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setReviewOpen(false)}
              disabled={placeMutation.isPending}
            >
              Edit Cart
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => placeMutation.mutate()}
              disabled={placeMutation.isPending}
            >
              {placeMutation.isPending
                ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Placing…</>
                : <><CheckCircle2 className="w-4 h-4 mr-2" /> Confirm & Place Order</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════
          SUCCESS DIALOG
      ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-6 h-6" /> Order Placed Successfully!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {orderResults.map((r, i) => (
              <div key={i} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-800">
                    {orderResults.length > 1 ? `Order ${i + 1}` : 'Your Order'} #{r.pulseOrderId}
                  </span>
                  <span className="font-bold text-green-700">{fmtINR(r.totalAmount)}</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{r.fulfillmentTag}</p>
                {r.erpOrderName
                  ? <Badge className="bg-green-100 text-green-800 border-green-200 text-xs font-mono">
                      {r.erpOrderName}
                    </Badge>
                  : r.erpSyncFailed
                    ? <Badge className="bg-red-100 text-red-800 text-xs">
                        <AlertCircle className="w-3 h-3 mr-1" />ERP sync pending
                      </Badge>
                    : <Badge className="bg-gray-100 text-gray-600 text-xs">
                        <Clock className="w-3 h-3 mr-1" />Saved locally
                      </Badge>
                }
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => { setSuccessOpen(false); refetchOrders(); }}
            >
              View My Orders
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
