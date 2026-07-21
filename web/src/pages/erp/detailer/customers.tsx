import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { InfoDot } from '@/components/dev/InfoDot';
import {
  Search,
  MoreHorizontal,
  Plus, 
  Phone, 
  Mail, 
  Car, 
  MapPin,
  Filter,
  ArrowUpDown,
  Tag
} from 'lucide-react';

// Mock data for customers 
const MOCK_CUSTOMERS = [
  {
    id: 1,
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    phone: '+91 98765 43210',
    address: 'Koramangala, Bangalore',
    status: 'active',
    leadStage: 'customer',
    vehicles: 2,
    createdAt: '2023-01-15'
  },
  {
    id: 2,
    name: 'Priya Singh',
    email: 'priya.singh@example.com',
    phone: '+91 87654 32109',
    address: 'HSR Layout, Bangalore',
    status: 'active',
    leadStage: 'customer',
    vehicles: 1,
    createdAt: '2023-02-20'
  },
  {
    id: 3,
    name: 'Amit Patel',
    email: 'amit.patel@example.com',
    phone: '+91 76543 21098',
    address: 'Indiranagar, Bangalore',
    status: 'inactive',
    leadStage: 'customer',
    vehicles: 3,
    createdAt: '2023-03-10'
  },
  {
    id: 4,
    name: 'Neha Gupta',
    email: 'neha.gupta@example.com',
    phone: '+91 65432 10987',
    address: 'Whitefield, Bangalore',
    status: 'active',
    leadStage: 'customer',
    vehicles: 1,
    createdAt: '2023-04-05'
  },
  {
    id: 5,
    name: 'Vikram Reddy',
    email: 'vikram.reddy@example.com',
    phone: '+91 54321 09876',
    address: 'Jayanagar, Bangalore',
    status: 'active',
    leadStage: 'prospect',
    vehicles: 0,
    createdAt: '2023-05-18'
  },
  {
    id: 6,
    name: 'Anjali Menon',
    email: 'anjali.m@example.com',
    phone: '+91 43210 98765',
    address: 'JP Nagar, Bangalore',
    status: 'active',
    leadStage: 'lead',
    vehicles: 0,
    createdAt: '2023-06-22'
  },
  {
    id: 7,
    name: 'Suresh Kumar',
    email: 'suresh.k@example.com',
    phone: '+91 32109 87654',
    address: 'MG Road, Bangalore',
    status: 'active',
    leadStage: 'prospect',
    vehicles: 0,
    createdAt: '2023-07-14'
  },
  {
    id: 8,
    name: 'Divya Jain',
    email: 'divya.j@example.com',
    phone: '+91 21098 76543',
    address: 'Malleshwaram, Bangalore',
    status: 'inactive',
    leadStage: 'lead',
    vehicles: 0,
    createdAt: '2023-08-30'
  }
];

export default function CustomersPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('GET', '/api/erp/customers');
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customers. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Filter to show ONLY customers (not leads or prospects)
  // Database field is 'status' with capital 'C' for Customer
  const actualCustomers = customers.filter(customer => 
    customer.status === 'Customer' || customer.leadStage === 'customer'
  );
  
  // Filter customers based on search
  const filteredCustomers = actualCustomers.filter(customer => {
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        customer.name.toLowerCase().includes(search) ||
        (customer.email && customer.email.toLowerCase().includes(search)) ||
        (customer.phone && customer.phone.includes(search)) ||
        (customer.address && customer.address.toLowerCase().includes(search))
      );
    }
    
    return true;
  });

  const handleAddCustomer = async (formData: any) => {
    try {
      const response = await apiRequest('POST', '/api/erp/customers', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address || '',
        status: 'Customer',
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Customer added successfully',
        });
        setIsCreateDialogOpen(false);
        fetchCustomers(); // Refresh the list
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add customer',
        variant: 'destructive',
      });
    }
  };

  const handleCustomerDetails = (customerId: number) => {
    // Navigate to customer details page
    setLocation(`/erp/detailer/customers/${customerId}`);
  };

  const getBadgeColor = (stage: string) => {
    switch (stage) {
      case 'lead':
        return 'bg-blue-100 text-blue-800';
      case 'prospect':
        return 'bg-yellow-100 text-yellow-800';
      case 'customer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-500 mt-1">Manage your customers with active warranties</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="ml-0 md:ml-4">
                <Plus className="mr-2 h-4 w-4" /> Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>
                  Enter the customer's details. You can add vehicle information later.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAddCustomer({
                  name: formData.get('name'),
                  email: formData.get('email'),
                  phone: formData.get('phone'),
                  address: formData.get('address'),
                  status: 'Customer',
                });
              }}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Full name"
                      className="col-span-3"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Email address"
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="Phone number"
                      className="col-span-3"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="address" className="text-right">
                      Address
                    </Label>
                    <Textarea
                      id="address"
                      name="address"
                      placeholder="Customer address"
                      className="col-span-3"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit">Add Customer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between md:items-center space-y-2 md:space-y-0">
            <div>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center">Customers</span>
                <InfoDot widgetId="detailer.customers.table" fallbackLabel="Customers" />
              </CardTitle>
              <CardDescription>
                You have {actualCustomers.length} customers ({filteredCustomers.length} shown)
              </CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search customers..."
                  className="pl-8 w-full sm:w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Name</TableHead>
                    <TableHead className="hidden md:table-cell">Contact Info</TableHead>
                    <TableHead className="hidden lg:table-cell">Location</TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        Stage
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Vehicles</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No customers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">
                          <div>{customer.name}</div>
                          <div className="text-muted-foreground text-sm md:hidden">
                            {customer.email}<br />
                            {customer.phone}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{customer.email}</span>
                          </div>
                          <div className="flex items-center mt-1">
                            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{customer.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{customer.address}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            Customer
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center">
                            <Car className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{customer.vehicles}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleCustomerDetails(customer.id)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>Edit Customer</DropdownMenuItem>
                              {customer.vehicles === 0 && (
                                <DropdownMenuItem>Add Vehicle</DropdownMenuItem>
                              )}
                              <DropdownMenuItem>Send Message</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}