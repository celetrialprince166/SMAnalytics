'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { apiPayrollService } from '@/lib/services/ApiPayrollService';
import { PensionConfiguration } from '@/types/payroll';

export function PensionTab() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [activePensionConfig, setActivePensionConfig] = useState<PensionConfiguration | null>(null);

  // Tier 1
  const [tier1Employer, setTier1Employer] = useState('');
  const [tier1Employee, setTier1Employee] = useState('');
  const [tier1Pension, setTier1Pension] = useState('');
  const [tier1NHIS, setTier1NHIS] = useState('');

  // Tier 2
  const [tier2, setTier2] = useState('');

  // Tier 3
  const [tier3Employer, setTier3Employer] = useState('');
  const [tier3Employee, setTier3Employee] = useState('');

  // Load active pension configuration on mount
  useEffect(() => {
    loadActivePensionConfiguration();
  }, []);

  // Calculate NHIS automatically
  useEffect(() => {
    const employer = parseFloat(tier1Employer) || 0;
    const employee = parseFloat(tier1Employee) || 0;
    const pension = parseFloat(tier1Pension) || 0;
    const nhis = employer + employee - pension;
    setTier1NHIS(nhis.toFixed(2));
  }, [tier1Employer, tier1Employee, tier1Pension]);

  const loadActivePensionConfiguration = async () => {
    setIsLoadingData(true);
    try {
      const config = await apiPayrollService.getActivePensionConfiguration();
      if (config) {
        loadPensionConfigurationData(config);
        setActivePensionConfig(config);
      }
    } catch (error) {
      console.error('Error loading pension configuration:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadPensionConfigurationData = (config: PensionConfiguration) => {
    // Load all pension configuration data
    setTier1Employer(config.tier1EmployerRate.toString());
    setTier1Employee(config.tier1EmployeeRate.toString());
    setTier1Pension(config.tier1PensionRate.toString());
    setTier2(config.tier2Rate.toString());
    setTier3Employer(config.tier3EmployerRate.toString());
    setTier3Employee(config.tier3EmployeeRate.toString());
    // NHIS will be calculated automatically by useEffect
  };

  const handleClear = () => {
    setTier1Employer('');
    setTier1Employee('');
    setTier1Pension('');
    setTier1NHIS('');
    setTier2('');
    setTier3Employer('');
    setTier3Employee('');
    setActivePensionConfig(null);
  };

  const handleSearch = () => {
    loadActivePensionConfiguration();
    toast.success('Pension configuration reloaded');
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Validate required fields
      if (!tier1Employer || !tier1Employee || !tier1Pension || !tier2 || !tier3Employer || !tier3Employee) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Save to API - pass individual parameters as expected by the service
      const savedConfig = await apiPayrollService.createPensionConfiguration(
        new Date(), // effectiveDate as Date object
        parseFloat(tier1Employer),
        parseFloat(tier1Employee),
        parseFloat(tier1Pension),
        parseFloat(tier1NHIS),
        parseFloat(tier2),
        parseFloat(tier3Employer),
        parseFloat(tier3Employee),
        null // tier3MaxAmount - Optional field
      );
      setActivePensionConfig(savedConfig);
      
      toast.success('Pension configuration saved successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save pension configuration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pension Configuration</CardTitle>
        {activePensionConfig && (
          <div className="text-sm text-green-600 font-medium">
            Active Configuration Loaded
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">SSNIT TIER 1</h3>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="tier1Employer">TIER 1 - Employer</Label>
                  <Input 
                    id="tier1Employer" 
                    type="number" 
                    placeholder="0.00" 
                    value={tier1Employer}
                    onChange={(e) => setTier1Employer(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tier1Employee">TIER 1 - Employee</Label>
                  <Input 
                    id="tier1Employee" 
                    type="number" 
                    placeholder="0.00" 
                    value={tier1Employee}
                    onChange={(e) => setTier1Employee(e.target.value)}
                  />
                </div>
                <hr />
                <div className="space-y-2">
                  <Label htmlFor="tier1Pension">TIER 1 - Pension</Label>
                  <Input 
                    id="tier1Pension" 
                    type="number" 
                    placeholder="0.00" 
                    value={tier1Pension}
                    onChange={(e) => setTier1Pension(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tier1NHIS">TIER 1 - NHIS</Label>
                  <Input 
                    id="tier1NHIS" 
                    type="number" 
                    placeholder="0.00" 
                    className="bg-muted" 
                    readOnly 
                    value={tier1NHIS}
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">SSNIT TIER 2</h3>
              <div className="space-y-2 max-w-md">
                <Label htmlFor="tier2">TIER 2</Label>
                <Input 
                  id="tier2" 
                  type="number" 
                  placeholder="0.00" 
                  value={tier2}
                  onChange={(e) => setTier2(e.target.value)}
                />
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">SSNIT TIER 3 (upto ...)</h3>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="tier3Employer">TIER 3 - Employer</Label>
                  <Input 
                    id="tier3Employer" 
                    type="number" 
                    placeholder="0.00" 
                    value={tier3Employer}
                    onChange={(e) => setTier3Employer(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tier3Employee">TIER 3 - Employee</Label>
                  <Input 
                    id="tier3Employee" 
                    type="number" 
                    placeholder="0.00" 
                    value={tier3Employee}
                    onChange={(e) => setTier3Employee(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button className="w-full min-w-[120px]" onClick={handleClear} disabled={isLoading || isLoadingData}>
              Clear
            </Button>
            <Button className="w-full min-w-[120px]" onClick={handleSearch} disabled={isLoading || isLoadingData}>
              {isLoadingData ? 'Loading...' : 'Reload'}
            </Button>
            <Button className="w-full min-w-[120px]" onClick={handleSave} disabled={isLoading || isLoadingData}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
