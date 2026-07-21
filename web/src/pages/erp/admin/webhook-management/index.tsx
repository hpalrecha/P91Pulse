import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Settings, Trash2, Eye, Copy, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InfoDot } from "@/components/dev/InfoDot";

interface WebhookConfig {
  id: number;
  name: string;
  description: string;
  webhookUrl: string;
  apiKey: string;
  secretToken: string;
  isActive: boolean;
  triggers: string[];
  headers: Record<string, string>;
  retryAttempts: number;
  createdAt: string;
  lastTriggered: string | null;
}

interface WebhookDelivery {
  id: number;
  configurationId: number;
  trigger: string;
  payload: any;
  response: any;
  httpStatus: number | null;
  success: boolean;
  errorMessage: string | null;
  attempt: number;
  deliveredAt: string;
}

const AVAILABLE_TRIGGERS = [
  { value: 'lead_created', label: 'Lead Created', description: 'Triggered when a new lead is created' },
  { value: 'lead_updated', label: 'Lead Updated', description: 'Triggered when lead information is updated' },
  { value: 'status_changed', label: 'Status Changed', description: 'Triggered when lead status changes' },
  { value: 'lead_assigned', label: 'Lead Assigned', description: 'Triggered when lead is assigned to detailer' },
  { value: 'lead_converted', label: 'Lead Converted', description: 'Triggered when lead becomes customer' }
];

