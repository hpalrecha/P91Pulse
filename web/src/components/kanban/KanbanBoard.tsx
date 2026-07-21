import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, Phone, Mail, MapPin, Calendar, User, Car } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  status: string;
  brand?: string;
  vehicle?: string;
  remarks?: string;
  createdAt: string;
  detailerId?: number;
  distributorId?: number;
  assignedDetailer?: string;
  assignedDistributor?: string;
  is_frozen?: boolean;
  loss_reason?: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  leads: Lead[];
}

interface KanbanBoardProps {
  leads: Lead[];
  onStatusChange: (leadId: number, newStatus: string) => void;
  onLeadClick: (lead: Lead) => void;
  userRole: 'detailer' | 'distributor' | 'admin';
}

const statusConfig = {
  new: { title: 'New Leads', color: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-800' },
  contacted: { title: 'Contacted', color: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-100 text-yellow-800' },
  qualified: { title: 'Qualified', color: 'bg-purple-50 border-purple-200', badge: 'bg-purple-100 text-purple-800' },
  converted: { title: 'Converted', color: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-800' },
  lost: { title: 'Lost', color: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-800' }
};

export function KanbanBoard({ leads, onStatusChange, onLeadClick, userRole }: KanbanBoardProps) {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Group leads by status
  const columns: KanbanColumn[] = Object.entries(statusConfig).map(([status, config]) => ({
    id: status,
    title: config.title,
    color: config.color,
    leads: leads.filter(lead => lead.status === status)
  }));

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedLead && draggedLead.status !== newStatus) {
      // Don't allow changing status of frozen leads
      if (draggedLead.is_frozen) {
        return;
      }
      onStatusChange(draggedLead.id, newStatus);
    }
    setDraggedLead(null);
  };

  const getStatusBadgeColor = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig]?.badge || 'bg-gray-100 text-gray-800';
  };

  const LeadCard = ({ lead }: { lead: Lead }) => (
    <Card 
      className={`mb-3 cursor-pointer hover:shadow-md transition-shadow ${lead.is_frozen ? 'opacity-60' : ''}`}
      draggable={!lead.is_frozen}
      onDragStart={(e) => handleDragStart(e, lead)}
      onClick={() => setSelectedLead(lead)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-sm truncate flex-1">{lead.name}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onLeadClick(lead)}>
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="space-y-1 text-xs text-gray-600">
          {lead.phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              <span className="truncate">{lead.phone}</span>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          {lead.city && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{lead.city}</span>
            </div>
          )}
          {lead.vehicle && (
            <div className="flex items-center gap-1">
              <Car className="h-3 w-3" />
              <span className="truncate">{lead.vehicle}</span>
            </div>
          )}
        </div>

        <div className="mt-2 flex justify-between items-center">
          <Badge variant="secondary" className={`text-xs ${getStatusBadgeColor(lead.status)}`}>
            {lead.status}
          </Badge>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
          </span>
        </div>

        {lead.is_frozen && (
          <div className="mt-2">
            <Badge variant="destructive" className="text-xs">
              Frozen {lead.loss_reason && `- ${lead.loss_reason}`}
            </Badge>
          </div>
        )}

        {(userRole === 'admin' || userRole === 'distributor') && (
          <div className="mt-2 text-xs text-gray-500">
            {lead.assignedDetailer && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>Detailer: {lead.assignedDetailer}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex space-x-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div
          key={column.id}
          className={`min-w-[280px] rounded-lg border-2 border-dashed p-4 ${column.color}`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">{column.title}</h3>
            <Badge variant="outline" className="bg-white">
              {column.leads.length}
            </Badge>
          </div>
          
          <div className="space-y-2">
            {column.leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
            {column.leads.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-8">
                No leads in this status
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedLead.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Email:</span>
                  <p className="text-gray-600">{selectedLead.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">Phone:</span>
                  <p className="text-gray-600">{selectedLead.phone || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">City:</span>
                  <p className="text-gray-600">{selectedLead.city || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <Badge className={getStatusBadgeColor(selectedLead.status)}>
                    {selectedLead.status}
                  </Badge>
                </div>
                {selectedLead.brand && (
                  <div>
                    <span className="font-medium">Brand:</span>
                    <p className="text-gray-600">{selectedLead.brand}</p>
                  </div>
                )}
                {selectedLead.vehicle && (
                  <div>
                    <span className="font-medium">Vehicle:</span>
                    <p className="text-gray-600">{selectedLead.vehicle}</p>
                  </div>
                )}
              </div>
              {selectedLead.remarks && (
                <div>
                  <span className="font-medium">Remarks:</span>
                  <p className="text-gray-600">{selectedLead.remarks}</p>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={() => onLeadClick(selectedLead)}>
                  View Full Details
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}