'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { apiFixedAssetsService } from '@/lib/services/ApiFixedAssetsService';
import { apiAccountService } from '@/lib/services/ApiAccountService';
import type { FixedAsset, HolderAccount } from '@/types';

interface DisposalFormData {
  assetId: string;
  disposalDate: string;
  disposalValue: number;
  bankAccountId: string;
  remarks: string;
}

export function FixedAssetDisposalForm() {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [bankAccounts, setBankAccounts] = useState<HolderAccount[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);
  const [formData, setFormData] = useState<DisposalFormData>({
    assetId: '',
    disposalDate: new Date().toISOString().split('T')[0],
    disposalValue: 0,
    bankAccountId: '',
    remarks: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const allAssets = await apiFixedAssetsService.getActiveFixedAssets();
      setAssets(allAssets);

      const hierarchy = await apiAccountService.getAccountHierarchy();
      const banks: HolderAccount[] = [];
      hierarchy.primary.forEach((primary) => {
        hierarchy.secondary
          .filter((sec) => sec.primaryAccountId === primary.id)
          .forEach((secondary) => {
            hierarchy.holder
              .filter((holder) => holder.secondaryAccountId === secondary.id)
              .forEach((holder) => {
                if (holder.name.toLowerCase().includes('bank')) {
                  banks.push(holder);
                }
              });
          });
      });
      setBankAccounts(banks);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssetSelect = async (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    if (asset) {
      setSelectedAsset(asset);
      setFormData((prev) => ({
        ...prev,
        assetId,
        disposalValue: Number(asset.netBookValue),
      }));
    }
  };

  const handleClear = () => {
    setFormData({
      assetId: '',
      disposalDate: new Date().toISOString().split('T')[0],
      disposalValue: 0,
      bankAccountId: '',
      remarks: '',
    });
    setSelectedAsset(null);
    toast.info('Form cleared');
  };

  const handleEnter = async () => {
    if (!selectedAsset) {
      toast.error('Please select an asset');
      return;
    }

    if (!formData.bankAccountId) {
      toast.error('Please select a bank account');
      return;
    }

    if (formData.disposalValue < 0) {
      toast.error('Disposal value cannot be negative');
      return;
    }

    setLoading(true);
    try {
      const result = await apiFixedAssetsService.disposeAsset(selectedAsset.id, {
        disposalDate: new Date(formData.disposalDate),
        disposalValue: formData.disposalValue,
        bankAccountId: formData.bankAccountId,
        remarks: formData.remarks,
      });

      const gainLoss = result.gainLoss;
      const message = gainLoss > 0 
        ? `Asset disposed successfully with a gain of ${Math.abs(gainLoss).toFixed(2)}`
        : gainLoss < 0
        ? `Asset disposed successfully with a loss of ${Math.abs(gainLoss).toFixed(2)}`
        : 'Asset disposed successfully';
      
      toast.success(message);
      handleClear();
      await loadData();
    } catch (error: any) {
      console.error('Error recording disposal:', error);
      toast.error(error.message || 'Failed to record disposal');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = () => {
    toast.success('Disposal updated');
  };

  const handleDelete = () => {
    toast.error('Disposal deleted');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Disposal Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Asset Information */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Asset Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="refNumber">Reference number</Label>
              <Select value={formData.assetId} onValueChange={handleAssetSelect}>
                <SelectTrigger id="refNumber">
                  <SelectValue placeholder="Select reference" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.assetCode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={selectedAsset?.description || ''}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assetCategory">Asset category</Label>
              <Input
                id="assetCategory"
                value={selectedAsset?.category || ''}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assetClass">Asset class</Label>
              <Input
                id="assetClass"
                value={selectedAsset?.status || ''}
                readOnly
                className="bg-muted"
              />
            </div>
          </CardContent>
        </Card>

        {/* Asset Details and Valuation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Asset Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="acquisitionDate">Acquisition date</Label>
                <div className="relative">
                  <Input
                    id="acquisitionDate"
                    type="date"
                    value={
                      selectedAsset
                        ? new Date(selectedAsset.acquisitionDate).toISOString().split('T')[0]
                        : ''
                    }
                    readOnly
                    className="bg-muted"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="residualValue">Residual value</Label>
                <Input
                  id="residualValue"
                  type="number"
                  value={selectedAsset ? Number(selectedAsset.residualValue).toFixed(2) : '0.00'}
                  readOnly
                  className="bg-muted"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depreciationRate">Depreciation rate</Label>
                <Input
                  id="depreciationRate"
                  type="number"
                  value={selectedAsset ? Number(selectedAsset.depreciationRate).toFixed(2) : '0.00'}
                  readOnly
                  className="bg-muted"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accDepreciation">Acc depreciation</Label>
                <Input
                  id="accDepreciation"
                  type="number"
                  value={selectedAsset ? Number(selectedAsset.accumulatedDepreciation).toFixed(2) : '0.00'}
                  readOnly
                  className="bg-muted"
                  placeholder="0.00"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Valuation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="valueCost">Value at cost</Label>
                <Input
                  id="valueCost"
                  type="number"
                  value={selectedAsset ? Number(selectedAsset.valueAtCost).toFixed(2) : '0.00'}
                  readOnly
                  className="bg-muted"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depreciationType">Depreciation type</Label>
                <Input
                  id="depreciationType"
                  value={selectedAsset?.depreciationType || ''}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usefulLife">Useful life</Label>
                <Input
                  id="usefulLife"
                  type="number"
                  value={selectedAsset?.usefulLife || '0'}
                  readOnly
                  className="bg-muted"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="netBookValue">Net book value</Label>
                <Input
                  id="netBookValue"
                  type="number"
                  value={selectedAsset ? Number(selectedAsset.netBookValue).toFixed(2) : '0.00'}
                  readOnly
                  className="bg-muted"
                  placeholder="0.00"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Disposal Information */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Disposal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="disposalDate">Disposal date</Label>
                <div className="relative">
                  <Input
                    id="disposalDate"
                    type="date"
                    value={formData.disposalDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        disposalDate: e.target.value,
                      }))
                    }
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="disposalValue">Disposal value</Label>
                <Input
                  id="disposalValue"
                  type="number"
                  placeholder="0.00"
                  value={formData.disposalValue}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      disposalValue: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Account */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Bank Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="bankAccount">Bank account</Label>
              <Select
                value={formData.bankAccountId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, bankAccountId: value }))
                }
              >
                <SelectTrigger id="bankAccount">
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Remarks */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Remarks</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              id="remarks"
              placeholder="Enter any remarks"
              value={formData.remarks}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, remarks: e.target.value }))
              }
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
          <Button variant="outline" onClick={handleEnter} disabled={loading}>
            {loading ? 'Processing...' : 'Enter'}
          </Button>
          <Button onClick={handleUpdate}>Update</Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
