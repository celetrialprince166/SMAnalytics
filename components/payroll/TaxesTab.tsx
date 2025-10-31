'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { apiPayrollService } from '@/lib/services/ApiPayrollService';
import type { TaxConfiguration } from '@/types';

export function TaxesTab() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [activeTaxConfig, setActiveTaxConfig] = useState<TaxConfiguration | null>(null);

  // Tax brackets
  const [firstRate, setFirstRate] = useState('0');
  const [next1Amount, setNext1Amount] = useState('');
  const [next1Rate, setNext1Rate] = useState('');
  const [next2Amount, setNext2Amount] = useState('');
  const [next2Rate, setNext2Rate] = useState('');
  const [next3Amount, setNext3Amount] = useState('');
  const [next3Rate, setNext3Rate] = useState('');
  const [next4Amount, setNext4Amount] = useState('');
  const [next4Rate, setNext4Rate] = useState('');
  const [next5Amount, setNext5Amount] = useState('');
  const [next5Rate, setNext5Rate] = useState('');
  const [remainderRate, setRemainderRate] = useState('');

  // Non-resident rate
  const [nonResidentRate, setNonResidentRate] = useState('');

  // Personal relief
  const [personalRelief, setPersonalRelief] = useState('');

  // Effective date
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);

  // Load active tax configuration on component mount
  useEffect(() => {
    loadActiveTaxConfiguration();
  }, []);

  const loadActiveTaxConfiguration = async () => {
    setIsLoadingData(true);
    try {
      const config = await apiPayrollService.getActiveTaxConfiguration();
      if (config) {
        setActiveTaxConfig(config);
        loadTaxConfigurationData(config);
      }
    } catch (error: any) {
      console.error('Error loading tax configuration:', error);
      toast.error('Failed to load tax configuration');
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadTaxConfigurationData = (config: TaxConfiguration) => {
    // Load effective date - handle both Date objects and ISO strings
    const effectiveDate = config.effectiveDate instanceof Date 
      ? config.effectiveDate 
      : new Date(config.effectiveDate);
    setEffectiveDate(effectiveDate.toISOString().split('T')[0]);
    
    // Load non-resident rate and personal relief
    setNonResidentRate(config.nonResidentRate.toString());
    setPersonalRelief(config.personalRelief.toString());
    
    // Load tax brackets
    const brackets = Array.isArray(config.brackets) ? config.brackets : [];
    if (brackets.length > 0) {
      const sortedBrackets = brackets.sort((a, b) => a.order - b.order);
      
      if (sortedBrackets[0]) setFirstRate(sortedBrackets[0].rate.toString());
      if (sortedBrackets[1]) {
        setNext1Amount(sortedBrackets[1].amount.toString());
        setNext1Rate(sortedBrackets[1].rate.toString());
      }
      if (sortedBrackets[2]) {
        setNext2Amount(sortedBrackets[2].amount.toString());
        setNext2Rate(sortedBrackets[2].rate.toString());
      }
      if (sortedBrackets[3]) {
        setNext3Amount(sortedBrackets[3].amount.toString());
        setNext3Rate(sortedBrackets[3].rate.toString());
      }
      if (sortedBrackets[4]) {
        setNext4Amount(sortedBrackets[4].amount.toString());
        setNext4Rate(sortedBrackets[4].rate.toString());
      }
      if (sortedBrackets[5]) {
        setNext5Amount(sortedBrackets[5].amount.toString());
        setNext5Rate(sortedBrackets[5].rate.toString());
      }
      if (sortedBrackets[6]) {
        setRemainderRate(sortedBrackets[6].rate.toString());
      }
    }
  };

  const handleClear = () => {
    setFirstRate('0');
    setNext1Amount('');
    setNext1Rate('');
    setNext2Amount('');
    setNext2Rate('');
    setNext3Amount('');
    setNext3Rate('');
    setNext4Amount('');
    setNext4Rate('');
    setNext5Amount('');
    setNext5Rate('');
    setRemainderRate('');
    setNonResidentRate('');
    setPersonalRelief('');
    setEffectiveDate(new Date().toISOString().split('T')[0]);
  };

  const handleSearch = async () => {
    await loadActiveTaxConfiguration();
    toast.info('Tax configuration reloaded');
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Validate required fields
      if (!effectiveDate) {
        toast.error('Effective date is required');
        return;
      }

      if (!nonResidentRate || !personalRelief) {
        toast.error('Non-resident rate and personal relief are required');
        return;
      }

      // Build tax brackets array
      const brackets = [];
      
      // First bracket (always 0% for first amount)
      if (firstRate) {
        brackets.push({
          order: 1,
          amount: 0,
          rate: parseFloat(firstRate) || 0,
        });
      }

      // Subsequent brackets
      if (next1Amount && next1Rate) {
        brackets.push({
          order: 2,
          amount: parseFloat(next1Amount),
          rate: parseFloat(next1Rate),
        });
      }
      if (next2Amount && next2Rate) {
        brackets.push({
          order: 3,
          amount: parseFloat(next2Amount),
          rate: parseFloat(next2Rate),
        });
      }
      if (next3Amount && next3Rate) {
        brackets.push({
          order: 4,
          amount: parseFloat(next3Amount),
          rate: parseFloat(next3Rate),
        });
      }
      if (next4Amount && next4Rate) {
        brackets.push({
          order: 5,
          amount: parseFloat(next4Amount),
          rate: parseFloat(next4Rate),
        });
      }
      if (next5Amount && next5Rate) {
        brackets.push({
          order: 6,
          amount: parseFloat(next5Amount),
          rate: parseFloat(next5Rate),
        });
      }
      if (remainderRate) {
        brackets.push({
          order: 7,
          amount: 0, // Remainder bracket
          rate: parseFloat(remainderRate),
        });
      }

      if (brackets.length === 0) {
        toast.error('At least one tax bracket is required');
        return;
      }

      // Create tax configuration
      const newConfig = await apiPayrollService.createTaxConfiguration(
        new Date(effectiveDate),
        brackets,
        parseFloat(nonResidentRate),
        parseFloat(personalRelief)
      );

      setActiveTaxConfig(newConfig);
      toast.success('Tax configuration saved successfully');
    } catch (err: any) {
      console.error('Error saving tax configuration:', err);
      toast.error(err.message || 'Failed to save tax configuration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Tax Configuration Details</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="effectiveDate">Effective Date</Label>
                    <Input 
                      id="effectiveDate" 
                      type="date" 
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted">
                      {activeTaxConfig ? (
                        <span className="text-green-600 font-medium">Active Configuration Loaded</span>
                      ) : (
                        <span className="text-muted-foreground">No Active Configuration</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Income Tax Table</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-[100px_1fr_1fr] gap-3 items-center">
                  <div></div>
                  <Label className="text-center font-semibold">Amount</Label>
                  <Label className="text-center font-semibold">Rate</Label>
                </div>
                
                <div className="grid grid-cols-[100px_1fr_1fr] gap-3 items-center">
                  <Label>First</Label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    className="bg-muted" 
                    readOnly 
                    value="0"
                  />
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={firstRate}
                    onChange={(e) => setFirstRate(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-[100px_1fr_1fr] gap-3 items-center">
                  <Label>Next</Label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={next1Amount}
                    onChange={(e) => setNext1Amount(e.target.value)}
                  />
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={next1Rate}
                    onChange={(e) => setNext1Rate(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-[100px_1fr_1fr] gap-3 items-center">
                  <Label>Next</Label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={next2Amount}
                    onChange={(e) => setNext2Amount(e.target.value)}
                  />
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={next2Rate}
                    onChange={(e) => setNext2Rate(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-[100px_1fr_1fr] gap-3 items-center">
                  <Label>Next</Label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={next3Amount}
                    onChange={(e) => setNext3Amount(e.target.value)}
                  />
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={next3Rate}
                    onChange={(e) => setNext3Rate(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-[100px_1fr_1fr] gap-3 items-center">
                  <Label>Next</Label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={next4Amount}
                    onChange={(e) => setNext4Amount(e.target.value)}
                  />
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={next4Rate}
                    onChange={(e) => setNext4Rate(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-[100px_1fr_1fr] gap-3 items-center">
                  <Label>Next</Label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={next5Amount}
                    onChange={(e) => setNext5Amount(e.target.value)}
                  />
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={next5Rate}
                    onChange={(e) => setNext5Rate(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-[100px_1fr_1fr] gap-3 items-center">
                  <Label>Remainder</Label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    className="bg-muted" 
                    readOnly 
                    value="0"
                  />
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={remainderRate}
                    onChange={(e) => setRemainderRate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Tax Rate - Non-Resident</h3>
              <div className="space-y-2 max-w-md">
                <Label htmlFor="nonResidentRate">Rate</Label>
                <Input 
                  id="nonResidentRate" 
                  type="number" 
                  placeholder="0.00" 
                  value={nonResidentRate}
                  onChange={(e) => setNonResidentRate(e.target.value)}
                />
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Income Tax Relief</h3>
              <div className="space-y-2 max-w-md">
                <Label htmlFor="personalRelief">Personal relief</Label>
                <Input 
                  id="personalRelief" 
                  type="number" 
                  placeholder="0.00" 
                  value={personalRelief}
                  onChange={(e) => setPersonalRelief(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button className="w-full min-w-[120px]" onClick={handleClear} disabled={isLoading}>
              Clear
            </Button>
            <Button className="w-full min-w-[120px]" onClick={handleSearch} disabled={isLoading || isLoadingData}>
              {isLoadingData ? 'Loading...' : 'Reload'}
            </Button>
            <Button className="w-full min-w-[120px]" onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
