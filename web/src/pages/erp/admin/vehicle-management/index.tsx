import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Car, Plus, Check, X, Clock, User, Calendar, MessageSquare, Trash2, Edit } from 'lucide-react';
import { InfoDot } from '@/components/dev/InfoDot';
import { AddVehicleBrandDialog } from '@/components/vehicles/AddVehicleBrandDialog';
import { ViewVehicleDialog } from '@/components/vehicles/ViewVehicleDialog';
import { EditVehicleDialog } from '@/components/vehicles/EditVehicleDialog';
import { AdminVehicleSearch } from '@/components/vehicles/AdminVehicleSearch';

interface VehicleRequest {
  id: number;
  requestType: 'brand' | 'model';
  requestedName: string;
  brandId?: number;
  brandName?: string;
  category?: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminResponse?: string;
  requestedBy: number;
  requestedByName: string;
  requestedByRole: string;
  processedBy?: number;
  processedByName?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

interface VehicleBrand {
  id: number;
  name: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface VehicleModel {
  id: number;
  name: string;
  brandId: number;
  brandName: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export default function VehicleManagement() {
  const [selectedTab, setSelectedTab] = useState<'requests' | 'search' | 'brands' | 'models'>('requests');
  const [selectedRequest, setSelectedRequest] = useState<VehicleRequest | null>(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [showAddVehicleDialog, setShowAddVehicleDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vehicle requests
  const { data: vehicleRequests, isLoading: requestsLoading, refetch: refetchRequests } = useQuery<VehicleRequest[]>({
    queryKey: ['/api/erp/vehicle-requests'],
  });

  // Fetch brands
  const { data: brands, isLoading: brandsLoading, refetch: refetchBrands } = useQuery<VehicleBrand[]>({
    queryKey: ['/api/erp/vehicle-management/brands'],
  });

  // Fetch models
  const { data: models, isLoading: modelsLoading, refetch: refetchModels } = useQuery<VehicleModel[]>({
    queryKey: ['/api/erp/vehicle-management/models'],
  });

  // Process vehicle request mutation
  const processRequestMutation = useMutation({
    mutationFn: async ({ requestId, status, adminResponse }: { requestId: number, status: 'approved' | 'rejected', adminResponse: string }) => {
      const response = await apiRequest('PUT', `/api/erp/vehicle-requests/${requestId}`, {
        status,
        adminResponse
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/erp/vehicle-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/erp/vehicle-management/brands'] });
      queryClient.invalidateQueries({ queryKey: ['/api/erp/vehicle-management/models'] });
      setShowProcessDialog(false);
      setSelectedRequest(null);
      setAdminResponse('');
      toast({
        title: "Request processed",
        description: "Vehicle request has been processed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process request",
        variant: "destructive",
      });
    },
  });

  // Edit and delete handlers
  const handleEditBrand = (brand: VehicleBrand) => {
    setEditingItem({ ...brand, type: 'brand' });
    setShowEditDialog(true);
  };

  const handleEditModel = (model: VehicleModel) => {
    setEditingItem({ ...model, type: 'model' });
    setShowEditDialog(true);
  };

  const handleDeleteBrand = async (brandId: number) => {
    if (!confirm('Are you sure you want to delete this brand?')) return;
    
    try {
      await apiRequest('DELETE', `/api/erp/vehicle-management/brands/${brandId}`);
      toast({ title: "Success", description: "Brand deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/erp/vehicle-management/brands'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete brand",
        variant: "destructive",
      });
    }
  };

  const handleDeleteModel = async (modelId: number) => {
    if (!confirm('Are you sure you want to delete this model?')) return;
    
    try {
      await apiRequest('DELETE', `/api/erp/vehicle-management/models/${modelId}`);
      toast({ title: "Success", description: "Model deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/erp/vehicle-management/models'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete model",
        variant: "destructive",
      });
    }
  };

  const handleProcessRequest = (status: 'approved' | 'rejected') => {
    if (!selectedRequest) return;
    
    // Only require admin response when rejecting
    if (status === 'rejected' && !adminResponse.trim()) {
      toast({
        title: "Response required",
        description: "Please provide a reason for rejecting this request.",
        variant: "destructive",
      });
      return;
    }

    processRequestMutation.mutate({
      requestId: selectedRequest.id,
      status,
      adminResponse: adminResponse.trim() || undefined
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <Check className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const pendingRequests = vehicleRequests?.filter(r => r.status === 'pending') || [];
  const processedRequests = vehicleRequests?.filter(r => r.status !== 'pending') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Vehicle Management</h1>
          <p className="text-muted-foreground mt-2">Manage vehicle brands, models, and review requests from users</p>
        </div>
        <Button onClick={() => setShowAddVehicleDialog(true)} className="bg-[#4db848] hover:bg-[#3da037]">
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle Brand/Model
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={(value: any) => setSelectedTab(value)} className="space-y-6">
        <TabsList>
          <TabsTrigger value="requests" className="relative">
            Vehicle Requests
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2 px-2 py-1 text-xs">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="search">Vehicle Search</TabsTrigger>
          <TabsTrigger value="brands">Brands ({brands?.length || 0})</TabsTrigger>
          <TabsTrigger value="models">Models ({models?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-6">
          <div className="grid gap-6">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-600 justify-between gap-2">
                    <span className="flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      Pending Requests ({pendingRequests.length})
                    </span>
                    <InfoDot widgetId="admin.vehicleManagement.pendingRequests" fallbackLabel="Pending vehicle requests" />
                  </CardTitle>
                  <CardDescription>These requests need your review and approval</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 bg-orange-50/50">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-2">
                              <Badge variant={getStatusBadgeVariant(request.status)} className="flex items-center space-x-1">
                                {getStatusIcon(request.status)}
                                <span className="capitalize">{request.status}</span>
                              </Badge>
                              <Badge variant="outline">
                                {request.requestType === 'brand' ? 'New Brand' : 'New Model'}
                              </Badge>
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg">
                                {request.requestType === 'brand' ? request.requestedName : 
                                 `${request.brandName} - ${request.requestedName}`}
                              </h4>
                              {request.description && (
                                <p className="text-sm text-muted-foreground mt-1">{request.description}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <User className="w-4 h-4" />
                                <span>{request.requestedByName} ({request.requestedByRole})</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowProcessDialog(true);
                              }}
                            >
                              Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Processed Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="flex items-center">Recent Processed Requests</span>
                  <InfoDot widgetId="admin.vehicleManagement.processedRequests" fallbackLabel="Processed vehicle requests" />
                </CardTitle>
                <CardDescription>Previously reviewed requests</CardDescription>
              </CardHeader>
              <CardContent>
                {processedRequests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No processed requests yet</p>
                ) : (
                  <div className="space-y-4">
                    {processedRequests.slice(0, 10).map((request) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-2">
                              <Badge variant={getStatusBadgeVariant(request.status)} className="flex items-center space-x-1">
                                {getStatusIcon(request.status)}
                                <span className="capitalize">{request.status}</span>
                              </Badge>
                              <Badge variant="outline">
                                {request.requestType === 'brand' ? 'New Brand' : 'New Model'}
                              </Badge>
                            </div>
                            <div>
                              <h4 className="font-semibold">
                                {request.requestType === 'brand' ? request.requestedName : 
                                 `${request.brandName} - ${request.requestedName}`}
                              </h4>
                              {request.adminResponse && (
                                <p className="text-sm text-muted-foreground mt-1 italic">
                                  Admin: {request.adminResponse}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <User className="w-4 h-4" />
                                <span>{request.requestedByName}</span>
                              </div>
                              {request.processedAt && (
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>Processed: {new Date(request.processedAt).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="brands" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center">Vehicle Brands</span>
                <InfoDot widgetId="admin.vehicleManagement.brands" fallbackLabel="Vehicle Brands" />
              </CardTitle>
              <CardDescription>Manage vehicle brands in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {brandsLoading ? (
                <p>Loading brands...</p>
              ) : !brands?.length ? (
                <p className="text-muted-foreground text-center py-8">No brands available</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {brands.map((brand) => (
                    <div key={brand.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{brand.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Added: {new Date(brand.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={brand.isActive ? 'default' : 'secondary'}>
                            {brand.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedVehicle(brand);
                                setShowViewDialog(true);
                              }}
                            >
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditBrand(brand)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDeleteBrand(brand.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <AdminVehicleSearch />
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center">Vehicle Models</span>
                <InfoDot widgetId="admin.vehicleManagement.models" fallbackLabel="Vehicle Models" />
              </CardTitle>
              <CardDescription>Manage vehicle models in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {modelsLoading ? (
                <p>Loading models...</p>
              ) : !models?.length ? (
                <p className="text-muted-foreground text-center py-8">No models available</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {models.map((model) => (
                    <div key={model.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{model.name}</h4>
                          <p className="text-sm text-muted-foreground">Brand: {model.brandName}</p>
                          <p className="text-sm text-muted-foreground">Category: {model.category}</p>
                          <p className="text-sm text-muted-foreground">
                            Added: {new Date(model.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={model.isActive ? 'default' : 'secondary'}>
                            {model.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedVehicle(model);
                                setShowViewDialog(true);
                              }}
                            >
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditModel(model)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDeleteModel(model.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Process Request Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Review Vehicle Request</DialogTitle>
            <DialogDescription>
              Process the vehicle request from {selectedRequest?.requestedByName}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Request Details:</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Type:</strong> {selectedRequest.requestType === 'brand' ? 'New Brand' : 'New Model'}</p>
                  <p><strong>Name:</strong> {selectedRequest.requestedName}</p>
                  {selectedRequest.requestType === 'model' && selectedRequest.brandName && (
                    <p><strong>Brand:</strong> {selectedRequest.brandName}</p>
                  )}
                  {selectedRequest.description && (
                    <p><strong>Description:</strong> {selectedRequest.description}</p>
                  )}
                  <p><strong>Requested by:</strong> {selectedRequest.requestedByName} ({selectedRequest.requestedByRole})</p>
                  <p><strong>Date:</strong> {new Date(selectedRequest.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminResponse">Admin Response (Required for Rejection)</Label>
                <Textarea
                  id="adminResponse"
                  placeholder="Provide a reason for rejection (optional for approval)..."
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcessDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleProcessRequest('rejected')}
              disabled={processRequestMutation.isPending}
            >
              <X className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => handleProcessRequest('approved')}
              disabled={processRequestMutation.isPending}
              className="bg-[#4db848] hover:bg-[#3da037]"
            >
              <Check className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Vehicle Brand/Model Dialog */}
      <AddVehicleBrandDialog
        open={showAddVehicleDialog}
        onOpenChange={setShowAddVehicleDialog}
      />

      {/* View Vehicle Dialog */}
      {showViewDialog && selectedVehicle && (
        <ViewVehicleDialog
          open={showViewDialog}
          onOpenChange={setShowViewDialog}
          vehicle={selectedVehicle}
        />
      )}

      {/* Edit Vehicle Dialog */}
      {showEditDialog && editingItem && (
        <EditVehicleDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          item={editingItem}
          onItemUpdated={() => {
            setShowEditDialog(false);
            setEditingItem(null);
            refetchRequests();
            refetchBrands();
            refetchModels();
          }}
        />
      )}
    </div>
  );
}