import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Eye, Calendar, Building2, MapPin, Phone, Mail, Globe, Instagram, Facebook, MessageSquare, FileText, Star, Clock } from "lucide-react";
import type { PpfPartnerApplication } from "@shared/schema";

export default function PpfPartnerApplicationsPage() {
  const [applications, setApplications] = useState<PpfPartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<PpfPartnerApplication | null>(null);
  const [updateStatus, setUpdateStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch("/api/ppf-partner-applications", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch PPF partner applications",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast({
        title: "Error",
        description: "Failed to fetch PPF partner applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async () => {
    if (!selectedApp || !updateStatus) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/ppf-partner-applications/${selectedApp.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status: updateStatus, notes }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Application ${updateStatus} successfully`,
        });
        fetchApplications();
        setSelectedApp(null);
        setUpdateStatus("");
        setNotes("");
      } else {
        toast({
          title: "Error",
          description: "Failed to update application status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'escalated': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading PPF partner applications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-oxanium font-bold text-gray-900">PPF Partner Applications</h1>
          <p className="text-gray-600 mt-1">Review and manage PPF partnership applications</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50">
            {applications.length} Total Applications
          </Badge>
          <Badge variant="outline" className="bg-green-50">
            {applications.filter(app => app.status === 'approved').length} Approved
          </Badge>
          <Badge variant="outline" className="bg-yellow-50">
            {applications.filter(app => app.status === 'submitted').length} Pending
          </Badge>
        </div>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
            <p className="text-gray-600">PPF partner applications will appear here once submitted.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {applications.map((app) => (
            <Card key={app.id} className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-primary" />
                      <CardTitle className="text-xl font-oxanium">
                        {app.storeName || "Store Name Not Provided"}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {app.city}, {app.pinCode}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(app.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <Badge className={getStatusColor(app.status)}>
                      {app.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Contact Person</div>
                    <div className="font-medium">{app.ownerName}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Phone className="h-4 w-4" />
                      {app.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Mail className="h-4 w-4" />
                      {app.email}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Services Offered</div>
                    <div className="flex flex-wrap gap-1">
                      {app.services && Array.isArray(app.services) ? (
                        app.services.map((service, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">No services listed</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Online Presence</div>
                    <div className="space-y-1">
                      {app.googleMapsLocation && (
                        <div className="flex items-center gap-1 text-sm text-blue-600">
                          <MapPin className="h-4 w-4" />
                          <a href={app.googleMapsLocation} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            View Location
                          </a>
                        </div>
                      )}
                      {app.instagramHandle && (
                        <div className="flex items-center gap-1 text-sm text-pink-600">
                          <Instagram className="h-4 w-4" />
                          {app.instagramHandle}
                        </div>
                      )}
                      {app.facebookPage && (
                        <div className="flex items-center gap-1 text-sm text-blue-600">
                          <Facebook className="h-4 w-4" />
                          Facebook
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4">
                    {app.storePhotos && Array.isArray(app.storePhotos) && (
                      <div className="text-sm text-gray-600">
                        Store Photos: {app.storePhotos.length}
                      </div>
                    )}
                    {app.source && (
                      <div className="text-sm text-gray-600">
                        Source: {app.source}
                      </div>
                    )}
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedApp(app)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          {app.storeName || "PPF Partner Application"}
                        </DialogTitle>
                        <DialogDescription>
                          Application submitted on {formatDate(app.createdAt)}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-6 py-4">
                        {/* Business Information */}
                        <div className="grid md:grid-cols-2 gap-6">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Business Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div><strong>Store Name:</strong> {app.storeName}</div>
                              <div><strong>Owner:</strong> {app.ownerName}</div>
                              <div><strong>Email:</strong> {app.email}</div>
                              <div><strong>Phone:</strong> {app.phone}</div>
                              <div><strong>Location:</strong> {app.city}, {app.pinCode}</div>
                              {app.googleMapsLocation && (
                                <div>
                                  <strong>Maps Link:</strong> 
                                  <a href={app.googleMapsLocation} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                                    View on Google Maps
                                  </a>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Services & Social Media</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div>
                                <strong>Services:</strong>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {app.services && Array.isArray(app.services) ? (
                                    app.services.map((service, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {service}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-sm text-gray-500">No services listed</span>
                                  )}
                                </div>
                              </div>
                              {app.instagramHandle && (
                                <div><strong>Instagram:</strong> {app.instagramHandle}</div>
                              )}
                              {app.facebookPage && (
                                <div><strong>Facebook:</strong> {app.facebookPage}</div>
                              )}
                            </CardContent>
                          </Card>
                        </div>

                        {/* Store Photos */}
                        {app.storePhotos && Array.isArray(app.storePhotos) && app.storePhotos.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Store Photos</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {app.storePhotos.map((photo, idx) => (
                                  <div key={idx} className="border rounded-lg overflow-hidden">
                                    <img 
                                      src={photo} 
                                      alt={`Store photo ${idx + 1}`}
                                      className="w-full h-32 object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Status Management */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Application Management</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Update Status</label>
                                <Select value={updateStatus} onValueChange={setUpdateStatus}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select new status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="submitted">Submitted</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="escalated">Escalated</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium">Admin Notes</label>
                                <Textarea 
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                  placeholder="Add internal notes about this application..."
                                  className="min-h-[40px]"
                                />
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                onClick={updateApplicationStatus}
                                disabled={!updateStatus || updating}
                                className="bg-primary hover:bg-primary/90"
                              >
                                {updating ? "Updating..." : "Update Application"}
                              </Button>
                              {app.notes && (
                                <Button variant="outline" size="sm">
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  View Notes
                                </Button>
                              )}
                            </div>

                            {app.notes && (
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm font-medium text-gray-700 mb-1">Previous Notes:</div>
                                <div className="text-sm text-gray-600">{app.notes}</div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}