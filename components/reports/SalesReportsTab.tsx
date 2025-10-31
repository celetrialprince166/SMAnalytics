'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SalesLevelsReportComponent } from './SalesLevelsReportComponent';
import { SalesMovementReportComponent } from './SalesMovementReportComponent';
import { reportService } from '@/lib/services/ReportService';
import { productService } from '@/lib/services/ProductService';
import { toast } from 'sonner';

export function SalesReportsTab() {
  const [salesLevelsData, setSalesLevelsData] = useState<any>(null);
  const [salesMovementData, setSalesMovementData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  // Sales Levels state
  const [reportType, setReportType] = useState<'P_LEVELS' | 'G_LEVELS'>('P_LEVELS');
  const [mode, setMode] = useState<'SERVICE_MODE' | 'SERVICE_LINES' | 'SERVICES'>('SERVICES');
  const [periodType, setPeriodType] = useState<'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY'>('ANNUALLY');
  const [levelsFromDate, setLevelsFromDate] = useState<string>(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [numberOfPeriods, setNumberOfPeriods] = useState<string>('2');

  // Sales Movement state
  const [selectedProduct, setSelectedProduct] = useState<string>('ALL_PRODUCTS');
  const [dateMode, setDateMode] = useState<'periodic' | 'on' | 'as-at'>('periodic');
  const [movementDate, setMovementDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const allProducts = await productService.getProducts();
      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    }
  };

  const handleGenerateSalesLevels = async () => {
    setLoading(true);
    try {
      const startDate = new Date(levelsFromDate);
      const periods = parseInt(numberOfPeriods);

      const data = await reportService.generateSalesLevelsReport(
        reportType,
        mode,
        startDate,
        periods,
        periodType
      );

      setSalesLevelsData(data);
      setSalesMovementData(null);
      toast.success('Sales Levels Report generated successfully');
    } catch (error) {
      console.error('Error generating sales levels report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate sales levels report';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSalesMovement = async () => {
    setLoading(true);
    try {
      const date = new Date(movementDate);
      const startDate = new Date(date.getFullYear(), 0, 1);
      const endDate = new Date(date.getFullYear(), 11, 31);

      const dateModeMap = {
        'periodic': 'PERIODIC' as const,
        'on': 'ON' as const,
        'as-at': 'AS_AT' as const,
      };

      const data = await reportService.generateSalesMovementReport(
        startDate,
        endDate,
        dateModeMap[dateMode],
        selectedProduct === 'ALL_PRODUCTS' ? undefined : selectedProduct
      );

      setSalesMovementData(data);
      setSalesLevelsData(null);
      toast.success('Sales Movement Report generated successfully');
    } catch (error) {
      console.error('Error generating sales movement report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate sales movement report';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'PDF' | 'EXCEL') => {
    toast.info(`Exporting to ${format}... (Feature coming soon)`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="flex gap-4">
        <Button 
          variant={reportType === 'G_LEVELS' ? 'default' : 'outline'} 
          className="flex-1"
          onClick={() => setReportType('G_LEVELS')}
        >
          G-Levels
        </Button>
        <Button 
          variant={reportType === 'P_LEVELS' ? 'default' : 'outline'} 
          className="flex-1"
          onClick={() => setReportType('P_LEVELS')}
        >
          P-Levels
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Levels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Select Mode</Label>
            <div className="space-y-2">
              <RadioGroup value={mode} onValueChange={(value: any) => setMode(value)}>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SERVICE_MODE" id="service-mode" />
                    <Label htmlFor="service-mode">Service mode</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SERVICE_LINES" id="service-lines" />
                    <Label htmlFor="service-lines">Service lines</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SERVICES" id="services" />
                    <Label htmlFor="services">Services</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-6 mt-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="monthly-sales" 
                  checked={periodType === 'MONTHLY'}
                  onCheckedChange={(checked) => checked && setPeriodType('MONTHLY')}
                />
                <Label htmlFor="monthly-sales">Monthly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="quarterly-sales" 
                  checked={periodType === 'QUARTERLY'}
                  onCheckedChange={(checked) => checked && setPeriodType('QUARTERLY')}
                />
                <Label htmlFor="quarterly-sales">Quarterly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="semi-annually-sales" 
                  checked={periodType === 'SEMI_ANNUALLY'}
                  onCheckedChange={(checked) => checked && setPeriodType('SEMI_ANNUALLY')}
                />
                <Label htmlFor="semi-annually-sales">Semi-annually</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="annually-sales" 
                  checked={periodType === 'ANNUALLY'}
                  onCheckedChange={(checked) => checked && setPeriodType('ANNUALLY')}
                />
                <Label htmlFor="annually-sales">Annually</Label>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Select Period</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From</Label>
                <Input 
                  type="date" 
                  value={levelsFromDate}
                  onChange={(e) => setLevelsFromDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Periods</Label>
                <Select value={numberOfPeriods} onValueChange={setNumberOfPeriods}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button onClick={handleGenerateSalesLevels} disabled={loading}>
            {loading ? 'Generating...' : 'Run'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sales Movements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select product (optional)</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="All products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_PRODUCTS">All products</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Date mode</Label>
            <RadioGroup value={dateMode} onValueChange={(value: any) => setDateMode(value)}>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="periodic" id="periodic" />
                  <Label htmlFor="periodic">Periodic</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="on" id="on" />
                  <Label htmlFor="on">On</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="as-at" id="as-at" />
                  <Label htmlFor="as-at">As at</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input 
              type="date" 
              value={movementDate}
              onChange={(e) => setMovementDate(e.target.value)}
            />
          </div>

          <Button onClick={handleGenerateSalesMovement} disabled={loading}>
            {loading ? 'Generating...' : 'Run'}
          </Button>
        </CardContent>
      </Card>

      {salesLevelsData && (
        <SalesLevelsReportComponent
          data={salesLevelsData}
          onExport={handleExport}
          onPrint={handlePrint}
        />
      )}

      {salesMovementData && (
        <SalesMovementReportComponent
          data={salesMovementData}
          onExport={handleExport}
          onPrint={handlePrint}
        />
      )}
    </>
  );
}
