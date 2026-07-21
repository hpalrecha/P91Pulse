import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Eye,
  Plus,
  Filter,
  Search,
  MessageSquare,
  Send,
  User as UserIcon,
  ListFilter,
  Car,
  LayoutGrid,
  List,
  Clock,
} from 'lucide-react';
import AddVehicleDialog from '@/components/vehicles/add-vehicle-dialog';
import CustomerVehicles from '@/components/vehicles/customer-vehicles';
import { InfoDot } from '@/components/dev/InfoDot';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { LEAD_LOSS_REASONS } from '@shared/erp-schema';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import LeadTimeline from '@/components/leads/LeadTimeline';

export default function DistributorLeadsPage() {
  return <DistributorLeadsContent />;
}

function DistributorLeadsContent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [leads, setLeads] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [detailerFilter, setDetailerFilter] = useState('all');
  const [leadTypeFilter, setLeadTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewLeadDialogOpen, setIsViewLeadDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newComment, setNewComment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('new');
  const [lossReason, setLossReason] = useState<string>('');
  const [lossReasonDescription, setLossReasonDescription] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  
  // Fetch current user details
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/erp/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUser();
  }, []);
  
  // Fetch real leads from the database
  React.useEffect(() => {
    async function fetchLeads() {
      try {
        setLoading(true);
        // Fetch customers - in this system, leads and customers are stored in the same table
        const response = await fetch('/api/erp/customers');
        
        if (!response.ok) {
          throw new Error('Failed to fetch leads');
        }
        
        const data = await response.json();
        console.log('Fetched leads:', data);
        setLeads(data);
      } catch (error) {
        console.error('Error fetching leads:', error);
        toast({
          title: 'Error',
          description: 'Failed to load leads. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchLeads();
  }, [toast]);
  
  // Filter leads based on filters and search
  const filteredLeads = useMemo(() => leads.filter(lead => {
    // Apply status filter
    if (filter !== 'all' && lead.status !== filter) {
      return false;
    }
    
    // Apply detailer filter
    if (detailerFilter !== 'all' && lead.detailerName !== detailerFilter) {
      return false;
    }
    
    // Apply lead type filter
    const isB2BLead = ((lead.status || '').toLowerCase().includes('b2b') || 
                      (lead.remarks || '').toLowerCase().includes('b2b') ||
                      ((lead.lead_type || '') === 'b2b'));
    
    if (leadTypeFilter !== 'all') {
      if (leadTypeFilter === 'b2b' && !isB2BLead) {
        return false;
      } else if (leadTypeFilter === 'end_user' && isB2BLead) {
        return false;
      }
    }
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        lead.name.toLowerCase().includes(search) ||
        lead.email?.toLowerCase().includes(search) ||
        lead.phone.includes(search) ||
        lead.city?.toLowerCase().includes(search) ||
        lead.vehicle?.toLowerCase().includes(search) ||
        lead.detailerName?.toLowerCase().includes(search)
      );
    }
    
    return true;
  }), [leads, filter, detailerFilter, leadTypeFilter, searchTerm]);

  // Get unique detailer names for filter
  const uniqueDetailerNames = useMemo(
    () => Array.from(new Set(leads.map(lead => lead.detailerName))),
    [leads]
  );

  const handleCreateLead = async (formData: any) => {
    try {
      setLoading(true);
      
      // Check if phone number already exists by querying the API
      try {
        const checkResponse = await fetch(`/api/erp/customers/check-phone?phone=${encodeURIComponent(formData.phone)}`);
        
        if (checkResponse.ok) {
          const checkResult = await checkResponse.json();
          
          if (checkResult.exists) {
            toast({
              title: 'Phone number already exists',
              description: 'This mobile number is already registered with another lead.',
              variant: 'destructive'
            });
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error('Error checking phone number:', error);
        // Continue with form submission even if the check fails
      }
      
      // Create lead data for database persistence
      const leadData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        city: formData.city,
        status: 'new',
        brand: formData.brand,
        leadSource: formData.leadSource,
        detailerId: null, // Will be assigned if needed
        distributorId: user?.id, // Set the current distributor as owner
        lead_type: formData.lead_type || 'end_user', // Default to end_user if not specified
        userType: formData.userType || 'end_user', // Drives ERP Lead mapping (End User vs B2B + customer group)
        remarks: formData.remarks,
        external_id: formData.external_id || null,
        external_source: formData.external_source || null,
        erpOpportunityId: formData.erpOpportunityId || null
      };
      
      // Remove display-only vehicle text and ensure it's not sent to the database
      // Actual vehicle records should only be created explicitly through the Vehicle Management section
      
      console.log('Creating new lead with data:', leadData);
      
      // Make the API call to create the lead in the database
      const response = await fetch('/api/erp/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create lead');
      }
      
      const newLead = await response.json();
      
      // Add the new lead to the local state for immediate UI update
      setLeads([...leads, newLead]);
      setIsCreateDialogOpen(false);
      
      toast({
        title: 'Lead added',
        description: 'New lead has been added successfully.',
      });
    } catch (error) {
      console.error('Error creating lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to create lead. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewLead = async (lead: any) => {
    setSelectedLead(lead);
    setIsViewLeadDialogOpen(true);
    setSelectedStatus(lead.status); // Initialize selectedStatus with current lead status
    
    // Fetch comments for this lead when viewing
    await fetchLeadComments(lead.id);
  };
  
  const handleUpdateStatus = async () => {
    if (!selectedLead || !selectedStatus || selectedStatus === selectedLead.status) return;
    
    // Validate loss reason if status is "lost"
    if (selectedStatus === 'lost' && !lossReason) {
      toast({
        title: 'Loss reason required',
        description: 'Please select a reason for marking this lead as lost.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      console.log(`Updating lead ${selectedLead.id} status to: ${selectedStatus}`);
      
      // Prepare request body with loss reason if applicable
      const requestBody: any = {
        status: selectedStatus
      };
      
      if (selectedStatus === 'lost' && lossReason) {
        requestBody.lossReason = lossReason;
        requestBody.lossReasonDescription = lossReasonDescription;
      }
      
      // Make API call to update status
      const response = await fetch(`/api/erp/leads/${selectedLead.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(`Failed to update status: ${errorData.error || 'Unknown error'}`);
      }
      
      const updatedLead = await response.json();
      console.log('Lead status updated:', updatedLead);
      
      // Update the lead in the local state
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === selectedLead.id ? { ...lead, status: selectedStatus } : lead
        )
      );
      
      // Update the selected lead
      setSelectedLead({ ...selectedLead, status: selectedStatus });
      
      // Clear loss reason fields after successful update
      setLossReason('');
      setLossReasonDescription('');
      
      // Refresh comments to show the status update comment
      await fetchLeadComments(selectedLead.id);
      
      let successMessage = `Lead status updated to ${selectedStatus}`;
      if (selectedStatus === 'lost' && lossReason) {
        successMessage += ` (Reason: ${lossReason.replace('_', ' ')})`;
      }
      
      toast({
        title: 'Status updated',
        description: successMessage,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update status. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedLead) return;

    try {
      setLoading(true);
      
      // Make API call to add comment
      const response = await fetch(`/api/erp/customers/${selectedLead.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: newComment,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const newCommentData = await response.json();
      
      // Fetch all comments for this lead to refresh the list
      await fetchLeadComments(selectedLead.id);
      
      setNewComment('');
      
      toast({
        title: 'Comment added',
        description: 'Your comment has been added successfully.'
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch lead comments
  const fetchLeadComments = async (leadId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/erp/customers/${leadId}/comments`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      
      const commentsData = await response.json();
      setComments(commentsData);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load comments. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getLeadComments = (leadId: number) => {
    // Our API returns comments already sorted by newest first
    // We don't need to filter by leadId/customerId as the fetch already does that per customer
    return comments;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-100 text-blue-800">New</Badge>;
      case 'contacted':
        return <Badge className="bg-yellow-100 text-yellow-800">Contacted</Badge>;
      case 'qualified':
        return <Badge className="bg-purple-100 text-purple-800">Qualified</Badge>;
      case 'converted':
        return <Badge className="bg-green-100 text-green-800">Converted</Badge>;
      case 'lost':
        return <Badge className="bg-red-100 text-red-800">Lost</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const handleStatusChange = async (leadId: number, newStatus: string) => {
    try {
      console.log(`Updating lead ${leadId} status to: ${newStatus}`);
      
      // Make API call to update status
      const response = await fetch(`/api/erp/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update lead status');
      }
      
      const updatedLead = await response.json();
      
      // Update the lead in local state
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        )
      );
      
      toast({
        title: 'Status updated',
        description: `Lead status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lead status. Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Management</h1>
          <p className="text-gray-500 mt-1">Track and manage your leads across all detailers</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="ml-0 md:ml-4">
                <Plus className="mr-2 h-4 w-4" /> Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription>
                  Enter the lead's details to track your sales process.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = Object.fromEntries(formData.entries());
                handleCreateLead(data);
              }}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="name" className="text-right">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        className="mt-1"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone" className="text-right">
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="9876543210"
                        className="mt-1"
                        required
                        aria-required="true"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        placeholder="john@example.com"
                        type="email"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="city" className="text-right">
                        City
                      </Label>
                      <Input
                        id="city"
                        name="city"
                        placeholder="Bangalore"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="vehicle" className="text-right">
                        Vehicle Details
                      </Label>
                      <Input
                        id="vehicle"
                        name="vehicle"
                        placeholder="Honda City 2023"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="leadSource" className="text-right">
                        Lead Source
                      </Label>
                      <Select name="leadSource" defaultValue="Website">
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Website">Website</SelectItem>
                          <SelectItem value="Instagram">Instagram</SelectItem>
                          <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                          <SelectItem value="Walk-in">Walk-in</SelectItem>
                          <SelectItem value="Referral">Referral</SelectItem>
                          <SelectItem value="P91">P91</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="brand" className="text-right">
                        Brand Interest
                      </Label>
                      <Select name="brand" defaultValue="P91">
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="P91">P91</SelectItem>
                          <SelectItem value="P91 Car Care">P91 Car Care</SelectItem>
                          <SelectItem value="STEK">STEK</SelectItem>
                          <SelectItem value="Nasiol">Nasiol</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="userType" className="text-right">
                        User Type
                      </Label>
                      <Select name="userType" defaultValue="end_user">
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="end_user">End User</SelectItem>
                          <SelectItem value="detailer">Detailer</SelectItem>
                          <SelectItem value="distributor">Distributor</SelectItem>
                          <SelectItem value="installer">Installer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="lead_type" className="text-right">
                        Lead Type
                      </Label>
                      <Select name="lead_type" defaultValue="end_user">
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select lead type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="end_user">End User</SelectItem>
                          <SelectItem value="b2b">B2B</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="col-span-2">
                      <Label htmlFor="remarks" className="text-right">
                        Remarks
                      </Label>
                      <Textarea
                        id="remarks"
                        name="remarks"
                        placeholder="Enter any initial notes here..."
                        className="mt-1"
                      />
                    </div>
                    
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="submit">Create Lead</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          {/* Lead detail view dialog */}
          <Dialog open={isViewLeadDialogOpen} onOpenChange={setIsViewLeadDialogOpen}>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
              {selectedLead && (
                <>
                  <DialogHeader>
                    <DialogTitle>Lead Details</DialogTitle>
                    <DialogDescription>
                      Manage lead information and track communication history
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Tabs defaultValue="details" className="mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="details">Lead Information</TabsTrigger>
                      <TabsTrigger value="history">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Comments
                      </TabsTrigger>
                      <TabsTrigger value="timeline">
                        <Clock className="mr-2 h-4 w-4" />
                        Timeline
                      </TabsTrigger>
                    </TabsList>
                    
                    {/* Lead details tab */}
                    <TabsContent value="details">
                      <div className="grid grid-cols-2 gap-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Name</p>
                          <p className="text-base">{selectedLead.name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Phone</p>
                          <p className="text-base">{selectedLead.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Email</p>
                          <p className="text-base">{selectedLead.email || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">City</p>
                          <p className="text-base">{selectedLead.city || 'N/A'}</p>
                        </div>
                        {!((selectedLead.status || '').toLowerCase().includes('b2b') || 
                          (selectedLead.remarks || '').toLowerCase().includes('b2b') ||
                          ((selectedLead.lead_type || '') === 'b2b')) && (
                          <div className="col-span-2 mt-4">
                            <CustomerVehicles
                              customerId={selectedLead.id}
                              customerName={selectedLead.name}
                              showAddButton={true}
                            />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-500">Lead Source</p>
                          <p className="text-base">{selectedLead.leadSource || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Brand</p>
                          <p className="text-base">{selectedLead.brand || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Lead Type</p>
                          <p className="text-base">
                            {((selectedLead.status || '').toLowerCase().includes('b2b') || 
                              (selectedLead.remarks || '').toLowerCase().includes('b2b') ||
                              ((selectedLead.lead_type || '') === 'b2b')) ? 'B2B' : 'End User'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Detailer</p>
                          <p className="text-base">{selectedLead.detailerName || 'Direct Lead'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Status</p>
                          <div className="mt-1">{getStatusBadge(selectedLead.status)}</div>
                        </div>
                        {(selectedLead.external_id || selectedLead.external_source || selectedLead.erpOpportunityId) && (
                          <>
                            <div>
                              <p className="text-sm font-medium text-gray-500">External ID</p>
                              <p className="text-base text-blue-600 font-mono text-sm">{selectedLead.external_id || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">External Source</p>
                              <p className="text-base">{selectedLead.external_source || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">ERP Opportunity ID</p>
                              <p className="text-base text-green-600 font-mono text-sm">{selectedLead.erpOpportunityId || 'N/A'}</p>
                            </div>
                          </>
                        )}
                        <div className="col-span-2">
                          <p className="text-sm font-medium text-gray-500">Remarks</p>
                          <p className="text-base">{selectedLead.remarks || 'No remarks provided'}</p>
                        </div>

                        <div className="col-span-2 mt-4">
                          <Label htmlFor="status" className="text-right">
                            Update Status
                          </Label>
                          <div className="flex gap-2 mt-1">
                            <Select 
                              value={selectedStatus || selectedLead?.status || 'new'} 
                              onValueChange={(value) => {
                                console.log('Status changed to:', value);
                                setSelectedStatus(value);
                              }}
                              disabled={selectedLead?.isFrozen}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="followedup">Followed Up</SelectItem>
                                <SelectItem value="converted">Converted</SelectItem>
                                <SelectItem value="lost">Lost</SelectItem>
                                <SelectItem value="inquiry">Inquiry</SelectItem>
                                <SelectItem value="customer">Customer</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button onClick={handleUpdateStatus} disabled={!selectedStatus || selectedStatus === selectedLead?.status || (selectedStatus === 'lost' && !lossReason) || selectedLead?.isFrozen}>
                              {selectedLead?.isFrozen ? 'Lead Frozen' : 'Update Status'}
                            </Button>
                          </div>
                        </div>

                        {/* Loss reason fields - only show when status is "lost" */}
                        {selectedStatus === 'lost' && (
                          <div className="col-span-2 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <Label className="text-red-700 font-medium">
                              Loss Reason *
                            </Label>
                            <Select 
                              value={lossReason} 
                              onValueChange={(value) => setLossReason(value)}
                            >
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Select reason for loss" />
                              </SelectTrigger>
                              <SelectContent>
                                {LEAD_LOSS_REASONS.map((reason) => (
                                  <SelectItem key={reason} value={reason}>
                                    {reason.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            <div className="mt-3">
                              <Label className="text-red-700">
                                Additional Details (Optional)
                              </Label>
                              <Textarea
                                placeholder="Provide more details about why this lead was lost..."
                                className="mt-2"
                                value={lossReasonDescription}
                                onChange={(e) => setLossReasonDescription(e.target.value)}
                                maxLength={500}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                {lossReasonDescription.length}/500 characters
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Show frozen status if lead is frozen */}
                        {selectedLead?.isFrozen && (
                          <div className="col-span-2 mt-4 p-3 bg-gray-100 border border-gray-300 rounded-lg">
                            <p className="text-sm text-gray-700 font-medium">
                              🔒 This lead is frozen and cannot be modified further.
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              Leads are automatically frozen when marked as converted or lost.
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    {/* Comment history tab */}
                    <TabsContent value="history">
                      <div className="flex flex-col h-[400px]">
                        <ScrollArea className="flex-1 pr-4 mb-4">
                          {getLeadComments(selectedLead.id).length > 0 ? (
                            <div className="space-y-4">
                              {getLeadComments(selectedLead.id).map((comment) => (
                                <div key={comment.id} className="flex">
                                  <Avatar className="h-8 w-8 mr-3">
                                    <AvatarFallback>
                                      {comment.userName ? comment.userName.charAt(0) : 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center">
                                      <p className="text-sm font-medium">{comment.userName || 'Unknown User'}</p>
                                      <span className="text-xs text-gray-500 ml-2">
                                        {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700 mt-1">{comment.comment}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-center text-gray-500">
                              <MessageSquare className="h-10 w-10 mb-2 opacity-20" />
                              <p>No comments yet</p>
                              <p className="text-sm">Add a comment to start tracking your communication</p>
                            </div>
                          )}
                        </ScrollArea>
                        
                        <div className="flex items-center mt-auto">
                          <Textarea
                            placeholder="Add a comment..."
                            className="flex-1 mr-2"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                          />
                          <Button onClick={handleAddComment} size="icon">
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Timeline tab */}
                    <TabsContent value="timeline">
                      <div className="py-2">
                        <LeadTimeline leadId={selectedLead.id} />
                      </div>
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col lg:flex-row gap-4 mt-6 mb-4">
        <div className="flex-1">
          <div className="flex items-center max-w-md border rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <Search className="h-4 w-4 mr-2 text-gray-400" />
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={filter || 'all'} onValueChange={setFilter}>
            <SelectTrigger className="min-w-[160px]">
              <div className="flex">
                <Filter className="h-4 w-4 mr-2" />
                <span>Filter Status</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>

          <Select value={leadTypeFilter || 'all'} onValueChange={setLeadTypeFilter}>
            <SelectTrigger className="min-w-[160px]">
              <div className="flex">
                <ListFilter className="h-4 w-4 mr-2" />
                <span>Lead Type</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="end_user">End User</SelectItem>
              <SelectItem value="b2b">B2B</SelectItem>
            </SelectContent>
          </Select>

          <Select value={detailerFilter || 'all'} onValueChange={setDetailerFilter}>
            <SelectTrigger className="min-w-[160px]">
              <div className="flex">
                <UserIcon className="h-4 w-4 mr-2" />
                <span>Filter Detailer</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Detailers</SelectItem>
              <SelectItem value="Direct Lead">Direct Leads</SelectItem>
              {uniqueDetailerNames
                .filter(name => name !== 'Direct Lead' && name !== null && name !== undefined && name !== '')
                .map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          
          {/* View toggle buttons */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-r-none border-r"
            >
              <List className="h-4 w-4 mr-1" />
              Table
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="rounded-l-none"
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Kanban
            </Button>
          </div>
        </div>
      </div>

      {/* View Content - Table or Kanban */}
      {viewMode === 'table' ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span className="flex items-center">Leads</span>
              <InfoDot widgetId="distributor.leads.table" fallbackLabel="Leads Table" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Lead Type</TableHead>
                <TableHead>Detailer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-10">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Loading leads...</p>
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-10">
                    <div className="flex flex-col items-center">
                      <UserIcon className="h-10 w-10 text-gray-300 mb-2" />
                      <p className="text-gray-500">No leads found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.phone}</TableCell>
                    <TableCell>{lead.city || 'N/A'}</TableCell>
                    <TableCell>{lead.vehicle || 'N/A'}</TableCell>
                    <TableCell>{lead.leadSource}</TableCell>
                    <TableCell>{lead.brand}</TableCell>
                    <TableCell>
                      {((lead.status || '').toLowerCase().includes('b2b') || 
                        (lead.remarks || '').toLowerCase().includes('b2b') ||
                        ((lead.lead_type || '') === 'b2b')) ? 'B2B' : 'End User'}
                    </TableCell>
                    <TableCell>{lead.detailerName || 'Direct Lead'}</TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>{lead.createdAt}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewLead(lead)}
                        className="h-8 w-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        </Card>
      ) : (
        <div className="mt-6">
          <KanbanBoard
            leads={filteredLeads}
            onStatusChange={handleStatusChange}
            onLeadClick={handleViewLead}
            userRole="distributor"
          />
        </div>
      )}
    </div>
  );
}