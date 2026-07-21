import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import CustomerVehicles from '@/components/vehicles/customer-vehicles';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  ClipboardList, 
  MessageSquare,
  Car,
  ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';

export default function CustomerDetails() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute<{ id: string }>('/erp/detailer/customers/:id');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    if (params?.id) {
      fetchCustomerDetails(parseInt(params.id));
    }
  }, [params?.id]);

  const fetchCustomerDetails = async (customerId: number) => {
    try {
      setLoading(true);
      
      // Fetch customer details
      const customerResponse = await apiRequest("GET", `/api/erp/customers/${customerId}`);
      const customerData = await customerResponse.json();
      setCustomer(customerData);
      
      // Fetch customer warranties
      const warrantiesResponse = await apiRequest("GET", `/api/erp/customers/${customerId}/warranties`);
      const warrantiesData = await warrantiesResponse.json();
      setWarranties(warrantiesData);
      
      // Fetch customer comments
      const commentsResponse = await apiRequest("GET", `/api/erp/customers/${customerId}/comments`);
      const commentsData = await commentsResponse.json();
      setComments(commentsData);
    } catch (error) {
      console.error('Error fetching customer details:', error);
      toast({
        title: 'Error',
        description: 'Could not load customer details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getLeadStageBadge = (stage: string) => {
    switch (stage) {
      case 'lead':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Lead</Badge>;
      case 'prospect':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Prospect</Badge>;
      case 'customer':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Customer</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{stage}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="container py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/erp/detailer/customers')}
          className="mr-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Customer Details</h1>
      </div>

      {loading ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </>
      ) : customer ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-medium mb-1">{customer.name}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      {getLeadStageBadge(customer.leadStage)}
                      <span className="ml-2">
                        Added on {formatDate(customer.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{customer.phone}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{customer.email || 'Not provided'}</span>
                    </div>
                    <div className="flex items-start text-sm">
                      <MapPin className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                      <div>
                        {customer.address ? (
                          <>
                            <div>{customer.address}</div>
                            {customer.city && <div>{customer.city}</div>}
                          </>
                        ) : (
                          <span>Address not provided</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Lead Source:</span>{' '}
                      <span className="font-medium">{customer.leadSource || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Activity Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ShieldCheck className="h-5 w-5 mr-2 text-green-500" />
                      <span>Warranties</span>
                    </div>
                    <Badge variant="outline">{warranties.length}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Car className="h-5 w-5 mr-2 text-blue-500" />
                      <span>Vehicles</span>
                    </div>
                    <Badge variant="outline">Loading...</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2 text-purple-500" />
                      <span>Comments</span>
                    </div>
                    <Badge variant="outline">{comments.length}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                      <span>Last Updated</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {customer.updatedAt ? formatDate(customer.updatedAt) : 'Never'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full" size="sm">
                    Create Warranty
                  </Button>
                  <Button className="w-full" size="sm" variant="outline">
                    Edit Customer
                  </Button>
                  <Button className="w-full" size="sm" variant="outline">
                    Add Comment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="vehicles" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="vehicles">
                <Car className="h-4 w-4 mr-2" />
                Vehicles
              </TabsTrigger>
              <TabsTrigger value="warranties">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Warranties
              </TabsTrigger>
              <TabsTrigger value="comments">
                <MessageSquare className="h-4 w-4 mr-2" />
                Comments
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="vehicles" className="mt-0">
              <CustomerVehicles 
                customerId={customer.id} 
                customerName={customer.name}
              />
            </TabsContent>
            
            <TabsContent value="warranties" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Warranties</CardTitle>
                </CardHeader>
                <CardContent>
                  {warranties.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No warranties found for this customer</p>
                      <Button variant="link" size="sm" className="mt-2">
                        Create Warranty
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      {/* Warranty table content here */}
                      <p className="p-4">Warranty data would be displayed here.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="comments" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No comments found for this customer</p>
                      <Button variant="link" size="sm" className="mt-2">
                        Add Comment
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Comments list content here */}
                      <p className="p-4">Comments would be displayed here.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Customer not found</h2>
          <p className="text-muted-foreground mb-4">
            The requested customer could not be found or you don't have permission to view it.
          </p>
          <Button onClick={() => setLocation('/erp/detailer/customers')}>
            Back to Customers
          </Button>
        </div>
      )}
    </div>
  );
}