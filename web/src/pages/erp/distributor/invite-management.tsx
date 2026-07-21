import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InfoDot } from '@/components/dev/InfoDot';
import { toast } from "@/hooks/use-toast";
import { 
  Copy, 
  Plus, 
  Calendar, 
  Users, 
  Mail, 
  Link2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Send,
  Share2
} from "lucide-react";

interface InviteLink {
  id: number;
  token: string;
  email: string | null;
  maxUses: number;
  currentUses: number;
  expiresAt: string;
  registrationLink: string;
  isExpired: boolean;
  isUsedUp: boolean;
  createdAt: string;
}

export default function InviteManagementPage() {
  const [invites, setInvites] = useState<InviteLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const [newInviteData, setNewInviteData] = useState({
    email: '',
    maxUses: 1,
    expiresInHours: 168 // 7 days default
  });

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      const response = await fetch('/api/distributor/invites', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setInvites(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch invite links",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching invites:', error);
      toast({
        title: "Error",
        description: "Failed to fetch invite links",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createInviteLink = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/distributor/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newInviteData),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: "Invite link created successfully!",
        });
        
        setShowCreateDialog(false);
        setNewInviteData({
          email: '',
          maxUses: 1,
          expiresInHours: 168
        });
        
        fetchInvites(); // Refresh the list
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to create invite link",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating invite:', error);
      toast({
        title: "Error",
        description: "Failed to create invite link",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Registration link copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (invite: InviteLink) => {
    if (invite.isExpired) return 'bg-red-100 text-red-800';
    if (invite.isUsedUp) return 'bg-gray-100 text-gray-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (invite: InviteLink) => {
    if (invite.isExpired) return 'Expired';
    if (invite.isUsedUp) return 'Used Up';
    return 'Active';
  };

  const getStatusIcon = (invite: InviteLink) => {
    if (invite.isExpired) return <XCircle className="h-4 w-4" />;
    if (invite.isUsedUp) return <CheckCircle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading invite links...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-oxanium font-bold text-gray-900">Detailer Invitations</h1>
          <p className="text-gray-600 mt-1">Invite detailers to join your network with secure registration links</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Create Invite Link
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Invitation Link</DialogTitle>
              <DialogDescription>
                Generate a secure registration link for a new detailer to join your network.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="detailer@example.com"
                  value={newInviteData.email}
                  onChange={(e) => setNewInviteData({...newInviteData, email: e.target.value})}
                />
                <p className="text-xs text-gray-600 mt-1">
                  If provided, only this email can use the invitation
                </p>
              </div>
              
              <div>
                <Label htmlFor="maxUses">Maximum Uses</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min="1"
                  max="50"
                  value={newInviteData.maxUses}
                  onChange={(e) => setNewInviteData({...newInviteData, maxUses: parseInt(e.target.value) || 1})}
                />
                <p className="text-xs text-gray-600 mt-1">
                  How many times this link can be used
                </p>
              </div>
              
              <div>
                <Label htmlFor="expiresIn">Expires In (Hours)</Label>
                <Input
                  id="expiresIn"
                  type="number"
                  min="1"
                  max="8760"
                  value={newInviteData.expiresInHours}
                  onChange={(e) => setNewInviteData({...newInviteData, expiresInHours: parseInt(e.target.value) || 168})}
                />
                <p className="text-xs text-gray-600 mt-1">
                  168 hours = 7 days (default)
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => setShowCreateDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={createInviteLink}
                disabled={creating}
                className="flex-1"
              >
                {creating ? "Creating..." : "Create Invite"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Link2 className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invites</p>
                <p className="text-2xl font-bold">{invites.length}</p>
              </div>
              <InfoDot widgetId="distributor.detailerInvite.totalSummary" fallbackLabel="Total Invites" className="ml-auto" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Invites</p>
                <p className="text-2xl font-bold">
                  {invites.filter(i => !i.isExpired && !i.isUsedUp).length}
                </p>
              </div>
              <InfoDot widgetId="distributor.detailerInvite.activeSummary" fallbackLabel="Active Invites" className="ml-auto" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Uses</p>
                <p className="text-2xl font-bold">
                  {invites.reduce((sum, invite) => sum + invite.currentUses, 0)}
                </p>
              </div>
              <InfoDot widgetId="distributor.detailerInvite.usesSummary" fallbackLabel="Total Uses" className="ml-auto" />
            </div>
          </CardContent>
        </Card>
      </div>

      {invites.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Share2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Invite Links Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first invitation link to start inviting detailers to your network.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Invite
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invites.map((invite) => (
            <Card key={invite.id} className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-oxanium flex items-center justify-between gap-2">
                      <span className="flex items-center">Invite #{invite.id}</span>
                      <InfoDot widgetId="distributor.detailerInvite.list" fallbackLabel="Invite Links List" />
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {invite.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {invite.email}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Created {formatDate(invite.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  <Badge className={getStatusColor(invite)}>
                    {getStatusIcon(invite)}
                    <span className="ml-1">{getStatusText(invite)}</span>
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Usage:</span>
                    <span className="ml-2">{invite.currentUses} / {invite.maxUses}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Expires:</span>
                    <span className="ml-2">{formatDate(invite.expiresAt)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className="ml-2">{getStatusText(invite)}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Registration Link:</Label>
                  <div className="flex gap-2">
                    <Input
                      value={invite.registrationLink}
                      readOnly
                      className="font-mono text-xs bg-gray-50"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(invite.registrationLink)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600">
                    Share this link with the detailer you want to invite to your network.
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}