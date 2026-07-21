import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { 
  Search, 
  Eye, 
  Check, 
  X, 
  Clock, 
  User, 
  Building2, 
  Mail, 
  Phone,
  MapPin,
  Calendar,
  Filter,
  Bell,
  ChevronDown,
  Plus
} from "lucide-react";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { InfoDot } from "@/components/dev/InfoDot";

const SETTING_KEY = 'pulse_notification_emails';

function NotificationEmailsPanel() {
  const [newEmail, setNewEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const settingUrl = `/api/erp/settings/${SETTING_KEY}`;
  const { data, isLoading } = useQuery<{ value: string | null }>({
    queryKey: [settingUrl],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const emails: string[] = (() => {
    try { return JSON.parse(data?.value ?? '[]'); } catch { return []; }
  })();

  const saveMutation = useMutation({
    mutationFn: (updated: string[]) =>
      apiRequest('PUT', `/api/erp/settings/${SETTING_KEY}`, { value: JSON.stringify(updated) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [settingUrl] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save notification emails.", variant: "destructive" });
    },
  });

  function addEmail() {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (emails.includes(trimmed)) {
      toast({ title: "Already added", description: "This email is already in the list." });
      return;
    }
    saveMutation.mutate([...emails, trimmed]);
    setNewEmail("");
  }

  function removeEmail(email: string) {
    saveMutation.mutate(emails.filter(e => e !== email));
  }

  return (
    <Card className="mb-6">
      <CardHeader
        className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg select-none"
        onClick={() => setIsOpen((o) => !o)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Notification Emails</CardTitle>
              <CardDescription className="text-sm">
                Emails that receive an alert when a new application is submitted
                {!isLoading && emails.length > 0 && ` — ${emails.length} configured`}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <InfoDot widgetId="admin.pulseApplications.notificationEmails" fallbackLabel="Notification Emails" />
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0 pb-4">
          {/* Add email row */}
          <div className="flex gap-2 mb-4">
            <Input
              type="email"
              placeholder="admin@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEmail(); } }}
              className="flex-1"
            />
            <Button
              onClick={addEmail}
              disabled={saveMutation.isPending}
              size="sm"
              className="shrink-0"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {/* Email list */}
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : emails.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No notification emails configured. Add one above.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {emails.map((email) => (
                <div
                  key={email}
                  className="flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full px-3 py-1 text-sm"
                >
                  <Mail className="h-3 w-3 shrink-0" />
                  <span>{email}</span>
                  <button
                    onClick={() => removeEmail(email)}
                    disabled={saveMutation.isPending}
                    className="ml-1 hover:text-red-600 transition-colors"
                    title="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

interface PulseApplication {
  id: number;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  businessName: string;
  workspaceName: string;
  businessTypes: string[];
  country: string;
  state: string;
  city: string;
  businessAddress: string;
  status: 'submitted' | 'approved' | 'rejected' | 'hold';
  role: string;
  profileImagePath?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PulseApplicationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApplication, setSelectedApplication] = useState<PulseApplication | null>(null);
  const queryClient = useQueryClient();

  // Fetch pending P91 Pulse applications
  const { data: applications = [], isLoading } = useQuery<PulseApplication[]>({
    queryKey: ['/api/erp/pulse-applications'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Approve application mutation
  const approveApplicationMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      return apiRequest('POST', `/api/erp/pulse-applications/${applicationId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/erp/pulse-applications'] });
      toast({
        title: "Application Approved",
        description: "The P91 Pulse application has been approved and the user can now log in.",
      });
      setSelectedApplication(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve application",
        variant: "destructive",
      });
    },
  });

  // Reject application mutation
  const rejectApplicationMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      return apiRequest('POST', `/api/erp/pulse-applications/${applicationId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/erp/pulse-applications'] });
      toast({
        title: "Application Rejected",
        description: "The P91 Pulse application has been rejected.",
      });
      setSelectedApplication(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject application",
        variant: "destructive",
      });
    },
  });

  // Hold application mutation
  const holdApplicationMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      return apiRequest('POST', `/api/erp/pulse-applications/${applicationId}/hold`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/erp/pulse-applications'] });
      toast({
        title: "Application On Hold",
        description: "The P91 Pulse application has been put on hold.",
      });
      setSelectedApplication(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to hold application",
        variant: "destructive",
      });
    },
  });

  // Filter applications
  const filteredApplications = applications.filter((app: PulseApplication) => {
    const matchesSearch = 
      app.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.businessName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" /> Submitted
        </Badge>;
      case 'hold':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
          <Clock className="h-3 w-3 mr-1" /> On Hold
        </Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Check className="h-3 w-3 mr-1" /> Approved
        </Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <X className="h-3 w-3 mr-1" /> Rejected
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <NotificationEmailsPanel />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">P91 Pulse Applications</CardTitle>
              <CardDescription>
                Review and approve P91 Pulse detailer and installer applications
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1">
                Total: {applications.length}
              </Badge>
              <Badge variant="outline" className="px-3 py-1 bg-yellow-50 text-yellow-700">
                Submitted: {applications.filter((app: PulseApplication) => app.status === 'submitted').length}
              </Badge>
              <InfoDot widgetId="admin.pulseApplications.table" fallbackLabel="P91 Pulse Applications" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or business..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="hold">On Hold</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Applications Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application: PulseApplication) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {application.firstName} {application.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{application.email}</div>
                          <Badge
                            variant="outline"
                            className={application.role === 'installer'
                              ? "mt-1 text-xs bg-blue-50 text-blue-700 border-blue-200"
                              : "mt-1 text-xs bg-purple-50 text-purple-700 border-purple-200"}
                          >
                            {application.role === 'installer' ? 'Installer' : 'Detailer'}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {application.role === 'installer' ? (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">Installer</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 border-green-200">Detailer</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{application.businessName}</div>
                        <div className="text-sm text-gray-500">{application.position}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {application.city}, {application.state}
                        <br />
                        <span className="text-gray-500">{application.country}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(application.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(application.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedApplication(application)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Application Details</DialogTitle>
                              <DialogDescription>
                                Review P91 Pulse application from {application.firstName} {application.lastName}
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedApplication && (
                              <div className="space-y-6">
                                {/* Personal Information */}
                                <div className="space-y-4">
                                  <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Personal Information
                                  </h3>
                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium text-gray-600">Name</Label>
                                      <p className="text-sm">{selectedApplication.firstName} {selectedApplication.lastName}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium text-gray-600">Role</Label>
                                      <div className="mt-1">
                                        <Badge
                                          variant="outline"
                                          className={selectedApplication.role === 'installer'
                                            ? "text-xs bg-blue-50 text-blue-700 border-blue-200"
                                            : "text-xs bg-purple-50 text-purple-700 border-purple-200"}
                                        >
                                          {selectedApplication.role === 'installer' ? 'Installer' : 'Detailer'}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium text-gray-600">Position</Label>
                                      <p className="text-sm">{selectedApplication.position}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium text-gray-600">Email</Label>
                                      <p className="text-sm">{selectedApplication.email}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium text-gray-600">Phone</Label>
                                      <p className="text-sm">{selectedApplication.phone}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Business Information */}
                                <div className="space-y-4">
                                  <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Business Information
                                  </h3>
                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium text-gray-600">Business Name</Label>
                                      <p className="text-sm">{selectedApplication.businessName}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium text-gray-600">Workspace Name</Label>
                                      <p className="text-sm">{selectedApplication.workspaceName}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                      <Label className="text-sm font-medium text-gray-600">Business Types</Label>
                                      <div className="flex flex-wrap gap-2 mt-1">
                                        {selectedApplication.businessTypes.map((type, index) => (
                                          <Badge key={index} variant="outline" className="text-xs">
                                            {type}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Location Information */}
                                <div className="space-y-4">
                                  <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    Location Information
                                  </h3>
                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium text-gray-600">Country</Label>
                                      <p className="text-sm">{selectedApplication.country}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium text-gray-600">State</Label>
                                      <p className="text-sm">{selectedApplication.state}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium text-gray-600">City</Label>
                                      <p className="text-sm">{selectedApplication.city}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium text-gray-600">Applied On</Label>
                                      <p className="text-sm">{new Date(selectedApplication.createdAt).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                  {selectedApplication.businessAddress && (
                                    <div>
                                      <Label className="text-sm font-medium text-gray-600">Business Address</Label>
                                      <p className="text-sm">{selectedApplication.businessAddress}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Action Buttons */}
                                {selectedApplication.status === 'submitted' && (
                                  <div className="flex gap-3 pt-4 border-t">
                                    <Button
                                      onClick={() => approveApplicationMutation.mutate(selectedApplication.id)}
                                      disabled={approveApplicationMutation.isPending}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Check className="h-4 w-4 mr-2" />
                                      Approve
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => holdApplicationMutation.mutate(selectedApplication.id)}
                                      disabled={holdApplicationMutation.isPending}
                                    >
                                      <Clock className="h-4 w-4 mr-2" />
                                      Hold
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => rejectApplicationMutation.mutate(selectedApplication.id)}
                                      disabled={rejectApplicationMutation.isPending}
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Reject
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        {application.status === 'submitted' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => approveApplicationMutation.mutate(application.id)}
                              disabled={approveApplicationMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectApplicationMutation.mutate(application.id)}
                              disabled={rejectApplicationMutation.isPending}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filteredApplications.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search or filter criteria."
                  : "No P91 Pulse applications have been submitted yet."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}