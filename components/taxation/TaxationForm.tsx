'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Save, Calculator } from 'lucide-react';
import { apiTaxationService } from '@/lib/services/ApiTaxationService';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function TaxationForm() {
  // Tax Configuration State
  const [nhil, setNhil] = useState('2.5');
  const [getfund, setGetfund] = useState('2.5');
  const [covid19, setCovid19] = useState('1');
  const [vat, setVat] = useState('12.5');

  // Withholding Tax State
  const [nonIndividualThreshold, setNonIndividualThreshold] = useState('2000');
  const [nonIndividualRate, setNonIndividualRate] = useState('5');
  const [individualRate, setIndividualRate] = useState('7.5');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const [taxConfig, withholdingConfig] = await Promise.all([
        apiTaxationService.getTaxConfiguration(),
        apiTaxationService.getWithholdingTaxConfiguration(),
      ]);

      if (taxConfig) {
        setNhil(taxConfig.nhil.toString());
        setGetfund(taxConfig.getfund.toString());
        setCovid19(taxConfig.covid19.toString());
        setVat(taxConfig.vat.toString());
      }

      if (withholdingConfig) {
        setNonIndividualThreshold(withholdingConfig.nonIndividualThreshold.toString());
        setNonIndividualRate(withholdingConfig.nonIndividualRate.toString());
        setIndividualRate(withholdingConfig.individualRate.toString());
      }
    } catch (err) {
      console.error('Failed to load configuration:', err);
    }
  };

  const handleSaveTaxConfig = async () => {
    setError('');
    setIsLoading(true);

    try {
      await apiTaxationService.saveTaxConfiguration({
        nhil: parseFloat(nhil),
        getfund: parseFloat(getfund),
        covid19: parseFloat(covid19),
        vat: parseFloat(vat),
      });

      toast.success('Tax configuration saved successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to save tax configuration');
      toast.error(err.message || 'Failed to save tax configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWithholdingTax = async () => {
    setError('');
    setIsLoading(true);

    try {
      await apiTaxationService.saveWithholdingTaxConfiguration({
        nonIndividualThreshold: parseFloat(nonIndividualThreshold),
        nonIndividualRate: parseFloat(nonIndividualRate),
        individualRate: parseFloat(individualRate),
      });

      toast.success('Withholding tax configuration saved successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to save withholding tax configuration');
      toast.error(err.message || 'Failed to save withholding tax configuration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="vat" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vat">VAT & Levies</TabsTrigger>
          <TabsTrigger value="withholding">Withholding Tax</TabsTrigger>
        </TabsList>

        <TabsContent value="vat">
          <Card>
            <CardHeader>
              <CardTitle>VAT & Levies Configuration</CardTitle>
              <CardDescription>
                Configure VAT and associated levies (rates in percentage)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vat">VAT Rate (%)</Label>
                  <Input
                    id="vat"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={vat}
                    onChange={(e) => setVat(e.target.value)}
                    placeholder="12.5"
                  />
                  <p className="text-sm text-muted-foreground">Standard VAT rate</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nhil">NHIL Rate (%)</Label>
                  <Input
                    id="nhil"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={nhil}
                    onChange={(e) => setNhil(e.target.value)}
                    placeholder="2.5"
                  />
                  <p className="text-sm text-muted-foreground">National Health Insurance Levy</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="getfund">GETFund Rate (%)</Label>
                  <Input
                    id="getfund"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={getfund}
                    onChange={(e) => setGetfund(e.target.value)}
                    placeholder="2.5"
                  />
                  <p className="text-sm text-muted-foreground">Ghana Education Trust Fund Levy</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="covid19">COVID-19 Levy (%)</Label>
                  <Input
                    id="covid19"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={covid19}
                    onChange={(e) => setCovid19(e.target.value)}
                    placeholder="1"
                  />
                  <p className="text-sm text-muted-foreground">COVID-19 Health Recovery Levy</p>
                </div>
              </div>

              {/* Total Rate Display */}
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-4 w-4" />
                  <span className="font-semibold">Total Tax Rate</span>
                </div>
                <div className="text-2xl font-bold">
                  {(parseFloat(vat || '0') + parseFloat(nhil || '0') + parseFloat(getfund || '0') + parseFloat(covid19 || '0')).toFixed(2)}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Combined rate for all taxes and levies
                </p>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSaveTaxConfig} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withholding">
          <Card>
            <CardHeader>
              <CardTitle>Withholding Tax Configuration</CardTitle>
              <CardDescription>
                Configure withholding tax rates and thresholds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Non-Individual Entities (Companies, Organizations)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nonIndividualThreshold">Threshold Amount (GHS)</Label>
                    <Input
                      id="nonIndividualThreshold"
                      type="number"
                      step="0.01"
                      min="0"
                      value={nonIndividualThreshold}
                      onChange={(e) => setNonIndividualThreshold(e.target.value)}
                      placeholder="2000"
                    />
                    <p className="text-sm text-muted-foreground">
                      Minimum amount before withholding tax applies
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nonIndividualRate">Tax Rate (%)</Label>
                    <Input
                      id="nonIndividualRate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={nonIndividualRate}
                      onChange={(e) => setNonIndividualRate(e.target.value)}
                      placeholder="5"
                    />
                    <p className="text-sm text-muted-foreground">
                      Withholding tax rate for non-individuals
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Individual Entities (Persons)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="individualRate">Tax Rate (%)</Label>
                    <Input
                      id="individualRate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={individualRate}
                      onChange={(e) => setIndividualRate(e.target.value)}
                      placeholder="7.5"
                    />
                    <p className="text-sm text-muted-foreground">
                      Withholding tax rate for individuals
                    </p>
                  </div>
                </div>
              </div>

              {/* Example Calculation */}
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-4 w-4" />
                  <span className="font-semibold">Example Calculation</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">For a GHS 10,000 payment to a company:</span>
                    <div className="font-medium">
                      Withholding Tax = GHS {(10000 * (parseFloat(nonIndividualRate) / 100)).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">For a GHS 10,000 payment to an individual:</span>
                    <div className="font-medium">
                      Withholding Tax = GHS {(10000 * (parseFloat(individualRate) / 100)).toFixed(2)}
                    </div>
                  </div>
                </div>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSaveWithholdingTax} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
