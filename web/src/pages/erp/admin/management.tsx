import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { InfoDot } from '@/components/dev/InfoDot';
import { Sliders, ShieldCheck, Mail, Bell, Scale, Settings2, HelpCircle } from 'lucide-react';

export default function ManagementPage() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [newLeadPush, setNewLeadPush] = useState(true);
  const [autoAssignment, setAutoAssignment] = useState(false);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Management Controls</h1>
          <InfoDot widgetId="admin.management.header" fallbackLabel="Management Portal Settings" />
        </div>
        <p className="text-muted-foreground mt-1">
          Configure organization-wide rules, territory allocations, alerts parameters, and regional sales configurations.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 max-w-2xl bg-slate-100 p-1">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> Alerts & Rules
          </TabsTrigger>
          <TabsTrigger value="territory" className="flex items-center gap-2">
            <Scale className="h-4 w-4" /> Territory Allocations
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> RBAC Matrix
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" /> System General
          </TabsTrigger>
        </TabsList>

        {/* Alerts & Rules tab */}
        <TabsContent value="notifications" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" /> Routing Rules & Notifications
                </CardTitle>
                <CardDescription>Configure automation parameters for lead generation alerts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h5 className="font-semibold text-sm text-slate-800">Territory Unassigned NSM Dispatch</h5>
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-[280px]">
                      Send immediate email dispatch to National Sales Manager (NSM) if an incoming lead territory has no allocated detailers or distributors.
                    </p>
                  </div>
                  <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
                </div>
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h5 className="font-semibold text-sm text-slate-800">Distributor Mobile Push Alerts</h5>
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-[280px]">
                      Notify regional distributors instantly when a customer lead is created or updated in their state.
                    </p>
                  </div>
                  <Switch checked={newLeadPush} onCheckedChange={setNewLeadPush} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-semibold text-sm text-slate-800">Auto-Assign Leads to Nearest Detailer</h5>
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-[280px]">
                      Use pincode geographic matching to automatically link incoming B2C leads to the closest approved detailer.
                    </p>
                  </div>
                  <Switch checked={autoAssignment} onCheckedChange={setAutoAssignment} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-primary" /> System Target Rules
                </CardTitle>
                <CardDescription>Establish regional goals and thresholds parameters.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Default Distributor Points Multiplier</label>
                  <div className="flex gap-2 items-center">
                    <span className="text-sm font-semibold text-slate-900 border rounded px-3 py-1.5 bg-slate-50">5 Points / Unit</span>
                    <Button variant="outline" size="sm">Modify Rule</Button>
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Default Retailer Points Multiplier</label>
                  <div className="flex gap-2 items-center">
                    <span className="text-sm font-semibold text-slate-900 border rounded px-3 py-1.5 bg-slate-50">10 Points / Unit</span>
                    <Button variant="outline" size="sm">Modify Rule</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Territory tab */}
        <TabsContent value="territory">
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" /> Territory & State Mapping
              </CardTitle>
              <CardDescription>Assign state jurisdictions and territory coordinates to Regional Sales Managers (RSMs).</CardDescription>
            </CardHeader>
            <CardContent className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                <HelpCircle className="h-6 w-6 text-slate-400" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Territory Map Controls Loading...</h4>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Territory configuration interface (mapping states list to user accounts) resides in User Management details form. Live state coordinate boundaries mapping controls are under deployment.
                </p>
              </div>
              <Button variant="outline">Learn More</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles tab */}
        <TabsContent value="roles">
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" /> Role-Based Access Control Matrix
              </CardTitle>
              <CardDescription>View system-wide permissions profiles map based on user roles hierarchy.</CardDescription>
            </CardHeader>
            <CardContent className="py-8">
              <div className="overflow-x-auto border rounded-md">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="p-3 font-semibold text-slate-700">System Role</th>
                      <th className="p-3 font-semibold text-slate-700">Leads</th>
                      <th className="p-3 font-semibold text-slate-700">Inventory</th>
                      <th className="p-3 font-semibold text-slate-700">Warranties</th>
                      <th className="p-3 font-semibold text-slate-700">Reward points</th>
                      <th className="p-3 font-semibold text-slate-700">Hierarchy Creation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { role: "Admin", leads: "Full Access", inv: "Full Access", war: "Full Access", rew: "Full Access", hc: "All Roles" },
                      { role: "National Sales Manager", leads: "Full Access", inv: "Hierarchy Read", war: "Hierarchy Read", rew: "Hierarchy Read", hc: "RSM, Dist, Partner, Rep" },
                      { role: "Regional Sales Manager", leads: "Territory Scoped", inv: "Territory Read", war: "Territory Read", rew: "Territory Read", hc: "Dist, Partner, Rep" },
                      { role: "Distributor", leads: "Organization Leads", inv: "Manage Own", war: "View Subordinate", rew: "Earn Points", hc: "Sub-users, Partners" },
                      { role: "Detailer (Retailer)", leads: "Assigned Only", inv: "View Own", war: "Register Warranties", rew: "Earn Points", hc: "End Customers" }
                    ].map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-800">{row.role}</td>
                        <td className="p-3 text-slate-600 text-xs">{row.leads}</td>
                        <td className="p-3 text-slate-600 text-xs">{row.inv}</td>
                        <td className="p-3 text-slate-600 text-xs">{row.war}</td>
                        <td className="p-3 text-slate-600 text-xs">{row.rew}</td>
                        <td className="p-3 text-slate-600 text-xs"><Badge variant="outline">{row.hc}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System general tab */}
        <TabsContent value="system">
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-slate-700" /> General Configurations
              </CardTitle>
              <CardDescription>Global variables and configuration settings parameters.</CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              General system configuration parameters sync automatically with the environment constants variables database. Settings can be updated via .env overrides.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
