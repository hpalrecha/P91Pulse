import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
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
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Car, 
  Mail, 
  MapPin, 
  Phone, 
  Plus, 
  Shield, 
  Users, 
  ArrowLeft, 
  Edit,
  Clock,
  Calendar as CalendarIcon,
  ShieldCheck
} from 'lucide-react';

// Mock vehicle data
const MOCK_VEHICLES = [
  {
    id: 1,
    make: 'BMW',
    model: 'X5',
    year: 2022,
    color: 'Black',
    vin: 'WBACG8324KFP52344',
    registrationNo: 'KA01MX1234',
    hasWarranty: true,
    warrantyDetails: {
      warrantyCode: 'WR-2023-001',
      productType: 'P91 PPF Spectrum',
      issueDate: '2023-01-20',
      expiryDate: '2028-01-20',
      status: 'active'
    }
  },
  {
    id: 2,
    make: 'Audi',
    model: 'Q7',
    year: 2021,
    color: 'White',
    vin: 'WAUZZZ4M0HD047329',
    registrationNo: 'KA01MX5678',
    hasWarranty: true,
    warrantyDetails: {
      warrantyCode: 'WR-2023-002',
      productType: 'P91 PPF Spectrum + Ceramic 7',
      issueDate: '2023-02-15',
      expiryDate: '2028-02-15',
      status: 'active'
    }
  }
];

