'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Plus, Edit, Trash2, Save, X, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  useSalesRepresentatives,
  useValidateStakes,
  useCreateRepresentative,
  useUpdateRepresentative,
  useDeleteRepresentative,
} from '@/lib/hooks/useSalesRepresentatives';
import { useEmployees } from '@/lib/hooks/useEmployees';
import { useSalesEntry } from '@/lib/hooks/useSalesEntries';
import type {
  SalesRepresentative,
  CreateSalesRepresentativeRequest,
  ResourceType,
} from '@/types';

interface SalesRepresentativesFormProps {
  salesEntryId: string;
}

export function SalesRepresentativesForm({ salesEntryId }: SalesRepresentativesFormProps) {
  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    resourceType: 'SALES' as ResourceType,
    salesStake: 0,
    salesTarget: 0,
    commissionRate: 5,
  });

  // Queries
  const { data: salesEntry, isLoading: loadingSalesEntry } = useSalesEntry(salesEntryId);
  const { data: representatives = [], isLoading: loadingReps } = useSalesRepresentatives(salesEntryId);
  const { data: validation } = useValidateStakes(salesEntryId);
  const { data: employees = [] } = useEmployees({ status: 'ACTIVE' });

  // Mutations
  const createMutation = useCreateRepresentative();
  const updateMutation = useUpdateRepresentative();
  const deleteMutation = useDeleteRepresentative();

  // Calculate remaining stake
  const usedStake = representatives.reduce((sum, rep) => sum + Number(rep.salesStake), 0);
  const remainingStake = 100 - usedStake;

  // Auto-set remaining stake for new entries
  useEffect(() => {
    if (!isEditing && remainingStake > 0 && remainingStake < 100) {
      setFormData(prev => ({ ...prev, salesStake: remainingStake }));
    }
  }, [remainingStake, isEditing]);

  const handleSubmit = async () => {
    if (!formData.employeeId) {
      toast.error('Please select an employee');
      return;
    }

    if (formData.salesStake <= 0) {
      toast.error('Sales stake must be greater than 0');
      return;
    }

    if (formData.salesStake > remainingStake && !isEditing) {
      toast.error(`Sales stake cannot exceed remaining ${remainingStake}%`);
      return;
    }

    try {
      if (isEditing && editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: {
            resourceType: formData.resourceType,
            salesStake: formData.salesStake,
            salesTarget: formData.salesTarget,
            commissionRate: formData.commissionRate,
          },
        });
        setIsEditing(false);
        setEditingId(null);
      } else {
        await createMutation.mutateAsync({
          salesEntryId,
          employeeId: formData.employeeId,
          resourceType: formData.resourceType,
          salesStake: formData.salesStake,
          salesTarget: formData.salesTarget,
          commissionRate: formData.commissionRate,
        });
      }

      // Reset form
      setFormData({
        employeeId: '',
        resourceType: 'SALES',
        salesStake: 0,
        salesTarget: 0,
        commissionRate: 5,
      });
    } catch (error) {
      console.error('Error saving representative:', error);
    }
  };

  const handleEdit = (rep: SalesRepresentative) => {
    setIsEditing(true);
    setEditingId(rep.id);
    setFormData({
      employeeId: rep.employeeId,
      resourceType: rep.resourceType,
      salesStake: Number(rep.salesStake),
      salesTarget: Number(rep.salesTarget),
      commissionRate: Number(rep.commissionRate),
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      employeeId: '',
      resourceType: 'SALES',
      salesStake: 0,
      salesTarget: 0,
      commissionRate: 5,
    });
  };

  const handleDelete = async (rep: SalesRepresentative) => {
    if (confirm('Are you sure you want to remove this representative?')) {
      await deleteMutation.mutateAsync({
        id: rep.id,
        salesEntryId: rep.salesEntryId,
      });
    }
  };

  if (loadingSalesEntry) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p>Loading sales entry...</p>
        </CardContent>
      </Card>
    );
  }

  if (!salesEntry) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Sales entry not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Main Form Area */}
      <div className="flex-1 space-y-6">
        {/* Sales Information Display */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sales Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground w-32">Total sales</Label>
                <Input 
                  value={Number(salesEntry.salesValue).toFixed(2)} 
                  readOnly 
                  className="bg-gray-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Employment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground w-32">Employee ID</Label>
              <Select
                value={formData.employeeId}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, employeeId: value }));
                  const emp = employees.find((e: any) => e.id === value);
                  if (emp) {
                    // Auto-fill employee name
                  }
                }}
                disabled={isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.employeeId} - {emp.firstName} {emp.surname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground w-32">Employee name</Label>
              <Input 
                value={formData.employeeId ? employees.find((e: any) => e.id === formData.employeeId)?.firstName + ' ' + employees.find((e: any) => e.id === formData.employeeId)?.surname : ''} 
                readOnly 
                className="bg-gray-50"
              />
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground w-32">Status</Label>
              <Input value="Active" readOnly className="bg-gray-50" />
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground w-32">Sales target</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.salesTarget}
                onChange={(e) => setFormData(prev => ({ ...prev, salesTarget: parseFloat(e.target.value) || 0 }))}
                placeholder="Default"
              />
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground w-32">Commission rate</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.commissionRate}
                onChange={(e) => setFormData(prev => ({ ...prev, commissionRate: parseFloat(e.target.value) || 0 }))}
                placeholder="5.0%"
              />
            </div>
          </CardContent>
        </Card>

        {/* Resource Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resource Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground w-32">Resource type</Label>
              <Select
                value={formData.resourceType}
                onValueChange={(value: ResourceType) => setFormData(prev => ({ ...prev, resourceType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SALES">Sales</SelectItem>
                  <SelectItem value="SUPPORT">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground w-32">Sales stake</Label>
              <div className="flex-1 flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.salesStake}
                  onChange={(e) => setFormData(prev => ({ ...prev, salesStake: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.0%"
                  className="w-24"
                />
                <Progress value={usedStake} className="flex-1 h-6" />
                <span className="text-sm font-medium">{usedStake.toFixed(1)}%</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground w-32">Relevant sales</Label>
              <Input
                type="text"
                value={((Number(salesEntry.salesValue) * formData.salesStake) / 100).toFixed(2)}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Representatives Table */}
        <Card>
          <CardContent className="p-0">
            {loadingReps ? (
              <p className="text-center py-4">Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sales target</TableHead>
                    <TableHead>Comm. rate</TableHead>
                    <TableHead>Res type</TableHead>
                    <TableHead>Sales stake</TableHead>
                    <TableHead>Relevant sales</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {representatives.map((rep, index) => (
                    <TableRow key={rep.id} className={index === 0 ? 'bg-blue-50' : ''}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {rep.employee?.employeeId}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {rep.employee?.firstName} {rep.employee?.surname}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">Active</Badge>
                      </TableCell>
                      <TableCell>{Number(rep.salesTarget).toFixed(1)}</TableCell>
                      <TableCell>{Number(rep.commissionRate).toFixed(1)}%</TableCell>
                      <TableCell>
                        <Badge variant={rep.resourceType === 'SALES' ? 'default' : 'secondary'} className="text-xs">
                          {rep.resourceType}
                        </Badge>
                      </TableCell>
                      <TableCell>{Number(rep.salesStake).toFixed(1)}%</TableCell>
                      <TableCell>{Number(rep.relevantSales).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(rep)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Fill empty rows */}
                  {Array.from({ length: Math.max(0, 5 - representatives.length) }).map((_, index) => (
                    <TableRow key={`empty-${index}`}>
                      <TableCell colSpan={9} className="h-12"></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Side Buttons */}
      <div className="w-48 space-y-3">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            ←
          </Button>
          <Input value="1" className="w-16 h-8 text-center" readOnly />
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            →
          </Button>
        </div>

        <Button 
          className="w-full bg-indigo-600 hover:bg-indigo-700"
          onClick={() => {
            setIsEditing(false);
            setEditingId(null);
            setFormData({
              employeeId: '',
              resourceType: 'SALES',
              salesStake: remainingStake,
              salesTarget: 0,
              commissionRate: 5,
            });
          }}
        >
          New Split
        </Button>

        <Button 
          className="w-full bg-indigo-600 hover:bg-indigo-700"
          onClick={handleSubmit}
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {isEditing ? 'Update' : 'Enter'}
        </Button>

        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleCancel}
        >
          Clear
        </Button>

        {isEditing && (
          <Button 
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
          >
            Update
          </Button>
        )}

        <Button 
          variant="destructive" 
          className="w-full"
          onClick={() => {
            if (editingId) {
              const rep = representatives.find(r => r.id === editingId);
              if (rep) handleDelete(rep);
            }
          }}
          disabled={!editingId}
        >
          Delete
        </Button>

        {/* Validation Alert */}
        {validation && !validation.isValid && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Stakes must total 100%
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
