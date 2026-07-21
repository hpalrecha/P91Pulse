import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  Loader2,
  Search
} from 'lucide-react';

interface WarrantyTableProps {
  userRole: 'admin' | 'distributor' | 'detailer';
  onViewDetails?: (id: number) => void;
}

export default function WarrantyTable({ userRole, onViewDetails }: WarrantyTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Define the API endpoint based on user role
  const endpoint = userRole === 'admin' 
    ? '/api/warranty-registrations'
    : userRole === 'distributor'
      ? '/api/erp/distributor/warranties'
      : '/api/erp/detailer/warranties';

  // Fetch warranty registrations
  const { data: warrantyRegistrations = [], isLoading } = useQuery({
    queryKey: [endpoint],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', endpoint);
        return await response.json();
      } catch (err) {
        console.error("Error fetching warranty registrations:", err);
        throw err;
      }
    }
  });

  // Filter registrations based on search term and status
  const filteredRegistrations = Array.isArray(warrantyRegistrations) ? 
    warrantyRegistrations.filter((registration: any) => {
      const matchesSearch = searchTerm === "" || 
        registration.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.phone?.includes(searchTerm) ||
        registration.warrantyCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (registration.vehicleMake && registration.vehicleMake.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (registration.vehicleModel && registration.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" || registration.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    }) : [];

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return dateString || 'N/A';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      case 'escalated':
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Escalated
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search warranties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        {/* Status Filter */}
        <div className="w-full md:w-48">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="escalated">Escalated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Warranty Code</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRegistrations.length > 0 ? (
              filteredRegistrations.map((registration: any) => (
                <TableRow key={registration.id}>
                  <TableCell className="font-medium">
                    {formatDate(registration.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{registration.name}</div>
                    <div className="text-xs text-muted-foreground">{registration.email || registration.phone}</div>
                  </TableCell>
                  <TableCell>
                    {registration.vehicleMake && registration.vehicleModel ? (
                      <div>
                        {registration.vehicleMake} {registration.vehicleModel}
                        <div className="text-xs text-muted-foreground">{registration.vehicleYear}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>{registration.productType || registration.productInstalled}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{registration.warrantyCode}</Badge>
                  </TableCell>
                  <TableCell>
                    {registration.submittedByRole ? (
                      <>
                        <div className="capitalize">{registration.submittedByRole}</div>
                        <div className="text-xs text-muted-foreground">{registration.submittedByName}</div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Direct</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(registration.status || "pending")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        if (onViewDetails) {
                          onViewDetails(registration.id);
                        }
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No warranty registrations found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}