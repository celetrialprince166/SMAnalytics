# Sales Reports Tab Migration Plan

## Overview
This document outlines the migration plan for the **Sales Reports Tab** from local storage services to API backend services.

## Current Implementation Analysis

### File Location
- **Component**: `components/reports/SalesReportsTab.tsx`
- **Current Services Used**:
  - `reportService` from `@/lib/services/ReportService` (local storage)
  - `productService` from `@/lib/services/ProductService` (local storage)

### UI Components Structure

The Sales Reports tab contains two main sections:

#### 1. Report Type Toggle (G-Levels / P-Levels)
| UI Element | Current State | Implementation |
|------------|---------------|----------------|
| **G-Levels Button** | `reportType === 'G_LEVELS'` | Sets `reportType` state to 'G_LEVELS' |
| **P-Levels Button** | `reportType === 'P_LEVELS'` | Sets `reportType` state to 'P_LEVELS' (default) |

#### 2. Sales Levels Section
| UI Element | Type | State Variable | Current Implementation |
|------------|------|----------------|------------------------|
| **Service mode** | Radio button | `mode` | Sets to `'SERVICE_MODE'` |
| **Service lines** | Radio button | `mode` | Sets to `'SERVICE_LINES'` |
| **Services** | Radio button | `mode` | Sets to `'SERVICES'` (default) |
| **Monthly** | Checkbox | `periodType` | Sets to `'MONTHLY'` |
| **Quarterly** | Checkbox | `periodType` | Sets to `'QUARTERLY'` |
| **Semi-annually** | Checkbox | `periodType` | Sets to `'SEMI_ANNUALLY'` |
| **Annually** | Checkbox | `periodType` | Sets to `'ANNUALLY'` (default) |
| **From date** | Date picker | `levelsFromDate` | Default: Jan 1 of current year |
| **Periods** | Select (1,2,3,4,6,12) | `numberOfPeriods` | Default: '2' |
| **Run button** | Button | - | Calls `handleGenerateSalesLevels()` |

#### 3. Sales Movements Section
| UI Element | Type | State Variable | Current Implementation |
|------------|------|----------------|------------------------|
| **Select product** | Dropdown | `selectedProduct` | Loaded via `productService.getProducts()` |
| **Periodic** | Radio button | `dateMode` | Sets to `'periodic'` (default) |
| **On** | Radio button | `dateMode` | Sets to `'on'` |
| **As at** | Radio button | `dateMode` | Sets to `'as-at'` |
| **Date** | Date picker | `movementDate` | Default: today |
| **Run button** | Button | - | Calls `handleGenerateSalesMovement()` |

---

## Service Method Mapping

### Current Local Storage Methods → Target API Methods

| # | Current Call | File | Target API Service | Target Method |
|---|--------------|------|-------------------|---------------|
| 1 | `productService.getProducts()` | ProductService.ts | `apiProductService` | `getProducts()` |
| 2 | `reportService.generateSalesLevelsReport()` | ReportService.ts | `apiReportService` | `generateSalesLevelsReport()` |
| 3 | `reportService.generateSalesMovementReport()` | ReportService.ts | `apiReportService` | `generateSalesMovementReport()` |

---

## Detailed Component Analysis

### 1. G-Levels / P-Levels Toggle Buttons

**UI Element**: Two toggle buttons at the top
```typescript
// Current Implementation (lines 126-140)
<Button 
  variant={reportType === 'G_LEVELS' ? 'default' : 'outline'} 
  onClick={() => setReportType('G_LEVELS')}
>
  G-Levels
</Button>
<Button 
  variant={reportType === 'P_LEVELS' ? 'default' : 'outline'} 
  onClick={() => setReportType('P_LEVELS')}
>
  P-Levels
</Button>
```

**Migration**: ✅ No API change needed - purely UI state management

---

### 2. Select Mode (Radio Group)

**UI Element**: Radio buttons for Service mode / Service lines / Services
```typescript
// Current Implementation (lines 150-165)
<RadioGroup value={mode} onValueChange={(value: any) => setMode(value)}>
  <RadioGroupItem value="SERVICE_MODE" id="service-mode" />
  <RadioGroupItem value="SERVICE_LINES" id="service-lines" />
  <RadioGroupItem value="SERVICES" id="services" />
</RadioGroup>
```

**Migration**: ✅ No API change needed - purely UI state management

---

### 3. Period Type Checkboxes

**UI Element**: Checkboxes for Monthly / Quarterly / Semi-annually / Annually
```typescript
// Current Implementation (lines 168-201)
<Checkbox 
  checked={periodType === 'MONTHLY'}
  onCheckedChange={(checked) => checked && setPeriodType('MONTHLY')}
/>
// Similar for QUARTERLY, SEMI_ANNUALLY, ANNUALLY
```

**Migration**: ✅ No API change needed - purely UI state management

---

### 4. From Date Picker (Sales Levels)

**UI Element**: Date input for period start
```typescript
// Current Implementation (lines 207-213)
<Input 
  type="date" 
  value={levelsFromDate}
  onChange={(e) => setLevelsFromDate(e.target.value)}
/>
```

**State**: `levelsFromDate` - Default: `new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]`

**Migration**: ✅ No API change needed - purely UI state management