export default function WebhookManagement() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookConfig | null>(null);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    webhookUrl: '',
    secretToken: '',
    isActive: true,
    triggers: [] as string[],
    headers: {} as Record<string, string>,
    retryAttempts: 3
  });

  useEffect(() => {
    fetchWebhooks();
    fetchDeliveries();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const response = await fetch('/api/erp/webhook-configurations');
      if (response.ok) {
        const data = await response.json();
        setWebhooks(data);
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    }
  };

  const fetchDeliveries = async () => {
    try {
      const response = await fetch('/api/erp/webhook-deliveries');
      if (response.ok) {
        const data = await response.json();
        setDeliveries(data);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/erp/webhook-configurations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newWebhook = await response.json();
        setWebhooks([...webhooks, newWebhook]);
        setIsCreateDialogOpen(false);
        resetForm();
        toast({
          title: 'Webhook created',
          description: 'Webhook configuration has been created successfully.'
        });
      } else {
        throw new Error('Failed to create webhook');
      }
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast({
        title: 'Error',
        description: 'Failed to create webhook configuration.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWebhook = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/erp/webhook-configurations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        const updatedWebhook = await response.json();
        setWebhooks(webhooks.map(w => w.id === id ? updatedWebhook : w));
        toast({
          title: `Webhook ${isActive ? 'enabled' : 'disabled'}`,
          description: `Webhook configuration has been ${isActive ? 'enabled' : 'disabled'}.`
        });
      }
    } catch (error) {
      console.error('Error updating webhook:', error);
      toast({
        title: 'Error',
        description: 'Failed to update webhook configuration.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteWebhook = async (id: number) => {
    try {
      const response = await fetch(`/api/erp/webhook-configurations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWebhooks(webhooks.filter(w => w.id !== id));
        toast({
          title: 'Webhook deleted',
          description: 'Webhook configuration has been deleted.'
        });
      }
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete webhook configuration.',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      webhookUrl: '',
      secretToken: '',
      isActive: true,
      triggers: [],
      headers: {},
      retryAttempts: 3
    });
  };

  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'p91_';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'API key copied to clipboard.'
    });
  };

  const handleTriggerChange = (trigger: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        triggers: [...prev.triggers, trigger]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        triggers: prev.triggers.filter(t => t !== trigger)
      }));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Webhook Management</h1>
          <p className="text-gray-500 mt-1">Configure third-party integrations and API access</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Webhook Configuration</DialogTitle>
              <DialogDescription>
                Set up a new third-party integration for receiving lead updates.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateWebhook} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My CRM Integration"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="retryAttempts">Retry Attempts</Label>
                  <Input
                    id="retryAttempts"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.retryAttempts}
                    onChange={(e) => setFormData(prev => ({ ...prev, retryAttempts: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Integration with external CRM system"
                />
              </div>
              
              <div>
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))}
                  placeholder="https://api.example.com/webhooks/p91-leads"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="secretToken">Secret Token (Optional)</Label>
                <Input
                  id="secretToken"
                  value={formData.secretToken}
                  onChange={(e) => setFormData(prev => ({ ...prev, secretToken: e.target.value }))}
                  placeholder="webhook_secret_key"
                />
                <p className="text-sm text-gray-500 mt-1">Used for webhook signature verification</p>
              </div>
              
              <div>
                <Label>Trigger Events</Label>
                <div className="space-y-2 mt-2">
                  {AVAILABLE_TRIGGERS.map((trigger) => (
                    <div key={trigger.value} className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id={trigger.value}
                        checked={formData.triggers.includes(trigger.value)}
                        onChange={(e) => handleTriggerChange(trigger.value, e.target.checked)}
                        className="mt-1"
                      />
                      <div>
                        <label htmlFor={trigger.value} className="text-sm font-medium cursor-pointer">
                          {trigger.label}
                        </label>
                        <p className="text-xs text-gray-500">{trigger.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Webhook'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="configurations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configurations">Webhook Configurations</TabsTrigger>
          <TabsTrigger value="deliveries">Delivery Logs</TabsTrigger>
          <TabsTrigger value="documentation">API Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-4">
          <div className="grid gap-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {webhook.name}
                        <Badge variant={webhook.isActive ? "default" : "secondary"}>
                          {webhook.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{webhook.description}</CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(webhook.apiKey)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleWebhook(webhook.id, !webhook.isActive)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteWebhook(webhook.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Webhook URL:</p>
                      <p className="text-gray-600 break-all">{webhook.webhookUrl}</p>
                    </div>
                    <div>
                      <p className="font-medium">API Key:</p>
                      <p className="text-gray-600 font-mono">{webhook.apiKey.substring(0, 20)}...</p>
                    </div>
                    <div>
                      <p className="font-medium">Triggers:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {webhook.triggers.map((trigger) => (
                          <Badge key={trigger} variant="outline" className="text-xs">
                            {trigger.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">Last Triggered:</p>
                      <p className="text-gray-600">
                        {webhook.lastTriggered 
                          ? new Date(webhook.lastTriggered).toLocaleString() 
                          : 'Never'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deliveries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center">Recent Webhook Deliveries</span>
                <InfoDot widgetId="admin.webhookManagement.deliveries" fallbackLabel="Recent Webhook Deliveries" />
              </CardTitle>
              <CardDescription>Monitor webhook delivery status and responses</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Configuration</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>HTTP Status</TableHead>
                    <TableHead>Attempt</TableHead>
                    <TableHead>Delivered At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell>
                        {webhooks.find(w => w.id === delivery.configurationId)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{delivery.trigger}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={delivery.success ? "default" : "destructive"}>
                          {delivery.success ? "Success" : "Failed"}
                        </Badge>
                      </TableCell>
                      <TableCell>{delivery.httpStatus || 'N/A'}</TableCell>
                      <TableCell>{delivery.attempt}</TableCell>
                      <TableCell>
                        {new Date(delivery.deliveredAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Set selected delivery for viewing details
                            setIsDeliveryDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center">Third-Party API Documentation</span>
                <InfoDot widgetId="admin.webhookManagement.documentation" fallbackLabel="API Documentation" />
              </CardTitle>
              <CardDescription>How to integrate with P91 ERP lead management system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Authentication</h3>
                <p className="text-sm text-gray-600 mb-2">
                  All API requests must include the API key in the header:
                </p>
                <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
                  X-API-Key: your_api_key_here
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Create Lead for Detailer</h3>
                <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
                  POST /api/third-party/leads/detailer
                </div>
                <div className="bg-gray-50 p-3 rounded-md mt-2 text-sm">
                  <pre>{`{
  "name": "John Doe",
  "phone": "9876543210",
  "email": "john@example.com",
  "city": "Mumbai",
  
  // Use any ONE of these to identify the detailer:
  "detailer_username": "detailer1",
  "detailer_email": "detailer@example.com",
  "detailer_phone": "9876543210",
  
  "external_id": "crm_lead_123",
  "external_source": "My CRM System"
}`}</pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Create Lead for Distributor</h3>
                <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
                  POST /api/third-party/leads/distributor
                </div>
                <div className="bg-gray-50 p-3 rounded-md mt-2 text-sm">
                  <pre>{`{
  "name": "Jane Smith",
  "phone": "9876543211",
  "email": "jane@example.com",
  "city": "Delhi",
  
  // Use any ONE of these to identify the distributor:
  "distributor_username": "distributor1",
  "distributor_email": "distributor@example.com", 
  "distributor_phone": "9876543210",
  
  "external_id": "crm_lead_124"
}`}</pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Get Available Users</h3>
                <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
                  GET /api/third-party/users
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Returns list of active detailers and distributors for reference.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Webhook Payload</h3>
                <p className="text-sm text-gray-600 mb-2">
                  When lead status changes, P91 ERP will send data to your webhook URL:
                </p>
                <div className="bg-gray-50 p-3 rounded-md text-sm">
                  <pre>{`{
  "trigger": "status_changed",
  "lead": {
    "id": 123,
    "external_id": "crm_lead_123",
    "name": "John Doe",
    "phone": "9876543210",
    "status": "converted",
    "assigned_to": {
      "detailer_id": 5,
      "distributor_id": 3
    }
  },
  "timestamp": "2025-07-14T11:40:00.000Z",
  "signature": "sha256=abc123..."
}`}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}