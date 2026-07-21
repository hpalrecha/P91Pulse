import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { InfoDot } from "@/components/dev/InfoDot";
import { Upload, FileSpreadsheet, Plus, Trash2, Download, Undo2 } from "lucide-react";
import { format } from "date-fns";

interface SoldUnit {
  id: number;
  batchNumber: string;
  dateOfSales: string;
  itemName: string;
  qtySold: number;
  referenceNumber?: string | null;
  uploadedBy: number;
  uploadedAt: string;
  createdAt: string;
  warrantyIssued?: number;
  warrantyRemaining?: number;
  hasWarrantyTag?: boolean;
  warrantyClaimRaised?: boolean;
  warrantyClaimApproved?: boolean;
  claimedQuantity?: number;
  raisedClaimQuantity?: number;
}

export default function SoldUnitsPage() {
  const [, navigate] = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [returnDialogUnit, setReturnDialogUnit] = useState<SoldUnit | null>(null);
  const [qtyReturned, setQtyReturned] = useState(1);
  const [newSoldUnit, setNewSoldUnit] = useState({
    batchNumber: "",
    dateOfSales: "",
    itemName: "",
    qtySold: 1,
    referenceNumber: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sold units data
  const { data: soldUnits = [], isLoading } = useQuery<SoldUnit[]>({
    queryKey: ["/api/erp/sold-units"],
    queryFn: async () => {
      const response = await fetch("/api/erp/sold-units", {
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch sold units");
      }
      const data = await response.json();
      console.log("Received sold units data:", data);
      if (data && data.length > 0) {
        console.log("First unit full object:", data[0]);
        console.log("First unit dateOfSales:", data[0].dateOfSales, "Type:", typeof data[0].dateOfSales);
      }
      return data;
    },
    staleTime: 0,
    cacheTime: 0
  });

  // Upload Excel file mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/erp/sold-units/upload", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/erp/sold-units"] });
      setSelectedFile(null);
      setIsUploadDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Add single sold unit mutation
  const addMutation = useMutation({
    mutationFn: async (soldUnit: any) => {
      const response = await fetch("/api/erp/sold-units", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(soldUnit),
        credentials: "include"
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add sold unit");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Sold unit added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/erp/sold-units"] });
      setNewSoldUnit({
        batchNumber: "",
        dateOfSales: "",
        itemName: "",
        qtySold: 1,
        referenceNumber: ""
      });
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete sold unit mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/erp/sold-units/${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete sold unit");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Sold unit deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/erp/sold-units"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Return mutation
  const returnMutation = useMutation({
    mutationFn: async ({ id, qtyReturned }: { id: number; qtyReturned: number }) => {
      const response = await fetch(`/api/erp/sold-units/${id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qtyReturned }),
        credentials: "include"
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process return");
      }
      return response.json();
    },
    onSuccess: (data) => {
      const msg = data.action === 'deleted'
        ? `Batch fully returned and removed from the list.`
        : `Returned ${data.qtyReturned} units. Remaining: ${data.remainingQty}.`;
      toast({ title: "Return Processed", description: msg });
      queryClient.invalidateQueries({ queryKey: ["/api/erp/sold-units"] });
      setReturnDialogUnit(null);
      setQtyReturned(1);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleFileUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleAddSoldUnit = () => {
    addMutation.mutate(newSoldUnit);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this sold unit record?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleReturn = () => {
    if (returnDialogUnit) {
      returnMutation.mutate({ id: returnDialogUnit.id, qtyReturned });
    }
  };

  const downloadTemplate = () => {
    // Use the server-generated Excel template
    const link = document.createElement("a");
    link.href = "/api/erp/sold-units/template";
    link.download = "sold-units-template.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sold Units Database</h1>
          <p className="text-muted-foreground">
            Manage sales data with Excel uploads and manual entry
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={downloadTemplate} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Manually
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Sold Unit</DialogTitle>
                <DialogDescription>
                  Add a single sold unit record manually
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="batchNumber">Batch Number</Label>
                  <Input
                    id="batchNumber"
                    value={newSoldUnit.batchNumber}
                    onChange={(e) => setNewSoldUnit({...newSoldUnit, batchNumber: e.target.value})}
                    placeholder="PPF-2024-001"
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfSales">Date of Sales</Label>
                  <Input
                    id="dateOfSales"
                    type="date"
                    value={newSoldUnit.dateOfSales}
                    onChange={(e) => setNewSoldUnit({...newSoldUnit, dateOfSales: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="itemName">Item Name</Label>
                  <Input
                    id="itemName"
                    value={newSoldUnit.itemName}
                    onChange={(e) => setNewSoldUnit({...newSoldUnit, itemName: e.target.value})}
                    placeholder="P91 Spectrum PPF"
                  />
                </div>
                <div>
                  <Label htmlFor="qtySold">Quantity Sold</Label>
                  <Input
                    id="qtySold"
                    type="number"
                    min="1"
                    value={newSoldUnit.qtySold}
                    onChange={(e) => setNewSoldUnit({...newSoldUnit, qtySold: parseInt(e.target.value) || 1})}
                  />
                </div>
                <div>
                  <Label htmlFor="referenceNumber">Reference Number <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input
                    id="referenceNumber"
                    value={newSoldUnit.referenceNumber}
                    onChange={(e) => setNewSoldUnit({...newSoldUnit, referenceNumber: e.target.value})}
                    placeholder="e.g. DN-2026-001"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddSoldUnit}
                    disabled={addMutation.isPending}
                  >
                    {addMutation.isPending ? "Adding..." : "Add Record"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Excel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Sold Units Excel File</DialogTitle>
                <DialogDescription>
                  Upload an Excel file with sold units data. Required headers: <strong>Batch Number</strong>, <strong>Date of Sales</strong>, <strong>Item Name</strong>, <strong>Qty Sold</strong>.
                  <br />Download the template below to ensure proper formatting.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label htmlFor="file">Excel File (.xlsx or .xls)</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={downloadTemplate}
                    type="button"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>
                <Input
                  id="file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                {selectedFile && (
                  <div className="bg-muted p-3 rounded">
                    <p className="text-sm">
                      <FileSpreadsheet className="h-4 w-4 inline mr-2" />
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleFileUpload}
                    disabled={!selectedFile || uploadMutation.isPending}
                  >
                    {uploadMutation.isPending ? "Uploading..." : "Upload File"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center">Sold Units Records</span>
            <InfoDot widgetId="admin.soldUnits.table" fallbackLabel="Sold Units Records" />
          </CardTitle>
          <CardDescription>
            Total records: {soldUnits.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading sold units...</div>
          ) : soldUnits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sold units records found. Upload an Excel file or add records manually.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Number</TableHead>
                    <TableHead>Reference No.</TableHead>
                    <TableHead>Date of Sales</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Qty Sold</TableHead>
                    <TableHead>Warranty Issued</TableHead>
                    <TableHead>Warranty Remaining</TableHead>
                    <TableHead>Claimed (sq ft)</TableHead>
                    <TableHead>Warranty Status</TableHead>
                    <TableHead>Claim Raised (Pending)</TableHead>
                    <TableHead>Claim Available</TableHead>
                    <TableHead>Uploaded At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {soldUnits.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-mono">{unit.batchNumber}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {unit.referenceNumber || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          try {
                            if (!unit.dateOfSales) return "No Date";
                            const date = new Date(unit.dateOfSales);
                            if (isNaN(date.getTime())) return "Invalid Date";
                            return format(date, "MMM dd, yyyy");
                          } catch (error) {
                            console.error("Date parsing error:", error, "Raw date:", unit.dateOfSales);
                            return "Date Error";
                          }
                        })()}
                      </TableCell>
                      <TableCell>{unit.itemName}</TableCell>
                      <TableCell className="text-center">{unit.qtySold}</TableCell>
                      <TableCell className="text-center">
                        {(unit.warrantyIssued || 0) > 0 ? (
                          <button
                            className="text-orange-600 font-medium underline underline-offset-2 hover:text-orange-800 cursor-pointer"
                            title="View warranty cards for this batch"
                            onClick={() => navigate(`/erp/admin/warranty-registrations?batch=${encodeURIComponent(unit.batchNumber)}`)}
                          >
                            {unit.warrantyIssued}
                          </button>
                        ) : (
                          <span className="text-orange-600 font-medium">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-green-600 font-medium">
                        {unit.warrantyRemaining ?? 0}
                      </TableCell>
                      <TableCell className="text-center">
                        {(unit.claimedQuantity ?? 0) > 0 ? (
                          <button
                            className="text-blue-600 font-medium underline underline-offset-2 hover:text-blue-800 cursor-pointer"
                            title="View approved claims for this batch"
                            onClick={() => navigate(`/erp/admin/claim-management?batch=${encodeURIComponent(unit.batchNumber)}`)}
                          >
                            {unit.claimedQuantity}
                          </button>
                        ) : (
                          <span className="text-blue-600 font-medium">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {unit.hasWarrantyTag ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Warranty Issued
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Available
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {(unit.raisedClaimQuantity ?? 0) > 0 ? (
                          <button
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 cursor-pointer underline underline-offset-2"
                            title="View pending claims for this batch"
                            onClick={() => navigate(`/erp/admin/claim-management?batch=${encodeURIComponent(unit.batchNumber)}`)}
                          >
                            {unit.raisedClaimQuantity} sq ft
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {(() => {
                          const available = Math.max(0, (unit.qtySold ?? 0) - (unit.claimedQuantity ?? 0) - (unit.raisedClaimQuantity ?? 0));
                          return available > 0 ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {available} sq ft
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                              Fully Claimed
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {format(new Date(unit.uploadedAt), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Process sales return"
                            onClick={() => { setReturnDialogUnit(unit); setQtyReturned(1); }}
                          >
                            <Undo2 className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(unit.id)}
                            disabled={deleteMutation.isPending}
                            title="Delete record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales Return Dialog */}
      <Dialog open={!!returnDialogUnit} onOpenChange={(open) => { if (!open) setReturnDialogUnit(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Sales Return</DialogTitle>
            <DialogDescription>
              Enter the quantity being returned for batch <strong>{returnDialogUnit?.batchNumber}</strong>.
              Current qty sold: <strong>{returnDialogUnit?.qtySold}</strong>.
              {returnDialogUnit && qtyReturned >= returnDialogUnit.qtySold
                ? " This will remove the batch entirely."
                : " This will reduce the qty sold."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="qtyReturned">Quantity Returned</Label>
              <Input
                id="qtyReturned"
                type="number"
                min="1"
                max={returnDialogUnit?.qtySold ?? 1}
                value={qtyReturned}
                onChange={(e) => setQtyReturned(parseInt(e.target.value) || 1)}
              />
              {returnDialogUnit && qtyReturned > returnDialogUnit.qtySold && (
                <p className="text-sm text-destructive mt-1">
                  Cannot exceed qty sold ({returnDialogUnit.qtySold})
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReturnDialogUnit(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReturn}
                disabled={
                  returnMutation.isPending ||
                  !returnDialogUnit ||
                  qtyReturned <= 0 ||
                  qtyReturned > returnDialogUnit.qtySold
                }
              >
                {returnMutation.isPending ? "Processing..." : "Confirm Return"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}