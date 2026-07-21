import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { format } from "date-fns";
import SidebarLayout from "@/components/layouts/sidebar-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Eye } from "lucide-react";

export default function WarrantyRegistrationsPage() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Handle view details action with better logging and direct URL navigation
  const handleViewDetails = (id: number) => {
    const url = `/erp/admin/warranty-registrations/${id}`;
    console.log(`Navigating to warranty detail with ID: ${id} via URL: ${url}`);
    // Try a direct window location approach since the navigation is not working
    window.location.href = url;
  };

  // Fetch user data first to ensure authenticated
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/erp/me'],
  });

  // Fetch warranty registrations only if user is authenticated
  const { data: warrantyRegistrations = [], isLoading: isLoadingWarranties } = useQuery({
    queryKey: ['/api/warranty-registrations'],
    enabled: !!userData, // Only run this query if we have user data
  });
  
  // Combined loading state
  const isLoading = isLoadingUser || isLoadingWarranties;

  // Filter registrations based on search term and status
  const filteredRegistrations = warrantyRegistrations.filter((registration: any) => {
    const matchesSearch = searchTerm === "" || 
      registration.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.phone?.includes(searchTerm) ||
      registration.warrantyCode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || registration.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "on-hold":
        return <Badge className="bg-yellow-100 text-yellow-800">On Hold</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
    }
  };

  return (
    <SidebarLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Warranty Registrations</h1>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by name, email, phone or warranty code..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="w-full md:w-64">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs defaultValue="all">
          <TabsList className="grid w-full md:w-auto grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <WarrantyTable
              registrations={filteredRegistrations}
              isLoading={isLoading}
              onViewDetails={handleViewDetails}
              formatDate={formatDate}
              getStatusBadge={getStatusBadge}
            />
          </TabsContent>
          
          <TabsContent value="pending" className="mt-6">
            <WarrantyTable
              registrations={filteredRegistrations.filter((r: any) => !r.status || r.status === "pending")}
              isLoading={isLoading}
              onViewDetails={handleViewDetails}
              formatDate={formatDate}
              getStatusBadge={getStatusBadge}
            />
          </TabsContent>
          
          <TabsContent value="approved" className="mt-6">
            <WarrantyTable
              registrations={filteredRegistrations.filter((r: any) => r.status === "approved")}
              isLoading={isLoading}
              onViewDetails={handleViewDetails}
              formatDate={formatDate}
              getStatusBadge={getStatusBadge}
            />
          </TabsContent>
          
          <TabsContent value="rejected" className="mt-6">
            <WarrantyTable
              registrations={filteredRegistrations.filter((r: any) => r.status === "rejected")}
              isLoading={isLoading}
              onViewDetails={handleViewDetails}
              formatDate={formatDate}
              getStatusBadge={getStatusBadge}
            />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}

interface WarrantyTableProps {
  registrations: any[];
  isLoading: boolean;
  onViewDetails: (id: number) => void;
  formatDate: (date: string) => string;
  getStatusBadge: (status: string) => JSX.Element;
}

function WarrantyTable({ registrations, isLoading, onViewDetails, formatDate, getStatusBadge }: WarrantyTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center">
          <p className="text-gray-500">Loading warranty registrations...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (registrations.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center">
          <p className="text-gray-500">No warranty registrations found.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Warranty Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.map((registration: any) => (
              <TableRow key={registration.id}>
                <TableCell className="font-medium">
                  {formatDate(registration.createdAt)}
                </TableCell>
                <TableCell>{registration.name || `${registration.customerFirstName || ''} ${registration.customerLastName || ''}`}</TableCell>
                <TableCell>
                  <div>{registration.email || registration.customerEmail}</div>
                  <div className="text-xs text-gray-500">{registration.phone || registration.customerMobile}</div>
                </TableCell>
                <TableCell>{registration.productType || registration.productInstalled}</TableCell>
                <TableCell>
                  <Badge variant="outline">{registration.warrantyCode}</Badge>
                </TableCell>
                <TableCell>
                  {getStatusBadge(registration.status || "pending")}
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      console.log(`Viewing warranty detail for ID: ${registration.id}`);
                      onViewDetails(registration.id);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}