---

### 5. Periods Dropdown (Sales Levels)

**UI Element**: Select dropdown for number of periods (1,2,3,4,6,12)
```typescript
// Current Implementation (lines 215-229)
<Select value={numberOfPeriods} onValueChange={setNumberOfPeriods}>
  <SelectItem value="1">1</SelectItem>
  <SelectItem value="2">2</SelectItem>
  <SelectItem value="3">3</SelectItem>
  <SelectItem value="4">4</SelectItem>
  <SelectItem value="6">6</SelectItem>
  <SelectItem value="12">12</SelectItem>
</Select>
```

**Migration**: ✅ No API change needed - purely UI state management

---

### 6. Sales Levels Run Button ⚠️ REQUIRES MIGRATION

**UI Element**: Button to generate Sales Levels report
```typescript
// Current Implementation (lines 57-81)
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
    // error handling
  } finally {
    setLoading(false);
  }
};
```

**Current Service**: `reportService.generateSalesLevelsReport()`
**Target Service**: `apiReportService.generateSalesLevelsReport()`

**Parameters**:
- `reportType`: 'P_LEVELS' | 'G_LEVELS'
- `mode`: 'SERVICE_MODE' | 'SERVICE_LINES' | 'SERVICES'
- `startDate`: Date
- `numberOfPeriods`: number
- `periodType`: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY'

---

### 7. Select Product Dropdown ⚠️ REQUIRES MIGRATION

**UI Element**: Dropdown to select product for Sales Movement
```typescript
// Current Implementation (lines 43-55)
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
```

**Current Service**: `productService.getProducts()`
**Target Service**: `apiProductService.getProducts()` (Need to create)

---

### 8. Date Mode Radio Buttons (Sales Movements)

**UI Element**: Radio buttons for Periodic / On / As at
```typescript
// Current Implementation (lines 262-279)
<RadioGroup value={dateMode} onValueChange={(value: any) => setDateMode(value)}>
  <RadioGroupItem value="periodic" id="periodic" />
  <RadioGroupItem value="on" id="on" />
  <RadioGroupItem value="as-at" id="as-at" />
</RadioGroup>
```

**Migration**: ✅ No API change needed - purely UI state management

---

### 9. Date Picker (Sales Movements)

**UI Element**: Date input for movement date
```typescript
// Current Implementation (lines 282-288)
<Input 
  type="date" 
  value={movementDate}
  onChange={(e) => setMovementDate(e.target.value)}
/>
```

**Migration**: ✅ No API change needed - purely UI state management

---

### 10. Sales Movements Run Button ⚠️ REQUIRES MIGRATION

**UI Element**: Button to generate Sales Movement report
```typescript
// Current Implementation (lines 83-113)
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
    // error handling
  } finally {
    setLoading(false);
  }
};
```

**Current Service**: `reportService.generateSalesMovementReport()`
**Target Service**: `apiReportService.generateSalesMovementReport()`

**Parameters**:
- `startDate`: Date
- `endDate`: Date
- `dateMode`: 'PERIODIC' | 'ON' | 'AS_AT'
- `productId`: string | undefined

---

## Migration Checklist

### Phase 1: Create ApiProductService
- [ ] Create `lib/services/ApiProductService.ts`
- [ ] Implement `getProducts()` method
- [ ] Add singleton pattern
- [ ] Export `apiProductService` instance

### Phase 2: Add API Report Methods
- [ ] Add `generateSalesLevelsReport()` to `ApiReportService.ts`
- [ ] Add `generateSalesMovementReport()` to `ApiReportService.ts`

### Phase 3: Update Component Imports
- [ ] Change `productService` → `apiProductService`
- [ ] Change `reportService` → `apiReportService`

### Phase 4: Update Service Calls
- [ ] Update `loadProducts()` to use `apiProductService.getProducts()`
- [ ] Update `handleGenerateSalesLevels()` to use `apiReportService.generateSalesLevelsReport()`
- [ ] Update `handleGenerateSalesMovement()` to use `apiReportService.generateSalesMovementReport()`

### Phase 5: Browser Testing
- [ ] Test G-Levels/P-Levels toggle
- [ ] Test Select Mode radio buttons
- [ ] Test Period Type checkboxes
- [ ] Test From date picker
- [ ] Test Periods dropdown
- [ ] Test Sales Levels Run button
- [ ] Test Select Product dropdown
- [ ] Test Date mode radio buttons
- [ ] Test Date picker
- [ ] Test Sales Movements Run button
- [ ] Verify report data accuracy

---

## Existing API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/products` | GET | List products with pagination |
| `/api/sales` | GET | List sales entries |
| `/api/reports/sales` | GET | Generate sales report |

---

## Success Criteria

- [ ] Products dropdown loads from API
- [ ] Sales Levels report generates correctly with all combinations of:
  - G-Levels / P-Levels
  - Service mode / Service lines / Services
  - Monthly / Quarterly / Semi-annually / Annually
  - Multiple periods (1-12)
- [ ] Sales Movements report generates correctly with:
  - All products / specific product
  - Periodic / On / As at date modes
- [ ] Error handling shows proper toast messages
- [ ] Loading states work correctly
- [ ] Browser testing confirms all functionality