// Mock customer data
const MOCK_CUSTOMERS = [
  {
    id: 1,
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    phone: '+91 98765 43210',
    address: 'Koramangala, Bangalore',
    status: 'active',
    leadStage: 'customer',
    vehicles: MOCK_VEHICLES,
    notes: 'Premium customer. Prefers weekend appointments.',
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
    vehicles: [MOCK_VEHICLES[0]],
    notes: 'Referred by Rahul Sharma.',
    createdAt: '2023-02-20'
  }
];

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddVehicleDialogOpen, setIsAddVehicleDialogOpen] = useState(false);
  const [isAddWarrantyDialogOpen, setIsAddWarrantyDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  
  useEffect(() => {
    const customerId = parseInt(id as string);
    // In a real app, fetch from API
    const foundCustomer = MOCK_CUSTOMERS.find(c => c.id === customerId);
    
    if (foundCustomer) {
      setCustomer(foundCustomer);
    } else {
      toast({
        variant: 'destructive',
        title: 'Customer not found',
        description: 'The requested customer could not be found.',
      });
      setLocation('/erp/detailer/customers');
    }
    
    setLoading(false);
  }, [id, setLocation, toast]);

  const handleAddVehicle = (formData: any) => {
    // In a real app, you would make an API call here
    const newVehicle = {
      id: (customer.vehicles?.length || 0) + 1,
      make: formData.make,
      model: formData.model,
      year: parseInt(formData.year),
      color: formData.color,
      vin: formData.vin,
      registrationNo: formData.registrationNo,
      hasWarranty: false,
    };
    
    const updatedCustomer = {
      ...customer,
      vehicles: [...(customer.vehicles || []), newVehicle]
    };
    
    setCustomer(updatedCustomer);
    setIsAddVehicleDialogOpen(false);
    
    toast({
      title: 'Vehicle added',
      description: 'Vehicle has been added successfully.',
    });
  };

  const handleAddWarranty = (formData: any) => {
    // In a real app, you would make an API call here
    const updatedVehicles = customer.vehicles.map((vehicle: any) => {
      if (vehicle.id === selectedVehicle.id) {
        return {
          ...vehicle,
          hasWarranty: true,
          warrantyDetails: {
            warrantyCode: `WR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
            productType: formData.productType,
            issueDate: formData.issueDate,
            expiryDate: formData.expiryDate,
            status: 'active'
          }
        };
      }
      return vehicle;
    });
    
    const updatedCustomer = {
      ...customer,
      vehicles: updatedVehicles
    };
    
    setCustomer(updatedCustomer);
    setIsAddWarrantyDialogOpen(false);
    
    toast({
      title: 'Warranty registered',
      description: 'Warranty has been registered successfully.',
    });
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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <Button variant="outline" onClick={() => setLocation('/erp/detailer/customers')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customers
        </Button>
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold">Customer not found</h2>
            <p className="text-muted-foreground mt-2">The requested customer could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" onClick={() => setLocation('/erp/detailer/customers')} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
        <Badge className={`ml-4 ${getBadgeColor(customer.leadStage)}`}>
          {customer.leadStage === 'lead' 
            ? 'Lead' 
            : customer.leadStage === 'prospect' 
              ? 'Prospect' 
              : 'Customer'}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Customer Information Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center text-sm text-muted-foreground mb-1">
                  <Users className="mr-2 h-4 w-4" /> Contact Details
                </div>
                <Separator className="my-2" />
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{customer.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{customer.email}</span>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                    <span>{customer.address}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center text-sm text-muted-foreground mb-1">
                  <Calendar className="mr-2 h-4 w-4" /> Relationship
                </div>
                <Separator className="my-2" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer since:</span>
                    <span>{customer.createdAt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehicles:</span>
                    <span>{customer.vehicles?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Warranties:</span>
                    <span>{customer.vehicles?.filter((v: any) => v.hasWarranty).length || 0}</span>
                  </div>
                </div>
              </div>
              
              {customer.notes && (
                <div>
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <span>Notes</span>
                  </div>
                  <Separator className="my-2" />
                  <p className="text-sm">{customer.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              <Edit className="h-4 w-4 mr-2" /> Edit Details
            </Button>
          </CardFooter>
        </Card>
        
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
              <TabsTrigger value="warranties">Warranties</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Vehicles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{customer.vehicles?.length || 0}</div>
                    <div className="flex">
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-sm"
                        onClick={() => setActiveTab('vehicles')}
                      >
                        View all vehicles
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Warranties</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {customer.vehicles?.filter((v: any) => v.hasWarranty).length || 0}
                    </div>
                    <div className="flex">
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-sm"
                        onClick={() => setActiveTab('warranties')}
                      >
                        View all warranties
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Recent Vehicles</CardTitle>
                    {(customer.vehicles?.length || 0) > 0 && (
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('vehicles')}>
                        View All
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {(customer.vehicles?.length || 0) === 0 ? (
                    <div className="text-center py-4">
                      <Car className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No vehicles found</p>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsAddVehicleDialogOpen(true)}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Vehicle
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(customer.vehicles || []).slice(0, 2).map((vehicle: any) => (
                        <div key={vehicle.id} className="flex items-start space-x-4">
                          <div className="bg-muted p-2 rounded-md">
                            <Car className="h-8 w-8 text-primary" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                            <p className="text-sm text-muted-foreground">
                              {vehicle.year} • {vehicle.color} • {vehicle.registrationNo}
                            </p>
                            {vehicle.hasWarranty && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <ShieldCheck className="h-3 w-3 mr-1" /> Warranty Active
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      <Button 
                        variant="outline" 
                        className="w-full mt-4"
                        onClick={() => setIsAddVehicleDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Vehicle
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Recent Warranties</CardTitle>
                    {customer.vehicles?.some((v: any) => v.hasWarranty) && (
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('warranties')}>
                        View All
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!customer.vehicles?.some((v: any) => v.hasWarranty) ? (
                    <div className="text-center py-4">
                      <Shield className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No warranties found</p>
                      {customer.vehicles?.length > 0 && (
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSelectedVehicle(customer.vehicles[0]);
                            setIsAddWarrantyDialogOpen(true);
                          }}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" /> Register Warranty
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {customer.vehicles
                        .filter((v: any) => v.hasWarranty)
                        .slice(0, 2)
                        .map((vehicle: any) => (
                          <div key={vehicle.id} className="flex items-start space-x-4">
                            <div className="bg-muted p-2 rounded-md">
                              <Shield className="h-8 w-8 text-primary" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                              <p className="text-sm">
                                <span className="text-muted-foreground">
                                  {vehicle.warrantyDetails.productType}
                                </span>
                              </p>
                              <div className="flex items-center text-sm">
                                <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                                <span className="text-muted-foreground mr-2">Valid until:</span>
                                <span>{vehicle.warrantyDetails.expiryDate}</span>
                              </div>
                              <Badge className="bg-green-50 text-green-700 border-green-200">
                                {vehicle.warrantyDetails.warrantyCode}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Vehicles Tab */}
            <TabsContent value="vehicles">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Vehicles</CardTitle>
                    <Button onClick={() => setIsAddVehicleDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Add Vehicle
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {(customer.vehicles?.length || 0) === 0 ? (
                    <div className="text-center py-8">
                      <Car className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No vehicles found</p>
                      <Button 
                        onClick={() => setIsAddVehicleDialogOpen(true)}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Vehicle
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px]">Make & Model</TableHead>
                            <TableHead>Year & Color</TableHead>
                            <TableHead>Registration</TableHead>
                            <TableHead>VIN</TableHead>
                            <TableHead>Warranty</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(customer.vehicles || []).map((vehicle: any) => (
                            <TableRow key={vehicle.id}>
                              <TableCell className="font-medium">
                                {vehicle.make} {vehicle.model}
                              </TableCell>
                              <TableCell>{vehicle.year} • {vehicle.color}</TableCell>
                              <TableCell>{vehicle.registrationNo}</TableCell>
                              <TableCell className="font-mono text-xs">
                                {vehicle.vin}
                              </TableCell>
                              <TableCell>
                                {vehicle.hasWarranty ? (
                                  <Badge className="bg-green-50 text-green-700 border-green-200">
                                    <ShieldCheck className="h-3 w-3 mr-1" /> Active
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-gray-50 text-gray-600">
                                    None
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {!vehicle.hasWarranty && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedVehicle(vehicle);
                                      setIsAddWarrantyDialogOpen(true);
                                    }}
                                  >
                                    <Shield className="h-4 w-4 mr-2" /> Add Warranty
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Warranties Tab */}
            <TabsContent value="warranties">
              <Card>
                <CardHeader>
                  <CardTitle>Warranty Registrations</CardTitle>
                </CardHeader>
                <CardContent>
                  {!customer.vehicles?.some((v: any) => v.hasWarranty) ? (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No warranties found</p>
                      {customer.vehicles?.length > 0 ? (
                        <Button 
                          onClick={() => {
                            setSelectedVehicle(customer.vehicles[0]);
                            setIsAddWarrantyDialogOpen(true);
                          }}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" /> Register Warranty
                        </Button>
                      ) : (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Add a vehicle first to register a warranty
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px]">Warranty Code</TableHead>
                            <TableHead>Vehicle</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Issue Date</TableHead>
                            <TableHead>Expiry Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customer.vehicles
                            .filter((v: any) => v.hasWarranty)
                            .map((vehicle: any) => (
                              <TableRow key={vehicle.id}>
                                <TableCell className="font-medium">
                                  {vehicle.warrantyDetails.warrantyCode}
                                </TableCell>
                                <TableCell>
                                  {vehicle.make} {vehicle.model} ({vehicle.year})
                                </TableCell>
                                <TableCell>{vehicle.warrantyDetails.productType}</TableCell>
                                <TableCell>{vehicle.warrantyDetails.issueDate}</TableCell>
                                <TableCell>{vehicle.warrantyDetails.expiryDate}</TableCell>
                                <TableCell>
                                  <Badge className="bg-green-50 text-green-700 border-green-200">
                                    <ShieldCheck className="h-3 w-3 mr-1" /> {vehicle.warrantyDetails.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Activity History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative pl-6 border-l">
                    <div className="space-y-6">
                      <div className="relative">
                        <div className="absolute -left-10 mt-1.5 h-4 w-4 rounded-full border border-white bg-primary"></div>
                        <div>
                          <h3 className="font-semibold">Customer created</h3>
                          <p className="text-sm text-muted-foreground flex items-center mt-1">
                            <Clock className="h-3 w-3 mr-1" /> {customer.createdAt}
                          </p>
                          <p className="text-sm mt-1">New customer record created</p>
                        </div>
                      </div>
                      
                      {customer.vehicles?.map((vehicle: any, index: number) => (
                        <div className="relative" key={vehicle.id}>
                          <div className="absolute -left-10 mt-1.5 h-4 w-4 rounded-full border border-white bg-primary"></div>
                          <div>
                            <h3 className="font-semibold">Vehicle added</h3>
                            <p className="text-sm text-muted-foreground flex items-center mt-1">
                              <Clock className="h-3 w-3 mr-1" /> {new Date(new Date(customer.createdAt).getTime() + (index + 1) * 86400000).toISOString().split('T')[0]}
                            </p>
                            <p className="text-sm mt-1">
                              Added {vehicle.make} {vehicle.model} ({vehicle.year})
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {customer.vehicles?.filter((v: any) => v.hasWarranty).map((vehicle: any, index: number) => (
                        <div className="relative" key={`warranty-${vehicle.id}`}>
                          <div className="absolute -left-10 mt-1.5 h-4 w-4 rounded-full border border-white bg-primary"></div>
                          <div>
                            <h3 className="font-semibold">Warranty registered</h3>
                            <p className="text-sm text-muted-foreground flex items-center mt-1">
                              <Clock className="h-3 w-3 mr-1" /> {vehicle.warrantyDetails.issueDate}
                            </p>
                            <p className="text-sm mt-1">
                              Registered warranty for {vehicle.make} {vehicle.model}
                            </p>
                            <Badge className="mt-2 bg-green-50 text-green-700 border-green-200">
                              {vehicle.warrantyDetails.warrantyCode}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Add Vehicle Dialog */}
      <Dialog open={isAddVehicleDialogOpen} onOpenChange={setIsAddVehicleDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription>
              Enter the vehicle's details for {customer.name}.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleAddVehicle({
              make: formData.get('make'),
              model: formData.get('model'),
              year: formData.get('year'),
              color: formData.get('color'),
              vin: formData.get('vin'),
              registrationNo: formData.get('registrationNo'),
            });
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    name="make"
                    placeholder="e.g. BMW"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    name="model"
                    placeholder="e.g. X5"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    name="year"
                    type="number"
                    placeholder="e.g. 2023"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    name="color"
                    placeholder="e.g. Black"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vin">VIN</Label>
                <Input
                  id="vin"
                  name="vin"
                  placeholder="Vehicle Identification Number"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="registrationNo">Registration Number</Label>
                <Input
                  id="registrationNo"
                  name="registrationNo"
                  placeholder="e.g. KA01MX1234"
                  required
                />
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Add Vehicle</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Add Warranty Dialog */}
      <Dialog open={isAddWarrantyDialogOpen} onOpenChange={setIsAddWarrantyDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Register New Warranty</DialogTitle>
            <DialogDescription>
              {selectedVehicle && (
                <span>
                  Register warranty for {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleAddWarranty({
              productType: formData.get('productType'),
              issueDate: formData.get('issueDate'),
              expiryDate: formData.get('expiryDate'),
            });
          }}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="productType">Product Type</Label>
                <Select name="productType" defaultValue="P91 PPF Spectrum" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P91 PPF Spectrum">P91 PPF Spectrum</SelectItem>
                    <SelectItem value="P91 PPF Prime">P91 PPF Prime</SelectItem>
                    <SelectItem value="P91 PPF Basic">P91 PPF Basic</SelectItem>
                    <SelectItem value="P91 Ceramic 7">P91 Ceramic 7</SelectItem>
                    <SelectItem value="P91 Ceramic 5">P91 Ceramic 5</SelectItem>
                    <SelectItem value="P91 Ceramic 3">P91 Ceramic 3</SelectItem>
                    <SelectItem value="P91 PPF Spectrum + Ceramic 7">P91 PPF Spectrum + Ceramic 7</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input
                    id="issueDate"
                    name="issueDate"
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    name="expiryDate"
                    type="date"
                    defaultValue={new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Register Warranty</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}