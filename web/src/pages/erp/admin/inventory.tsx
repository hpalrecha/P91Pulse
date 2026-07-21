import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Package, Edit, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { InfoDot } from '@/components/dev/InfoDot';
import type { Inventory, Product } from '@shared/schema';

// Extended type for inventory with product details
interface InventoryWithProduct extends Inventory {
  productName: string;
  productCategory: string;
  productType: string;
}

// Form data type for inventory creation/editing
interface InventoryFormData {
  productId: number;
  batchNumber: string;
  warrantyNumber?: string;
  serialNumber?: string;
  lotNumber?: string;
  quantity: number;
  warrantyPeriodMonths: number;
  status: string;
  location?: string;
  notes?: string;
}

export default function AdminInventoryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryWithProduct | null>(null);
  const [formData, setFormData] = useState<InventoryFormData>({
    productId: 0,
    batchNumber: '',
    warrantyNumber: '',
    serialNumber: '',
    lotNumber: '',
    quantity: 1,
    warrantyPeriodMonths: 12,
    status: 'in_stock',
    location: '',
    notes: ''
  });

  // Fetch inventory data
  const { data: inventory = [], isLoading } = useQuery<InventoryWithProduct[]>({
    queryKey: ['/api/erp/inventory'],
    queryFn: async () => {
      const response = await fetch('/api/erp/inventory', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }
      return response.json();
    }
  });

  // Fetch products for dropdown
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/erp/products'],
    queryFn: async () => {
      const response = await fetch('/api/erp/products', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    }
  });

  // Create inventory mutation
  const createMutation = useMutation({
    mutationFn: async (data: InventoryFormData) => {
      const response = await fetch('/api/erp/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create inventory item');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/erp/inventory'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Inventory item created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update inventory mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InventoryFormData> }) => {
      const response = await fetch(`/api/erp/inventory/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update inventory item');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/erp/inventory'] });
      setIsEditDialogOpen(false);
      setEditingItem(null);
      resetForm();
      toast({
        title: 'Success',
        description: 'Inventory item updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete inventory mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/erp/inventory/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete inventory item');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/erp/inventory'] });
      toast({
        title: 'Success',
        description: 'Inventory item deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      productId: 0,
      batchNumber: '',
      warrantyNumber: '',
      serialNumber: '',
      lotNumber: '',
      quantity: 1,
      warrantyPeriodMonths: 12,
      status: 'in_stock',
      location: '',
      notes: ''
    });
  };

  const handleEdit = (item: InventoryWithProduct) => {
    setEditingItem(item);
    setFormData({
      productId: item.productId,
      batchNumber: item.batchNumber,
      warrantyNumber: item.warrantyNumber || '',
      serialNumber: item.serialNumber || '',
      lotNumber: item.lotNumber || '',
      quantity: item.quantity,
      warrantyPeriodMonths: item.warrantyPeriodMonths,
      status: item.status,
      location: item.location || '',
      notes: item.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.productId || !formData.batchNumber) {
      toast({
        title: 'Validation Error',
        description: 'Product and batch number are required',
        variant: 'destructive',
      });
      return;
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Filter inventory based on search and status
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = !searchTerm || 
      item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.warrantyNumber && item.warrantyNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      in_stock: { label: 'In Stock', variant: 'default' as const },
      reserved: { label: 'Reserved', variant: 'secondary' as const },
      sold: { label: 'Sold', variant: 'outline' as const },
      damaged: { label: 'Damaged', variant: 'destructive' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Manage product inventory with batch and warranty numbers</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Inventory Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Inventory Item</DialogTitle>
              <DialogDescription>
                Create a new inventory entry with batch and warranty tracking
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product *</Label>
                <Select value={formData.productId.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, productId: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} ({product.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="batchNumber">Batch Number *</Label>
                <Input
                  id="batchNumber"
                  value={formData.batchNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                  placeholder="Enter batch number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="warrantyNumber">Warranty Number</Label>
                <Input
                  id="warrantyNumber"
                  value={formData.warrantyNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, warrantyNumber: e.target.value }))}
                  placeholder="Enter warranty number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                  placeholder="Enter serial number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lotNumber">Lot Number</Label>
                <Input
                  id="lotNumber"
                  value={formData.lotNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, lotNumber: e.target.value }))}
                  placeholder="Enter lot number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="warrantyPeriod">Warranty Period (Months)</Label>
                <Input
                  id="warrantyPeriod"
                  type="number"
                  min="1"
                  value={formData.warrantyPeriodMonths}
                  onChange={(e) => setFormData(prev => ({ ...prev, warrantyPeriodMonths: parseInt(e.target.value) || 12 }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Storage location or warehouse"
                />
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes or comments"
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Item'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between gap-2">
            <span className="flex items-center">Filters</span>
            <InfoDot widgetId="admin.inventory.filters" fallbackLabel="Inventory Filters" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by batch number, product name, or warranty number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
            <InfoDot widgetId="admin.inventory.totalItems" fallbackLabel="Total Items" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Stock</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <InfoDot widgetId="admin.inventory.inStock" fallbackLabel="In Stock" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventory.filter(item => item.status === 'in_stock').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reserved</CardTitle>
            <Package className="h-4 w-4 text-yellow-600" />
            <InfoDot widgetId="admin.inventory.reserved" fallbackLabel="Reserved" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventory.filter(item => item.status === 'reserved').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
            <InfoDot widgetId="admin.inventory.totalQuantity" fallbackLabel="Total Quantity" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventory.reduce((total, item) => total + item.quantity, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center">Inventory Items</span>
            <InfoDot widgetId="admin.inventory.table" fallbackLabel="Inventory Items" />
          </CardTitle>
          <CardDescription>
            Showing {filteredInventory.length} of {inventory.length} items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Product</th>
                  <th className="text-left py-3 px-4">Batch Number</th>
                  <th className="text-left py-3 px-4">Warranty Number</th>
                  <th className="text-left py-3 px-4">Quantity</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Location</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-sm text-gray-500">{item.productCategory}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-sm">{item.batchNumber}</td>
                    <td className="py-3 px-4 font-mono text-sm">{item.warrantyNumber || '-'}</td>
                    <td className="py-3 px-4">{item.quantity}</td>
                    <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                    <td className="py-3 px-4 text-sm">{item.location || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this inventory item?')) {
                              deleteMutation.mutate(item.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredInventory.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No inventory items found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>
              Update inventory item details
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-product">Product *</Label>
              <Select value={formData.productId.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, productId: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} ({product.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-batchNumber">Batch Number *</Label>
              <Input
                id="edit-batchNumber"
                value={formData.batchNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                placeholder="Enter batch number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-warrantyNumber">Warranty Number</Label>
              <Input
                id="edit-warrantyNumber"
                value={formData.warrantyNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, warrantyNumber: e.target.value }))}
                placeholder="Enter warranty number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-serialNumber">Serial Number</Label>
              <Input
                id="edit-serialNumber"
                value={formData.serialNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                placeholder="Enter serial number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-lotNumber">Lot Number</Label>
              <Input
                id="edit-lotNumber"
                value={formData.lotNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, lotNumber: e.target.value }))}
                placeholder="Enter lot number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-quantity">Quantity</Label>
              <Input
                id="edit-quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-warrantyPeriod">Warranty Period (Months)</Label>
              <Input
                id="edit-warrantyPeriod"
                type="number"
                min="1"
                value={formData.warrantyPeriodMonths}
                onChange={(e) => setFormData(prev => ({ ...prev, warrantyPeriodMonths: parseInt(e.target.value) || 12 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Storage location or warehouse"
              />
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes or comments"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Updating...' : 'Update Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}