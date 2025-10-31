'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { apiServicesService } from '@/lib/services/ApiServicesService';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServiceLine, Service, TeamLeader } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function ServicesManagement() {
  // Service Lines State
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [serviceLineName, setServiceLineName] = useState('');
  const [serviceLineDescription, setServiceLineDescription] = useState('');
  const [editingServiceLine, setEditingServiceLine] = useState<string | null>(null);

  // Services State
  const [services, setServices] = useState<Service[]>([]);
  const [serviceName, setServiceName] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceLineId, setServiceLineId] = useState('');
  const [averageFee, setAverageFee] = useState('');
  const [remarks, setRemarks] = useState('');
  const [teamLeaderId, setTeamLeaderId] = useState('');
  const [editingService, setEditingService] = useState<string | null>(null);

  // Team Leaders State
  const [teamLeaders, setTeamLeaders] = useState<TeamLeader[]>([]);

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; id: string }>({
    open: false,
    type: '',
    id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [lines, servs, leaders] = await Promise.all([
        apiServicesService.getServiceLines(),
        apiServicesService.getServices(),
        apiServicesService.getTeamLeaders(),
      ]);
      setServiceLines(lines);
      setServices(servs);
      setTeamLeaders(leaders);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  // ==================== Service Lines ====================

  const handleSaveServiceLine = async () => {
    setError('');
    setIsLoading(true);

    try {
      if (editingServiceLine) {
        await apiServicesService.updateServiceLine(editingServiceLine, {
          name: serviceLineName,
          description: serviceLineDescription,
        });
        toast.success('Service line updated successfully');
      } else {
        await apiServicesService.createServiceLine({
          name: serviceLineName,
          description: serviceLineDescription,
        });
        toast.success('Service line created successfully');
      }

      handleCancelServiceLine();
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save service line');
      toast.error(err.message || 'Failed to save service line');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditServiceLine = (line: ServiceLine) => {
    setEditingServiceLine(line.id);
    setServiceLineName(line.name);
    setServiceLineDescription(line.description || '');
  };

  const handleCancelServiceLine = () => {
    setEditingServiceLine(null);
    setServiceLineName('');
    setServiceLineDescription('');
  };

  const handleDeleteServiceLine = async (id: string) => {
    try {
      await apiServicesService.deleteServiceLine(id);
      toast.success('Service line deleted successfully');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete service line');
    }
    setDeleteDialog({ open: false, type: '', id: '' });
  };

  // ==================== Services ====================

  const handleSaveService = async () => {
    setError('');
    setIsLoading(true);

    try {
      if (editingService) {
        await apiServicesService.updateService(editingService, {
          name: serviceName,
          description: serviceDescription,
          serviceLineId,
          averageFee: parseFloat(averageFee),
          remarks,
          teamLeaderId: teamLeaderId || undefined,
        });
        toast.success('Service updated successfully');
      } else {
        await apiServicesService.createService({
          name: serviceName,
          description: serviceDescription,
          serviceLineId,
          averageFee: parseFloat(averageFee),
          remarks,
          teamLeaderId: teamLeaderId || undefined,
        });
        toast.success('Service created successfully');
      }

      handleCancelService();
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save service');
      toast.error(err.message || 'Failed to save service');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service.id);
    setServiceName(service.name);
    setServiceDescription(service.description);
    setServiceLineId(service.serviceLineId);
    setAverageFee(service.averageFee.toString());
    setRemarks(service.remarks || '');
    setTeamLeaderId(service.teamLeaderId || '');
  };

  const handleCancelService = () => {
    setEditingService(null);
    setServiceName('');
    setServiceDescription('');
    setServiceLineId('');
    setAverageFee('');
    setRemarks('');
    setTeamLeaderId('');
  };

  const handleDeleteService = async (id: string) => {
    try {
      await apiServicesService.deleteService(id);
      toast.success('Service deleted successfully');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete service');
    }
    setDeleteDialog({ open: false, type: '', id: '' });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="service-lines" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="service-lines">Service Lines</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        {/* Service Lines Tab */}
        <TabsContent value="service-lines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingServiceLine ? 'Edit Service Line' : 'Add Service Line'}
              </CardTitle>
              <CardDescription>
                Service lines are categories for grouping related services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceLineName">Name *</Label>
                  <Input
                    id="serviceLineName"
                    value={serviceLineName}
                    onChange={(e) => setServiceLineName(e.target.value)}
                    placeholder="e.g., Tax Services, Audit Services"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceLineDescription">Description</Label>
                  <Input
                    id="serviceLineDescription"
                    value={serviceLineDescription}
                    onChange={(e) => setServiceLineDescription(e.target.value)}
                    placeholder="Brief description"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                {editingServiceLine && (
                  <Button variant="outline" onClick={handleCancelServiceLine}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
                <Button onClick={handleSaveServiceLine} disabled={isLoading || !serviceLineName}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Saving...' : editingServiceLine ? 'Update' : 'Add'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Lines List</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceLines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No service lines yet. Add one above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    serviceLines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell className="font-medium">{line.name}</TableCell>
                        <TableCell>{line.description || '-'}</TableCell>
                        <TableCell>
                          <span className={line.isActive ? 'text-green-600' : 'text-gray-400'}>
                            {line.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditServiceLine(line)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setDeleteDialog({ open: true, type: 'serviceLine', id: line.id })
                              }
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{editingService ? 'Edit Service' : 'Add Service'}</CardTitle>
              <CardDescription>
                Define services offered under each service line
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceLine">Service Line *</Label>
                  <Select value={serviceLineId} onValueChange={setServiceLineId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service line" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceLines.filter(l => l.isActive).map((line) => (
                        <SelectItem key={line.id} value={line.id}>
                          {line.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceName">Service Name *</Label>
                  <Input
                    id="serviceName"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="e.g., Corporate Tax Filing"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="serviceDescription">Description *</Label>
                  <Textarea
                    id="serviceDescription"
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    placeholder="Detailed description of the service"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="averageFee">Average Fee (GHS) *</Label>
                  <Input
                    id="averageFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={averageFee}
                    onChange={(e) => setAverageFee(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamLeader">Team Leader</Label>
                  <Select value={teamLeaderId || 'none'} onValueChange={(value) => setTeamLeaderId(value === 'none' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team leader (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {teamLeaders.filter(l => l.isActive).map((leader) => (
                        <SelectItem key={leader.id} value={leader.id}>
                          {leader.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Additional notes or remarks"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                {editingService && (
                  <Button variant="outline" onClick={handleCancelService}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={handleSaveService}
                  disabled={isLoading || !serviceName || !serviceDescription || !serviceLineId || !averageFee}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Saving...' : editingService ? 'Update' : 'Add'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Services List</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Service Line</TableHead>
                    <TableHead className="text-right">Average Fee</TableHead>
                    <TableHead>Team Leader</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No services yet. Add one above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    services.map((service) => {
                      const line = serviceLines.find(l => l.id === service.serviceLineId);
                      const leader = teamLeaders.find(l => l.id === service.teamLeaderId);
                      return (
                        <TableRow key={service.id}>
                          <TableCell className="font-mono text-sm">{service.code}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{service.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {service.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{line?.name || '-'}</TableCell>
                          <TableCell className="text-right">
                            {formatAmount(service.averageFee)}
                          </TableCell>
                          <TableCell>{leader?.name || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditService(service)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setDeleteDialog({ open: true, type: 'service', id: service.id })
                                }
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deleteDialog.type === 'serviceLine' ? 'service line' : 'service'}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDialog.type === 'serviceLine') {
                  handleDeleteServiceLine(deleteDialog.id);
                } else {
                  handleDeleteService(deleteDialog.id);
                }
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
