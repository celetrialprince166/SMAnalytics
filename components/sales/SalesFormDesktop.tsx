'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileText, Users } from 'lucide-react';
import { apiSalesService } from '@/lib/services/ApiSalesService';
import { toast } from 'sonner';
import { usePDFInvoice } from '@/components/invoice/PDFInvoiceGenerator';
import { useDebugMode } from '@/lib/contexts/DebugModeContext';
import { captureSalesTransaction } from '@/lib/utils/transactionDebugCapture';

interface SalesFormDesktopProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onSelectForRepresentatives?: (salesId: string) => void;
}

interface Client {
  id: string;
  companyName: string;
  contactPerson?: string;
  emailAddress?: string;
  phoneNumbers?: string;
  address?: string;
}

interface ServiceLine {
  id: string;
  name: string;
  description?: string;
}

interface Service {
  id: string;
  code: string;
  name: string;
  description: string;
  averageFee: number;
  serviceLineId: string;
}

interface Product {
  id: string;
  code: string;
  name: string;
  unitPrice: number;
  costPrice: number;
}

interface HolderAccount {
  id: string;
  code: string;
  name: string;
  balance: number;
}

export function SalesFormDesktop({ onSuccess, onCancel, onSelectForRepresentatives }: SalesFormDesktopProps) {
  // PDF Invoice Hook
  const { generateInvoice } = usePDFInvoice();

  // Loading States
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Debug mode hook
  const { settings: debugSettings, setCurrentDebugData, addToHistory, openModal } = useDebugMode();

  // Data Arrays from APIs
  const [clients, setClients] = useState<Client[]>([]);
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [holderAccounts, setHolderAccounts] = useState<HolderAccount[]>([]);

  // Form State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientRemarks, setClientRemarks] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [tn, setTn] = useState('1');
  const [salesCode, setSalesCode] = useState('');

  const [selectedHolderAccountId, setSelectedHolderAccountId] = useState('');
  const [applyVat, setApplyVat] = useState(false);
  const [vatRate, setVatRate] = useState(15);
  const [vatAmount, setVatAmount] = useState(0);
  const [totalInvoice, setTotalInvoice] = useState(0);

  const [selectedServiceLineId, setSelectedServiceLineId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [atn, setAtn] = useState('');
  const [avgFee, setAvgFee] = useState(0);

  const [serviceFee, setServiceFee] = useState(0);
  const [costValue, setCostValue] = useState(0);
  const [applyDiscount, setApplyDiscount] = useState(false);
  const [discountValue, setDiscountValue] = useState(0);
  const [salesValue, setSalesValue] = useState(0);

  const [representatives, setRepresentatives] = useState(1);
  const [currentPosition, setCurrentPosition] = useState(1);
  const [totalCount, setTotalCount] = useState(5);
  const [clientSearch, setClientSearch] = useState(false);
  const [dateSearch, setDateSearch] = useState(false);
  const [duplicateDisplayed, setDuplicateDisplayed] = useState(false);

  // Navigation State
  const [existingSalesEntries, setExistingSalesEntries] = useState<any[]>([]);
  const [currentSalesEntry, setCurrentSalesEntry] = useState<any | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Generate PDF Invoice
  const handleGenerateInvoice = async () => {
    try {
      // Validate required fields - product is optional, service can be used instead
      if (!selectedHolderAccountId || !salesValue) {
        toast.error('Please fill in all required fields before generating invoice');
        return;
      }

      // Get selected product/service and customer data
      const selectedProduct = selectedProductId ? products.find(p => p.id === selectedProductId) : null;
      const selectedService = selectedServiceId ? services.find(s => s.id === selectedServiceId) : null;
      const selectedCustomer = holderAccounts.find(h => h.id === selectedHolderAccountId);

      if (!selectedCustomer) {
        toast.error('Selected customer not found');
        return;
      }

      // Use service if no product is selected
      if (!selectedProduct && !selectedService) {
        toast.error('Please select either a product or service before generating invoice');
        return;
      }

      // Generate invoice number
      const invoiceNumber = `SI-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${String(currentPosition).padStart(3, '0')}`;

      // Create sales entry data for invoice
      const salesEntryData = {
        id: currentSalesEntry?.id || 'temp',
        date: new Date(date),
        salesCode: salesCode || `S-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${String(currentPosition).padStart(3, '0')}`,
        productId: selectedProductId || selectedServiceId,
        description: description || (selectedProduct?.name || selectedService?.name || 'Service/Product'),
        salesValue: salesValue,
        costValue: costValue,
        customerAccountId: selectedHolderAccountId,
        costTransactionNumber: `CT-${Date.now()}`,
        salesTransactionNumber: `ST-${Date.now()}`,
        invoiceNumber: invoiceNumber,
        applyVat: applyVat,
        vatRate: vatRate,
        vatAmount: vatAmount,
        totalWithVat: totalInvoice,
        createdAt: new Date(),
        updatedAt: new Date(),
        product: selectedProduct || {
          id: selectedServiceId || 'service',
          name: selectedService?.name || 'Service',
          code: selectedService?.code || 'SRV',
          salesAccountId: 'sales-acc',
          costOfSalesAccountId: 'cos-acc',
          inventoryAccountId: 'inv-acc'
        },
        customerAccount: {
          secondaryAccount: {
            id: selectedCustomer.id,
            name: selectedCustomer.name,
            code: selectedCustomer.code
          },
          holderAccount: selectedCustomer
        }
      };

      // Generate PDF invoice
      const generator = generateInvoice({
        salesEntry: salesEntryData as any, // Type assertion for complex nested types
        product: salesEntryData.product as any,
        customer: selectedCustomer as any,
        invoiceNumber: invoiceNumber
      });

      // Download the PDF
      generator.download(`Invoice-${invoiceNumber}.pdf`);

      toast.success('Invoice PDF generated successfully!');
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice PDF');
    }
  };

  // Load existing sales entries for navigation
  const loadExistingSalesEntries = async () => {
    try {
      const entries = await apiSalesService.getSalesEntries();
      setExistingSalesEntries(entries);
      setTotalCount(entries.length);

      // Don't automatically load the first entry - let user explicitly choose to edit
      // Form should start in create mode by default
    } catch (error) {
      console.error('Error loading existing sales entries:', error);
    }
  };

  // Load a specific sales entry into the form
  const loadSalesEntry = async (entry: any, position: number) => {
    try {
      setCurrentSalesEntry(entry);
      setCurrentPosition(position);
      setIsEditMode(true);

      // Populate form fields with the sales entry data
      setDate(new Date(entry.date).toISOString().split('T')[0]);
      setDescription(entry.description);
      setSalesCode(entry.salesCode);
      setServiceFee(entry.salesValue); // Using salesValue as serviceFee for now
      setCostValue(entry.costValue);
      setSalesValue(entry.salesValue);
      setApplyVat(entry.applyVat || false);
      setVatRate(entry.vatRate || 15);
      setVatAmount(entry.vatAmount || 0);
      setTotalInvoice(entry.totalWithVat || entry.salesValue);

      // Set the product
      if (entry.productId) {
        setSelectedProductId(entry.productId);
      }

      // Set the customer account
      if (entry.customerAccountId) {
        setSelectedHolderAccountId(entry.customerAccountId);
      }

      toast.success(`Loaded sales entry ${entry.salesCode}`);
    } catch (error) {
      console.error('Error loading sales entry:', error);
      toast.error('Failed to load sales entry');
    }
  };

  // Load initial data from APIs
  useEffect(() => {
    loadInitialData();
    loadExistingSalesEntries();
  }, []);

  // Load services when service line changes
  useEffect(() => {
    if (selectedServiceLineId) {
      loadServicesForServiceLine(selectedServiceLineId);
    } else {
      setServices([]);
      setSelectedServiceId('');
    }
  }, [selectedServiceLineId]);

  // Update average fee when service changes
  useEffect(() => {
    if (selectedServiceId) {
      const selectedService = services.find(s => s.id === selectedServiceId);
      if (selectedService) {
        setAvgFee(selectedService.averageFee);
        setAtn(selectedService.code);
      }
    } else {
      setAvgFee(0);
      setAtn('');
    }
  }, [selectedServiceId, services]);

  // Auto-calculate sales value, VAT, and totals
  useEffect(() => {
    const discount = applyDiscount ? discountValue : 0;
    const newSalesValue = serviceFee - discount;
    setSalesValue(newSalesValue);

    const vat = applyVat ? (newSalesValue * vatRate) / 100 : 0;
    setVatAmount(vat);
    setTotalInvoice(newSalesValue + vat);
  }, [serviceFee, applyDiscount, discountValue, applyVat, vatRate]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load all data in parallel
      const [clientsData, serviceLinesData, productsData, accountsData] = await Promise.all([
        fetchClients(),
        fetchServiceLines(),
        fetchProducts(),
        fetchHolderAccounts()
      ]);

      setClients(clientsData);
      setServiceLines(serviceLinesData);
      setProducts(productsData);
      setHolderAccounts(accountsData);

      // Auto-select first options if available
      if (clientsData.length > 0) {
        setSelectedClientId(clientsData[0].id);
      }
      if (accountsData.length > 0) {
        setSelectedHolderAccountId(accountsData[0].id);
      }
      if (serviceLinesData.length > 0) {
        setSelectedServiceLineId(serviceLinesData[0].id);
      }
      if (productsData.length > 0) {
        setSelectedProductId(productsData[0].id);
      }

    } catch (err: any) {
      console.error('Error loading initial data:', err);
      setError('Failed to load form data. Please refresh the page.');
      toast.error('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async (): Promise<Client[]> => {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) {
        throw new Error(`Failed to fetch clients: ${response.statusText}`);
      }
      const data = await response.json();
      return data.data?.data || [];
    } catch (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
  };

  const fetchServiceLines = async (): Promise<ServiceLine[]> => {
    try {
      const response = await fetch('/api/services/service-lines');
      if (!response.ok) {
        throw new Error(`Failed to fetch service lines: ${response.statusText}`);
      }
      const data = await response.json();
      // Handle both flat (data) and nested (data.data) response structures
      return data.data?.data || data.data || [];
    } catch (error) {
      console.error('Error fetching service lines:', error);
      return [];
    }
  };

  const loadServicesForServiceLine = async (serviceLineId: string) => {
    try {
      const response = await fetch(`/api/services/services?serviceLineId=${serviceLineId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch services: ${response.statusText}`);
      }
      const data = await response.json();
      // Handle both flat (data) and nested (data.data) response structures
      const servicesData = data.data?.data || data.data || [];
      setServices(servicesData);

      // Auto-select first service if available
      if (servicesData.length > 0) {
        setSelectedServiceId(servicesData[0].id);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    }
  };

  const fetchProducts = async (): Promise<Product[]> => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }
      const data = await response.json();
      // Handle both flat (data) and nested (data.data) response structures
      return data.data?.data || data.data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  };

  const fetchHolderAccounts = async (): Promise<HolderAccount[]> => {
    try {
      const response = await fetch('/api/accounts/holder');
      if (!response.ok) {
        throw new Error(`Failed to fetch holder accounts: ${response.statusText}`);
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching holder accounts:', error);
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validation - Either product OR service must be selected
      if (!selectedProductId && !selectedServiceId) {
        setError('Please select either a product or a service');
        toast.error('Please select either a product or a service');
        return;
      }
      if (!description.trim()) {
        setError('Please enter a description');
        toast.error('Please enter a description');
        return;
      }
      if (!selectedHolderAccountId) {
        setError('Please select a customer account');
        toast.error('Please select a customer account');
        return;
      }
      if (serviceFee <= 0) {
        setError('Service fee must be greater than 0');
        toast.error('Service fee must be greater than 0');
        return;
      }

      const salesRequest = {
        date: new Date(date),
        productId: selectedProductId || null,
        serviceId: selectedServiceId || null,
        description: description.trim(),
        salesValue: salesValue,
        costValue: costValue,
        customerAccountId: selectedHolderAccountId,
        applyVat: applyVat,
        vatRate: applyVat ? vatRate : undefined,
      };

      if (isEditMode && currentSalesEntry) {
        // Update existing entry
        await apiSalesService.updateSalesEntry(currentSalesEntry.id, salesRequest);
        toast.success('Sales entry updated successfully');
      } else {
        // Create new entry
        const result = await apiSalesService.createSalesEntry(salesRequest);
        toast.success('Sales entry created successfully');
        
        // Set the newly created entry so Get Reps button appears
        if (result && result.id) {
          setCurrentSalesEntry(result);
          setIsEditMode(true);
          
          // Capture debug data if debug mode is enabled
          if (debugSettings.enabled) {
            try {
              const debugData = await captureSalesTransaction(
                result.id,
                selectedProductId || selectedServiceId || '',
                selectedHolderAccountId,
                salesValue,
                costValue,
                new Date(date),
                applyVat ? vatAmount : undefined,
                applyVat ? (salesValue + vatAmount) : undefined
              );
              
              setCurrentDebugData(debugData);
              addToHistory(debugData);
              
              if (debugSettings.autoShow) {
                openModal();
              }
            } catch (debugError) {
              console.error('Failed to capture debug data:', debugError);
            }
          }
        }
      }

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} sales entry`);
      toast.error(err.message || `Failed to ${isEditMode ? 'update' : 'create'} sales entry`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNew = () => {
    // Reset form to initial state
    setDescription('');
    setServiceFee(0);
    setCostValue(0);
    setSalesValue(0);
    setApplyDiscount(false);
    setDiscountValue(0);
    setVatAmount(0);
    setTotalInvoice(0);
    setClientRemarks('');
    setDate(new Date().toISOString().split('T')[0]);
    setTn('1');
    setSalesCode('');
    setRepresentatives(1);
    setError('');

    // Reset edit mode
    setIsEditMode(false);
    setCurrentSalesEntry(null);
    setCurrentPosition(1);

    // Keep selected dropdowns but reset to first options
    if (clients.length > 0) {
      setSelectedClientId(clients[0].id);
    }
    if (holderAccounts.length > 0) {
      setSelectedHolderAccountId(holderAccounts[0].id);
    }
    if (serviceLines.length > 0) {
      setSelectedServiceLineId(serviceLines[0].id);
    }
    if (products.length > 0) {
      setSelectedProductId(products[0].id);
    }

    toast.success('New entry form cleared');
    setIsEditMode(false);
    setCurrentSalesEntry(null);
  };

  // Navigation functions - these switch to edit mode
  const handleFirstNavigation = () => {
    if (existingSalesEntries.length > 0) {
      const filteredEntries = dateSearch
        ? existingSalesEntries.filter(entry =>
          new Date(entry.date).toDateString() === new Date(date).toDateString()
        )
        : existingSalesEntries;

      if (filteredEntries.length > 0) {
        loadSalesEntry(filteredEntries[0], 1);
        toast.info('Switched to edit mode - First entry loaded');
      }
    } else {
      toast.warning('No sales entries found to edit');
    }
  };

  const handlePreviousNavigation = () => {
    if (existingSalesEntries.length > 0 && currentPosition > 1) {
      const filteredEntries = dateSearch
        ? existingSalesEntries.filter(entry =>
          new Date(entry.date).toDateString() === new Date(date).toDateString()
        )
        : existingSalesEntries;

      const newPosition = currentPosition - 1;
      if (newPosition >= 1 && newPosition <= filteredEntries.length) {
        loadSalesEntry(filteredEntries[newPosition - 1], newPosition);
        toast.info(`Switched to edit mode - Entry ${newPosition} loaded`);
      }
    } else if (existingSalesEntries.length === 0) {
      toast.warning('No sales entries found to edit');
    } else {
      toast.warning('Already at first entry');
    }
  };

  const handleNextNavigation = () => {
    if (existingSalesEntries.length > 0) {
      const filteredEntries = dateSearch
        ? existingSalesEntries.filter(entry =>
          new Date(entry.date).toDateString() === new Date(date).toDateString()
        )
        : existingSalesEntries;

      const newPosition = currentPosition + 1;
      if (newPosition <= filteredEntries.length) {
        loadSalesEntry(filteredEntries[newPosition - 1], newPosition);
        toast.info(`Switched to edit mode - Entry ${newPosition} loaded`);
      } else {
        toast.warning('Already at last entry');
      }
    } else {
      toast.warning('No sales entries found to edit');
    }
  };

  const handleLastNavigation = () => {
    if (existingSalesEntries.length > 0) {
      const filteredEntries = dateSearch
        ? existingSalesEntries.filter(entry =>
          new Date(entry.date).toDateString() === new Date(date).toDateString()
        )
        : existingSalesEntries;

      if (filteredEntries.length > 0) {
        loadSalesEntry(filteredEntries[filteredEntries.length - 1], filteredEntries.length);
        toast.info(`Switched to edit mode - Last entry (${filteredEntries.length}) loaded`);
      }
    } else {
      toast.warning('No sales entries found to edit');
    }
  };

  // Update total count when date search changes
  useEffect(() => {
    if (dateSearch && existingSalesEntries.length > 0) {
      const filteredEntries = existingSalesEntries.filter(entry =>
        new Date(entry.date).toDateString() === new Date(date).toDateString()
      );
      setTotalCount(filteredEntries.length);

      // Reset position if current position is beyond filtered results
      if (currentPosition > filteredEntries.length) {
        setCurrentPosition(1);
      }
    } else {
      setTotalCount(existingSalesEntries.length);
    }
  }, [dateSearch, date, existingSalesEntries, currentPosition]);

  // Handle client search functionality
  const handleClientSearch = (checked: boolean) => {
    setClientSearch(checked);
    if (checked) {
      // Filter entries by selected client
      const filteredEntries = existingSalesEntries.filter(entry =>
        entry.customerAccountId === selectedHolderAccountId
      );
      setTotalCount(filteredEntries.length);
      if (filteredEntries.length > 0) {
        toast.info(`Found ${filteredEntries.length} entries for selected client`);
      } else {
        toast.warning('No entries found for selected client');
      }
    } else {
      setTotalCount(existingSalesEntries.length);
    }
  };

  // Handle duplicate display functionality
  const handleDuplicateDisplay = (checked: boolean) => {
    setDuplicateDisplayed(checked);
    if (checked) {
      // Show duplicate entries based on description or product
      const duplicates = existingSalesEntries.filter((entry, index, arr) =>
        arr.findIndex(e => e.description === entry.description || e.productId === entry.productId) !== index
      );
      if (duplicates.length > 0) {
        toast.info(`Found ${duplicates.length} duplicate entries`);
      } else {
        toast.info('No duplicate entries found');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading form data...</p>
        </div>
      </div>
    );
  }

  if (error && clients.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadInitialData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Form Status Indicator */}
      {isEditMode && currentSalesEntry && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-blue-800 font-medium">
              Editing: {currentSalesEntry.salesCode} - {currentSalesEntry.description}
            </span>
            <span className="text-blue-600 text-sm">
              (Position {currentPosition} of {totalCount})
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Client Section */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Client</h3>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Remarks</Label>
                <Input
                  value={clientRemarks}
                  onChange={(e) => setClientRemarks(e.target.value)}
                  placeholder="Enter client remarks"
                />
              </div>
            </div>
          </div>

          {/* Select Service Groups Section - Moved from right column */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Select Service Groups</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Service line</Label>
                  <Select value={selectedServiceLineId} onValueChange={setSelectedServiceLineId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service line" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceLines.map((line) => (
                        <SelectItem key={line.id} value={line.id}>
                          {line.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Service {selectedProductId ? '(Optional)' : '*'}</Label>
                  <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedProductId ? "Select service (optional)" : "Select service"} />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Product {selectedServiceId ? '(Optional)' : '*'}</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedServiceId ? "Select product (optional)" : "Select product"} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ATN</Label>
                  <Input
                    value={atn}
                    onChange={(e) => setAtn(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Avg. fee</Label>
                  <Input
                    type="number"
                    value={Number(avgFee || 0).toFixed(2)}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Receivable/Receipt Account Section */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Receivable/Receipt Account</h3>
            <div className="space-y-4">
              <div>
                <Label>Customer Account</Label>
                <Select value={selectedHolderAccountId} onValueChange={setSelectedHolderAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer account" />
                  </SelectTrigger>
                  <SelectContent>
                    {holderAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="apply-vat"
                    checked={applyVat}
                    onCheckedChange={(checked) => setApplyVat(checked as boolean)}
                  />
                  <Label htmlFor="apply-vat" className="cursor-pointer">Apply VAT</Label>
                </div>
                <div>
                  <Label>VAT Rate (%)</Label>
                  <Input
                    type="number"
                    value={vatRate}
                    onChange={(e) => setVatRate(parseFloat(e.target.value) || 15)}
                    disabled={!applyVat}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <Label>VAT Amount</Label>
                  <Input
                    type="number"
                    value={Number(vatAmount || 0).toFixed(2)}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
              <div>
                <Label>Total invoice</Label>
                <Input
                  type="number"
                  value={Number(totalInvoice || 0).toFixed(2)}
                  readOnly
                  className="bg-muted font-semibold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Sales Information Section - Moved from left column */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Sales Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>TN</Label>
                  <Input
                    value={tn}
                    onChange={(e) => setTn(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter sales description"
                />
              </div>
              <div>
                <Label>Sales code</Label>
                <div className="flex">
                  <Input
                    value={salesCode}
                    onChange={(e) => setSalesCode(e.target.value)}
                    placeholder="Auto-generated"
                  />
                  <Button variant="outline" className="ml-2" onClick={() => {
                    const newCode = `S-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${String(Date.now()).slice(-3)}`;
                    setSalesCode(newCode);
                    toast.success('Sales code generated');
                  }}>
                    Generate
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Details Section */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Transaction Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Service fee</Label>
                  <Input
                    type="number"
                    value={serviceFee}
                    onChange={(e) => setServiceFee(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Cost value</Label>
                  <Input
                    type="number"
                    value={costValue}
                    onChange={(e) => setCostValue(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="apply-discount"
                    checked={applyDiscount}
                    onCheckedChange={(checked) => {
                      setApplyDiscount(checked as boolean);
                      if (!checked) {
                        setDiscountValue(0);
                      }
                    }}
                  />
                  <Label htmlFor="apply-discount" className="cursor-pointer">Apply discount</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    disabled={!applyDiscount}
                    className="w-32"
                    placeholder="0.00"
                    min="0"
                  />
                  <span className="text-sm text-muted-foreground">GHS</span>
                </div>
              </div>
              <div>
                <Label>Sales value</Label>
                <Input
                  type="number"
                  value={Number(salesValue || 0).toFixed(2)}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Representatives Section */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Representatives</h3>
            <div className="flex items-center space-x-4">
              <Label>Number of representatives:</Label>
              <Input
                type="number"
                value={representatives}
                onChange={(e) => setRepresentatives(parseInt(e.target.value) || 1)}
                className="w-20"
                min="1"
                max="10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Options */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="client-search"
                checked={clientSearch}
                onCheckedChange={(checked) => handleClientSearch(checked as boolean)}
              />
              <Label htmlFor="client-search" className="cursor-pointer">Client search</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="date-search"
                checked={dateSearch}
                onCheckedChange={(checked) => setDateSearch(checked as boolean)}
              />
              <Label htmlFor="date-search" className="cursor-pointer">Date search</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="duplicate-displayed"
                checked={duplicateDisplayed}
                onCheckedChange={(checked) => handleDuplicateDisplay(checked as boolean)}
              />
              <Label htmlFor="duplicate-displayed" className="cursor-pointer">Duplicate displayed</Label>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleFirstNavigation} title="First">
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handlePreviousNavigation} title="Previous">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Input
              value={isEditMode ? `${currentPosition} of ${totalCount}` : `New Entry`}
              readOnly
              className="w-24 text-center"
              title={isEditMode ? "Current position in sales list" : "Creating new entry"}
            />
            <Button variant="outline" size="sm" onClick={handleNextNavigation} title="Next">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleLastNavigation} title="Last">
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleNew}>
              New
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : (isEditMode ? 'Update Entry' : 'Submit Entry')}
            </Button>
            {onSelectForRepresentatives && (
              <Button
                variant="outline"
                onClick={() => {
                  if (currentSalesEntry) {
                    onSelectForRepresentatives(currentSalesEntry.id);
                  } else {
                    toast.error('Please save the sales entry first');
                  }
                }}
                disabled={!currentSalesEntry}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                title={currentSalesEntry ? "Manage representatives for this entry" : "Save entry first to manage representatives"}
              >
                <Users className="h-4 w-4 mr-2" />
                Get Reps
              </Button>
            )}
            <Button variant="outline" onClick={handleGenerateInvoice}>
              <FileText className="h-4 w-4 mr-2" />
              Invoice
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
