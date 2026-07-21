import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Calendar, Phone, Mail, MapPin, Globe, Instagram, Building2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import type { InstallerApplication } from "@shared/schema";

export default function InstallerApplicationsPage() {
  const [selectedApplication, setSelectedApplication] = useState<InstallerApplication | null>(null);

  const { data: applications, isLoading, error } = useQuery<InstallerApplication[]>({
    queryKey: ["/api/installer-applications"],
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'submitted':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading installer applications...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-600">
          <p>Failed to load installer applications. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-oxanium font-bold text-gray-900 mb-2">
          Installer Applications
        </h1>
        <p className="text-gray-600">
          Review and manage installer partnership applications
        </p>
      </div>

      {applications && applications.length > 0 ? (
        <div className="grid gap-6">
          {applications.map((application) => (
            <Card key={application.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl font-oxanium">{application.name}</CardTitle>
                    <p className="text-gray-600 mt-1">{application.businessName}</p>
                    <div className="mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {application.source === 'ppf_partner_form' 
                          ? 'PPF Partner' 
                          : application.source === 'detailed_partner_form'
                          ? 'Detailed Partner'
                          : 'Installer App'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusBadgeColor(application.status || 'submitted')}>
                      {application.status || 'Submitted'}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedApplication(application)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    {application.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    {application.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {application.city}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4" />
                    {application.businessType}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(application.createdAt), 'MMM dd, yyyy')}
                  </div>
                  {application.services && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">Services:</span>
                      {Array.isArray(application.services) 
                        ? application.services.join(', ')
                        : application.services
                      }
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 text-lg">No installer applications found.</p>
            <p className="text-gray-400 mt-2">Applications will appear here once submitted.</p>
          </CardContent>
        </Card>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-oxanium">
              Application Details
            </DialogTitle>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{selectedApplication.name}</h3>
                  <p className="text-gray-600">{selectedApplication.businessName}</p>
                  {/* Source indicator */}
                  <div className="mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {selectedApplication.source === 'ppf_partner_form' 
                        ? 'PPF Partner Form' 
                        : selectedApplication.source === 'detailed_partner_form'
                        ? 'Detailed Partner Form'
                        : 'Installer Application Form'}
                    </Badge>
                  </div>
                </div>
                <Badge className={getStatusBadgeColor(selectedApplication.status || 'submitted')}>
                  {selectedApplication.status || 'Submitted'}
                </Badge>
              </div>

              <Separator />

              {/* Contact Information */}
              <div>
                <h4 className="font-semibold text-lg mb-3">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{selectedApplication.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{selectedApplication.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{selectedApplication.city}</span>
                    {selectedApplication.pinCode && <span>, {selectedApplication.pinCode}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span>{selectedApplication.businessType}</span>
                  </div>
                </div>
              </div>

              {/* Business Details */}
              <div>
                <h4 className="font-semibold text-lg mb-3">Business Details</h4>
                <div className="space-y-3">
                  {selectedApplication.storeArea && (
                    <div>
                      <span className="font-medium">Store Area:</span> {selectedApplication.storeArea}
                    </div>
                  )}
                  {selectedApplication.services && (
                    <div>
                      <span className="font-medium">Services Offered:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {Array.isArray(selectedApplication.services) 
                          ? selectedApplication.services.map((service, index) => (
                              <Badge key={index} variant="outline">{service}</Badge>
                            ))
                          : <Badge variant="outline">{selectedApplication.services}</Badge>
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Information */}
              {selectedApplication.googleMapsLocation && (
                <div>
                  <h4 className="font-semibold text-lg mb-3">Location</h4>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <a 
                      href={selectedApplication.googleMapsLocation} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      View on Google Maps
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Online Presence */}
              {(selectedApplication.website || selectedApplication.instagramHandle) && (
                <div>
                  <h4 className="font-semibold text-lg mb-3">Online Presence</h4>
                  <div className="space-y-2">
                    {selectedApplication.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <a 
                          href={selectedApplication.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {selectedApplication.website}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {selectedApplication.instagramHandle && (
                      <div className="flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-gray-500" />
                        <span>{selectedApplication.instagramHandle}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Google Maps Location */}
              {selectedApplication.googleMapsLocation && (
                <div>
                  <h4 className="font-semibold text-lg mb-3">Location</h4>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <a 
                      href={selectedApplication.googleMapsLocation} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      View on Google Maps
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Message */}
              {selectedApplication.message && (
                <div>
                  <h4 className="font-semibold text-lg mb-3">Additional Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{selectedApplication.message}</p>
                  </div>
                </div>
              )}

              {/* Application Date */}
              <div>
                <h4 className="font-semibold text-lg mb-3">Application Date</h4>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(selectedApplication.createdAt), 'MMMM dd, yyyy at hh:mm a')}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}