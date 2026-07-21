import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isTestRecord } from "@/lib/data-hygiene";
import { format } from "date-fns";
import { CreateUserForm } from "@/components/user-management/CreateUserForm";
import { InfoDot } from "@/components/dev/InfoDot";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Search,
  MoreVertical,
  UserCheck,
  UserX,
  Mail,
  Eye,
  RefreshCw,
  PhoneIcon,
  ShieldCheck,
  UserCircle,
  Plus,
  Trash2,
  Edit,
  Users,
} from "lucide-react";

export default function UserManagementPage() {
  const { toast } = useToast();
  
  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showTestUsers, setShowTestUsers] = useState(false); // hide jaggi/test accounts by default
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isUserProfileDialogOpen, setIsUserProfileDialogOpen] = useState(false);
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isAssignDistributorDialogOpen, setIsAssignDistributorDialogOpen] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState("unassigned");
  
  // State for PPF Setu partner types (only for UI changes before save)
  const [ppfSetuPartnerTypes, setPpfSetuPartnerTypes] = useState<Record<number, string>>({});

  // All queries - defined at top level before any early returns
  const currentUserQuery = useQuery({
    queryKey: ['/api/erp/me'],
  });

  const usersQuery = useQuery({
    queryKey: ['/api/erp/users'],
    enabled: !!currentUserQuery.data && ['admin', 'distributor', 'detailer', 'installer'].includes((currentUserQuery.data as any).role),
  });

  const distributorsQuery = useQuery({
    queryKey: ['/api/erp/distributors'],
    enabled: !!currentUserQuery.data && (currentUserQuery.data as any).role === 'admin',
  });

  const userDetailsQuery = useQuery({
    queryKey: ['/api/erp/users', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return null;
      const response = await apiRequest('GET', `/api/erp/users/${selectedUser.id}`);
      return await response.json();
    },
    enabled: !!selectedUser && isUserProfileDialogOpen,
  });

  // All mutations - defined at top level
  const approveUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('POST', `/api/erp/users/${userId}/approve`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "User approved",
        description: "User has been approved successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/erp/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve user",
        variant: "destructive",
      });
    },
  });

  const rejectUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('POST', `/api/erp/users/${userId}/reject`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "User rejected",
        description: "User has been rejected successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/erp/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject user",
        variant: "destructive",
      });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      const endpoint = isActive ? `/api/erp/users/${userId}/enable` : `/api/erp/users/${userId}/disable`;
      const response = await apiRequest('POST', endpoint);
      return await response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: variables.isActive ? "User enabled" : "User disabled",
        description: `User has been ${variables.isActive ? "enabled" : "disabled"} successfully`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/erp/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('POST', `/api/erp/users/${userId}/password-reset`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password reset email sent",
        description: "A password reset email has been sent to the user",
        variant: "default",
      });
      setIsResetPasswordDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('DELETE', `/api/erp/users/${userId}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "User deleted",
        description: "User has been permanently deleted from the system",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/erp/users'] });
      setIsDeleteUserDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: number; userData: any }) => {
      const response = await apiRequest('PUT', `/api/erp/users/${userId}`, userData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "User information has been updated successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/erp/users'] });
      setIsEditUserDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const assignDistributorMutation = useMutation({
    mutationFn: async ({ userId, distributorId }: { userId: number; distributorId: number | null }) => {
      const response = await apiRequest('PUT', `/api/erp/users/${userId}/assign-distributor`, { distributorId });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Distributor assigned",
        description: "Distributor has been assigned successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/erp/users'] });
      setIsAssignDistributorDialogOpen(false);
      setSelectedUser(null);
      setSelectedDistributor("unassigned");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign distributor",
        variant: "destructive",
      });
    },
  });

  // Mutation for PPF Setu access toggle
  const updatePpfSetuAccessMutation = useMutation({
    mutationFn: async ({ userId, ppfSetuAccess, ppfSetuPartnerType, ppfSetuPartnerId }: { userId: number; ppfSetuAccess: boolean; ppfSetuPartnerType?: string; ppfSetuPartnerId?: string }) => {
      const response = await apiRequest('PATCH', `/api/users/${userId}/ppf-setu-access`, { 
        ppfSetuAccess,
        ppfSetuPartnerType,
        partnerId: ppfSetuPartnerId
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "PPF Setu Access Updated",
        description: "User's PPF Setu access has been updated successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/erp/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update PPF Setu access",
        variant: "destructive",
      });
    },
  });

  // Get user data
  const users = usersQuery.data || [];

  // Early returns after all hooks
  if (currentUserQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUserQuery.data || !['admin', 'distributor', 'detailer', 'installer'].includes((currentUserQuery.data as any).role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access user management.</p>
        </div>
      </div>
    );
  }

  // Simple filtering without useMemo to avoid any potential issues
  let filteredUsers = Array.isArray(users) ? users : [];

  if (Array.isArray(users)) {
    filteredUsers = users.filter((user: any) => {
      const matchesSearch = searchTerm === "" || 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm);
      
      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" && user.status === "pending") ||
        (statusFilter === "approved" && user.status === "approved") ||
        (statusFilter === "rejected" && user.status === "rejected") ||
        (statusFilter === "disabled" && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  // All roles actually present in the data (covers the sales hierarchy roles —
  // national_sales_manager / regional_sales_manager / salesperson — that the static dropdown
  // was missing), so the filter always matches real user types.
  const roleOptions = Array.from(
    new Set((Array.isArray(users) ? users : []).map((u: any) => u.role).filter(Boolean)),
  ).sort() as string[];
  const formatRole = (r: string) =>
    r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Simple utility functions
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return dateString || 'N/A';
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-800">Disabled</Badge>;
    }

    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "pending":
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status || "Unknown"}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "distributor":
        return <Badge className="bg-purple-100 text-purple-800">Distributor</Badge>;
      case "detailer":
        return <Badge className="bg-indigo-100 text-indigo-800">Detailer</Badge>;
      case "installer":
        return <Badge className="bg-blue-100 text-blue-800">Installer</Badge>;
      case "admin":
        return <Badge className="bg-amber-100 text-amber-800">Admin</Badge>;
      case "national_sales_manager":
        return <Badge className="bg-green-100 text-green-800">NSM</Badge>;
      case "regional_sales_manager":
        return <Badge className="bg-emerald-100 text-emerald-800">RSM</Badge>;
      case "asm":
        return <Badge className="bg-teal-100 text-teal-800">ASM</Badge>;
      case "salesperson":
        return <Badge className="bg-cyan-100 text-cyan-800">Salesperson</Badge>;
      case "sales_partner":
        return <Badge className="bg-lime-100 text-lime-800">Sales Partner</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{formatRole(role || 'User')}</Badge>;
    }
  };

  // Event handlers
  const handleToggleUserStatus = (user: any) => {
    toggleUserStatusMutation.mutate({
      userId: user.id,
      isActive: !user.isActive,
    });
  };

  const handleOpenResetPasswordDialog = (user: any) => {
    setSelectedUser(user);
    setIsResetPasswordDialogOpen(true);
  };

  const handleSendPasswordReset = () => {
    if (selectedUser) {
      resetPasswordMutation.mutate(selectedUser.id);
    }
  };

  const handleApproveUser = (userId: number) => {
    approveUserMutation.mutate(userId);
  };

  const handleRejectUser = (userId: number) => {
    rejectUserMutation.mutate(userId);
  };

  const handleViewUserProfile = (user: any) => {
    setSelectedUser(user);
    setIsUserProfileDialogOpen(true);
  };

  const handleDeleteUser = (user: any) => {
    setSelectedUser(user);
    setIsDeleteUserDialogOpen(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsEditUserDialogOpen(true);
  };

  const confirmDeleteUser = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  const handleAssignDistributor = (user: any) => {
    setSelectedUser(user);
    setSelectedDistributor(user.distributorId?.toString() || "unassigned");
    setIsAssignDistributorDialogOpen(true);
  };

  const confirmAssignDistributor = () => {
    if (selectedUser) {
      const distributorId = selectedDistributor === "unassigned" ? null : parseInt(selectedDistributor);
      assignDistributorMutation.mutate({
        userId: selectedUser.id,
        distributorId
      });
    }
  };

  // Handle PPF Setu access toggle
  const handlePpfSetuAccessToggle = (user: any, checked: boolean) => {
    const partnerType = ppfSetuPartnerTypes[user.id] || user.ppfSetuPartnerType || 'STUDIO';
    const partnerId = user.ppfSetuPartnerId || user.id.toString();
    
    if (checked && !partnerType) {
      toast({
        title: "Partner Type Required",
        description: "Please select a partner type before enabling access",
        variant: "destructive",
      });
      return;
    }
    
    updatePpfSetuAccessMutation.mutate({
      userId: user.id,
      ppfSetuAccess: checked,
      ppfSetuPartnerType: checked ? partnerType : undefined,
      ppfSetuPartnerId: partnerId
    });
  };

  // Handle partner type change
  const handlePartnerTypeChange = (userId: number, partnerType: string) => {
    setPpfSetuPartnerTypes(prev => ({
      ...prev,
      [userId]: partnerType
    }));
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">User Management</h1>
          <p className="text-gray-500">
            Manage users in your organization - create, approve, and oversee access
          </p>
        </div>
        
        <Button 
          onClick={() => setIsCreateUserDialogOpen(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create User
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roleOptions.map((r) => (
              <SelectItem key={r} value={r}>{formatRole(r)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center">Users</span>
            <InfoDot widgetId="admin.userManagement.table" fallbackLabel="Users table" />
          </CardTitle>
          <CardDescription>
            {filteredUsers.length} users found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : !filteredUsers.length ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <UserCircle className="w-12 h-12 mb-2" />
              <p>No users found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Territory</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pulse Access</TableHead>
                  <TableHead>VAS Access</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <UserCircle className="w-8 h-8 text-gray-400" />
                        <div>
                          <div className="font-medium">{user.name || user.username}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.phone && (
                            <div className="text-sm text-gray-500 flex items-center">
                              <PhoneIcon className="w-3 h-3 mr-1" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell className="text-sm">{user.brands || '—'}</TableCell>
                    <TableCell className="text-sm">{user.territory || '—'}</TableCell>
                    <TableCell>{getStatusBadge(user.status, user.isActive)}</TableCell>
                    <TableCell>
                      {/* Pulse access = login enabled/disabled */}
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!!user.isActive}
                          onCheckedChange={(checked) =>
                            toggleUserStatusMutation.mutate({ userId: user.id, isActive: checked })
                          }
                          disabled={toggleUserStatusMutation.isPending}
                        />
                        <span className="text-sm text-gray-600">{user.isActive ? 'On' : 'Off'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.ppfSetuAccess || false}
                            onCheckedChange={(checked) => handlePpfSetuAccessToggle(user, checked)}
                            disabled={updatePpfSetuAccessMutation.isPending}
                            data-testid={`switch-ppf-setu-${user.id}`}
                          />
                          <span className="text-sm text-gray-600">
                            {user.ppfSetuAccess ? 'Enabled' : 'Disabled'}
                          </span>
                          {user.ppfSetuAccess && (
                            <a
                              href="https://pulsevas.p91india.com/"
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary underline"
                            >
                              Open VAS
                            </a>
                          )}
                        </div>
                        {(user.ppfSetuAccess || ppfSetuPartnerTypes[user.id]) && (
                          <Select
                            value={ppfSetuPartnerTypes[user.id] || user.ppfSetuPartnerType || ''}
                            onValueChange={(value) => handlePartnerTypeChange(user.id, value)}
                            disabled={updatePpfSetuAccessMutation.isPending}
                          >
                            <SelectTrigger className="w-32" data-testid={`select-partner-type-${user.id}`}>
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="STUDIO">Studio</SelectItem>
                              <SelectItem value="INSTALLER">Installer</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewUserProfile(user)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          
                          {(user.status === "pending" || user.status === "submitted") && (
                            <>
                              <DropdownMenuItem onClick={() => handleApproveUser(user.id)}>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRejectUser(user.id)}>
                                <UserX className="w-4 h-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          
                          <DropdownMenuItem onClick={() => handleToggleUserStatus(user)}>
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            {user.isActive ? "Disable" : "Enable"}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => handleOpenResetPasswordDialog(user)}>
                            <Mail className="w-4 h-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          
                          {(user.role === 'detailer' || user.role === 'installer') && (currentUserQuery.data as any)?.role === 'admin' && (
                            <DropdownMenuItem onClick={() => handleAssignDistributor(user)}>
                              <Users className="w-4 h-4 mr-2" />
                              Assign Distributor
                            </DropdownMenuItem>
                          )}
                          
                          {user.role !== 'admin' && (
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
        <DialogContent 
          className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => {
            // Prevent closing when clicking on Google Places autocomplete dropdown
            const target = e.target as HTMLElement;
            if (target.closest('.pac-container')) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system with appropriate role and permissions.
            </DialogDescription>
          </DialogHeader>
          
          <CreateUserForm 
            onSuccess={() => {
              setIsCreateUserDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: ['/api/erp/users'] });
            }}
            currentUserRole={(currentUserQuery.data as any)?.role}
          />
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Send a password reset email to {selectedUser?.name || selectedUser?.username}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendPasswordReset}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Reset Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteUserDialogOpen} onOpenChange={setIsDeleteUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete {selectedUser?.name || selectedUser?.username}? 
              This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDeleteUser}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information for {selectedUser?.name || selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <CreateUserForm 
              onSuccess={() => {
                setIsEditUserDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ['/api/erp/users'] });
              }}
              currentUserRole={(currentUserQuery.data as any)?.role}
              editMode={true}
              existingUser={selectedUser}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* User Profile Dialog */}
      <Dialog open={isUserProfileDialogOpen} onOpenChange={setIsUserProfileDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>
              Detailed information about {selectedUser?.name || selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          
          {userDetailsQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : userDetailsQuery.data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-sm text-gray-600">{userDetailsQuery.data.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Username</label>
                  <p className="text-sm text-gray-600">{userDetailsQuery.data.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-gray-600">{userDetailsQuery.data.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <p className="text-sm text-gray-600">{userDetailsQuery.data.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <div className="mt-1">{getRoleBadge(userDetailsQuery.data.role)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="mt-1">{getStatusBadge(userDetailsQuery.data.status, userDetailsQuery.data.isActive)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Created</label>
                  <p className="text-sm text-gray-600">{formatDate(userDetailsQuery.data.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Last Updated</label>
                  <p className="text-sm text-gray-600">{formatDate(userDetailsQuery.data.updatedAt)}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Failed to load user details</p>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Distributor Dialog */}
      <Dialog open={isAssignDistributorDialogOpen} onOpenChange={setIsAssignDistributorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Distributor</DialogTitle>
            <DialogDescription>
              Assign or change the distributor for {selectedUser?.name || selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Distributor</label>
              <Select value={selectedDistributor} onValueChange={setSelectedDistributor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a distributor..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">No Distributor (Unassigned)</SelectItem>
                  {distributorsQuery.data?.map((distributor: any) => (
                    <SelectItem key={distributor.id} value={distributor.id.toString()}>
                      {distributor.name} - {distributor.metadata?.state || 'Unknown State'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedUser?.distributorId && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Current Assignment:</strong> {
                    distributorsQuery.data?.find((d: any) => d.id === selectedUser.distributorId)?.name || 'Unknown Distributor'
                  }
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDistributorDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmAssignDistributor}
              disabled={assignDistributorMutation.isPending}
            >
              {assignDistributorMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Assign Distributor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}