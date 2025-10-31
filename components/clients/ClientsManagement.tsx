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
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Plus, Edit, Trash2, Save, X, Building2 } from 'lucide-react';
import { apiClientsService } from '@/lib/services/ApiClientsService';
import { toast } from 'sonner';
import { Client } from '@/types';
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

const CLIENT_STATUSES = [
  { value: 'ACTIVE', label: 'Active', variant: 'default' as const },
  { value: 'INACTIVE', label: 'Inactive', variant: 'secondary' as const },
  { value: 'SUSPENDED', label: 'Suspended', variant: 'destructive' as const },
];

export function ClientsManagement() {
  const [clients, setClients] = useState<Client[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [companyRegNo, setCompanyRegNo] = useState('');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [registrationDate, setRegistrationDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [remarks, setRemarks] = useState('');
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string }>({
    open: false,
    id: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const clientList = await apiClientsService.getClients();
      setClients(clientList);
    } catch (err) {
      console.error('Failed to load clients:', err);
    }
  };

  const handleSave = async () => {
    setError('');
    setIsLoading(true);

    try {
      if (editingClient) {
        await apiClientsService.updateClient(editingClient, {
          companyName,
          companyRegNo,
          address,
          contactPerson,
          emailAddress,
          phoneNumbers,
          status,
          registrationDate: new Date(registrationDate),
          remarks,
        });
        toast.success('Client updated successfully');
      } else {
        await apiClientsService.createClient({
          companyName,
          companyRegNo,
          address,
          contactPerson,
          emailAddress,
          phoneNumbers,
          status,
          registrationDate: new Date(registrationDate),
          remarks,
        });
        toast.success('Client created successfully');
      }

      handleCancel();
      loadClients();
    } catch (err: any) {
      setError(err.message || 'Failed to save client');
      toast.error(err.message || 'Failed to save client');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client.id);
    setCompanyName(client.companyName);
    setCompanyRegNo(client.companyRegNo || '');
    setAddress(client.address || '');
    setContactPerson(client.contactPerson);
    setEmailAddress(client.emailAddress);
    setPhoneNumbers(client.phoneNumbers);
    setStatus(client.status);
    setRegistrationDate(new Date(client.registrationDate).toISOString().split('T')[0]);
    setRemarks(client.remarks || '');
  };

  const handleCancel = () => {
    setEditingClient(null);
    setCompanyName('');
    setCompanyRegNo('');
    setAddress('');
    setContactPerson('');
    setEmailAddress('');
    setPhoneNumbers('');
    setStatus('ACTIVE');
    setRegistrationDate(new Date().toISOString().split('T')[0]);
    setRemarks('');
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClientsService.deleteClient(id);
      toast.success('Client deleted successfully');
      loadClients();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete client');
    }
    setDeleteDialog({ open: false, id: '' });
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      !searchTerm ||
      client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.clientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.emailAddress.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || client.status === statusFilter;

    return matchesSearch && matchesStatus && client.isActive;
  });

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {editingClient ? 'Edit Client' : 'Add New Client'}
          </CardTitle>
          <CardDescription>
            Manage client information and registration details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyRegNo">Registration Number</Label>
              <Input
                id="companyRegNo"
                value={companyRegNo}
                onChange={(e) => setCompanyRegNo(e.target.value)}
                placeholder="Company registration number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {CLIENT_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person *</Label>
              <Input
                id="contactPerson"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Contact person name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailAddress">Email Address *</Label>
              <Input
                id="emailAddress"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumbers">Phone Numbers *</Label>
              <Input
                id="phoneNumbers"
                value={phoneNumbers}
                onChange={(e) => setPhoneNumbers(e.target.value)}
                placeholder="+233 XX XXX XXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationDate">Registration Date *</Label>
              <Input
                id="registrationDate"
                type="date"
                value={registrationDate}
                onChange={(e) => setRegistrationDate(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full address"
              />
            </div>

            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Additional notes about the client"
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            {editingClient && (
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={
                isLoading ||
                !companyName ||
                !contactPerson ||
                !emailAddress ||
                !phoneNumbers
              }
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : editingClient ? 'Update' : 'Add Client'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clients List</CardTitle>
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <Input
                placeholder="Search by company name, client ID, contact person, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {CLIENT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client ID</TableHead>
                <TableHead>Company Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registration Date</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    {searchTerm || statusFilter
                      ? 'No clients match your search criteria'
                      : 'No clients yet. Add one above.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-mono text-sm">{client.clientId}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{client.companyName}</div>
                        {client.companyRegNo && (
                          <div className="text-sm text-muted-foreground">
                            Reg: {client.companyRegNo}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{client.contactPerson}</TableCell>
                    <TableCell className="text-sm">{client.emailAddress}</TableCell>
                    <TableCell className="text-sm">{client.phoneNumbers}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          CLIENT_STATUSES.find((s) => s.value === client.status)?.variant
                        }
                      >
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(client.registrationDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(client)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDialog({ open: true, id: client.id })}
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

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, id: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this client? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(deleteDialog.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
