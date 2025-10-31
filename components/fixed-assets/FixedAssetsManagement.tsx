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
import { AlertCircle, Plus, Edit, Trash2, Save, X, TrendingDown, DollarSign } from 'lucide-react';
import { apiFixedAssetsService } from '@/lib/services/ApiFixedAssetsService';
import { apiAccountService } from '@/lib/services/ApiAccountService';
import { toast } from 'sonner';
import { FixedAsset, HolderAccount } from '@/types';
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

// Asset categories will be loaded dynamically from Non-Current Assets secondary accounts

const DEPRECIATION_TYPES = [
  { value: 'STRAIGHT_LINE', label: 'Straight Line' },
  { value: 'DECLINING_BALANCE', label: 'Declining Balance' },
  { value: 'UNITS_OF_PRODUCTION', label: 'Units of Production' },
];

const ASSET_STATUSES = [
  { value: 'ACTIVE', label: 'Active', variant: 'default' as const },
  { value: 'DISPOSED', label: 'Disposed', variant: 'secondary' as const },
  { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance', variant: 'outline' as const },
  { value: 'RETIRED', label: 'Retired', variant: 'destructive' as const },
];

export function FixedAssetsManagement() {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [accounts, setAccounts] = useState<HolderAccount[]>([]);
  const [assetCategories, setAssetCategories] = useState<Array<{id: string, name: string, code: string}>>([]);
  
  // Form state
  const [acquisitionDate, setAcquisitionDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [category, setCategory] = useState<string>('');
  const [assetClass, setAssetClass] = useState('');
  const [description, setDescription] = useState('');
  const [valueAtCost, setValueAtCost] = useState('');
  const [usefulLife, setUsefulLife] = useState('');
  const [depreciationRate, setDepreciationRate] = useState('');
  const [depreciationType, setDepreciationType] = useState<string>('');
  const [residualValue, setResidualValue] = useState('');
  const [primaryAccountId, setPrimaryAccountId] = useState('');
  const [secondaryAccountId, setSecondaryAccountId] = useState('');
  const [holderAccountId, setHolderAccountId] = useState('');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [remarks, setRemarks] = useState('');
  const [editingAsset, setEditingAsset] = useState<string | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string }>({
    open: false,
    id: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Summary stats
  const [totalValues, setTotalValues] = useState({
    totalCost: 0,
    totalDepreciation: 0,
    totalNetBookValue: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [assetList, values, accountHierarchy, categories] = await Promise.all([
        apiFixedAssetsService.getFixedAssets(),
        apiFixedAssetsService.getTotalValues(),
        apiAccountService.getAccountHierarchy(),
        apiFixedAssetsService.getNonCurrentAssetCategories(),
      ]);
      setAssets(assetList);
      setAccounts(accountHierarchy.holder);
      setTotalValues(values);
      setAssetCategories(categories);
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load data');
    }
  };

  const handleSave = async () => {
    setError('');
    setIsLoading(true);

    try {
      if (editingAsset) {
        await apiFixedAssetsService.updateFixedAsset(editingAsset, {
          acquisitionDate: new Date(acquisitionDate),
          referenceNumber,
          category: category as any,
          assetClass,
          description,
          valueAtCost: parseFloat(valueAtCost),
          usefulLife: parseInt(usefulLife),
          depreciationRate: parseFloat(depreciationRate),
          depreciationType: depreciationType as any,
          residualValue: parseFloat(residualValue),
          primaryAccountId: primaryAccountId || undefined,
          secondaryAccountId: category || secondaryAccountId || undefined,
          holderAccountId: holderAccountId || undefined,
          status: status as any,
          remarks,
        });
        toast.success('Fixed asset updated successfully');
      } else {
        await apiFixedAssetsService.createFixedAsset({
          acquisitionDate: new Date(acquisitionDate),
          referenceNumber,
          category: category as any,
          assetClass,
          description,
          valueAtCost: parseFloat(valueAtCost),
          usefulLife: parseInt(usefulLife),
          depreciationRate: parseFloat(depreciationRate),
          depreciationType: depreciationType as any,
          residualValue: parseFloat(residualValue),
          primaryAccountId: primaryAccountId || undefined,
          secondaryAccountId: category || secondaryAccountId || undefined,
          holderAccountId: holderAccountId || undefined,
          status: status as any,
          remarks,
        });
        toast.success('Fixed asset created successfully');
      }

      handleCancel();
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save fixed asset');
      toast.error(err.message || 'Failed to save fixed asset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (asset: FixedAsset) => {
    setEditingAsset(asset.id);
    setAcquisitionDate(new Date(asset.acquisitionDate).toISOString().split('T')[0]);
    setReferenceNumber(asset.referenceNumber || '');
    setCategory(asset.category);
    setAssetClass(asset.assetClass || '');
    setDescription(asset.description);
    setValueAtCost(Number(asset.valueAtCost).toString());
    setUsefulLife(asset.usefulLife.toString());
    setDepreciationRate(Number(asset.depreciationRate).toString());
    setDepreciationType(asset.depreciationType);
    setResidualValue(Number(asset.residualValue).toString());
    setPrimaryAccountId(asset.primaryAccountId || '');
    setSecondaryAccountId(asset.secondaryAccountId || '');
    setHolderAccountId(asset.holderAccountId || '');
    setStatus(asset.status);
    setRemarks(asset.remarks || '');
  };

  const handleCancel = () => {
    setEditingAsset(null);
    setAcquisitionDate(new Date().toISOString().split('T')[0]);
    setReferenceNumber('');
    setCategory('');
    setAssetClass('');
    setDescription('');
    setValueAtCost('');
    setUsefulLife('');
    setDepreciationRate('');
    setDepreciationType('');
    setResidualValue('');
    setPrimaryAccountId('');
    setSecondaryAccountId('');
    setHolderAccountId('');
    setStatus('ACTIVE');
    setRemarks('');
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFixedAssetsService.deleteFixedAsset(id);
      toast.success('Fixed asset deleted successfully');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete fixed asset');
    }
    setDeleteDialog({ open: false, id: '' });
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      !searchTerm ||
      asset.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !categoryFilter || asset.category === categoryFilter;
    const matchesStatus = !statusFilter || asset.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus && asset.isActive;
  });

  const formatCurrency = (amount: number) => {
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValues.totalCost)}</div>
            <p className="text-xs text-muted-foreground">Original acquisition cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accumulated Depreciation</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValues.totalDepreciation)}</div>
            <p className="text-xs text-muted-foreground">Total depreciation to date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Book Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValues.totalNetBookValue)}</div>
            <p className="text-xs text-muted-foreground">Current asset value</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {editingAsset ? 'Edit Fixed Asset' : 'Add New Fixed Asset'}
          </CardTitle>
          <CardDescription>
            Manage fixed asset information and depreciation details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="acquisitionDate">Acquisition Date *</Label>
              <Input
                id="acquisitionDate"
                type="date"
                value={acquisitionDate}
                onChange={(e) => setAcquisitionDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referenceNumber">Reference Number</Label>
              <Input
                id="referenceNumber"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Optional reference"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {assetCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} ({cat.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assetClass">Asset Class</Label>
              <Input
                id="assetClass"
                value={assetClass}
                onChange={(e) => setAssetClass(e.target.value)}
                placeholder="Optional classification"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Asset description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valueAtCost">Value at Cost *</Label>
              <Input
                id="valueAtCost"
                type="number"
                step="0.01"
                value={valueAtCost}
                onChange={(e) => setValueAtCost(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usefulLife">Useful Life (years) *</Label>
              <Input
                id="usefulLife"
                type="number"
                value={usefulLife}
                onChange={(e) => setUsefulLife(e.target.value)}
                placeholder="Years"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="depreciationRate">Depreciation Rate (%) *</Label>
              <Input
                id="depreciationRate"
                type="number"
                step="0.01"
                value={depreciationRate}
                onChange={(e) => setDepreciationRate(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="depreciationType">Depreciation Type *</Label>
              <Select value={depreciationType} onValueChange={setDepreciationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {DEPRECIATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="residualValue">Residual Value *</Label>
              <Input
                id="residualValue"
                type="number"
                step="0.01"
                value={residualValue}
                onChange={(e) => setResidualValue(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Additional notes about the asset"
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            {editingAsset && (
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={
                isLoading ||
                !description ||
                !category ||
                !valueAtCost ||
                !usefulLife ||
                !depreciationRate ||
                !depreciationType ||
                !residualValue
              }
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : editingAsset ? 'Update' : 'Add Asset'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fixed Assets List</CardTitle>
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <Input
                placeholder="Search by asset code, description, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={categoryFilter || 'all'} onValueChange={(value) => setCategoryFilter(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {assetCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {ASSET_STATUSES.map((s) => (
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
                <TableHead>Asset Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Acquisition Date</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Depreciation</TableHead>
                <TableHead className="text-right">Net Book Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    {searchTerm || categoryFilter || statusFilter
                      ? 'No assets match your search criteria'
                      : 'No fixed assets yet. Add one above.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-mono text-sm">{asset.assetCode}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{asset.description}</div>
                        {asset.referenceNumber && (
                          <div className="text-sm text-muted-foreground">
                            Ref: {asset.referenceNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {assetCategories.find(c => c.id === asset.category)?.name || asset.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(asset.acquisitionDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(Number(asset.valueAtCost))}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(Number(asset.accumulatedDepreciation))}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      {formatCurrency(Number(asset.netBookValue))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          ASSET_STATUSES.find((s) => s.value === asset.status)?.variant
                        }
                      >
                        {asset.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(asset)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDialog({ open: true, id: asset.id })}
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
            <AlertDialogTitle>Delete Fixed Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this fixed asset? This action cannot be undone.
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
