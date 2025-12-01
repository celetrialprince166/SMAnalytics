# API Specifications - Complete OpenAPI Documentation

**Document Version**: 1.0  
**Created**: November 16, 2025  
**Purpose**: Complete API specifications for all report endpoints in OpenAPI 3.0 format

---

## 🎯 Overview

This document provides comprehensive API specifications for all 22 report endpoints. Each endpoint is designed with:
- **Consistent patterns** across all reports
- **Multi-tenancy security** (Gap #5)
- **Performance optimization** (caching, pagination)
- **Comprehensive error handling**
- **Request/response validation**

---

## 📋 API Design Principles

### 1. Consistent URL Structure
```
GET /api/reports/{report-type}
GET /api/reports/{report-type}/export
POST /api/reports/{report-type}/schedule
```

### 2. Standard Query Parameters
- `asOfDate` - Point-in-time reports (ISO 8601)
- `startDate` / `endDate` - Period reports (ISO 8601)
- `organizationId` - Multi-tenancy (auto-injected from auth)
- `format` - Response format (json, pdf, excel)
- `cache` - Cache control (true/false)

### 3. Standard Response Format
```json
{
  "success": true,
  "data": { /* report data */ },
  "metadata": {
    "generatedAt": "2024-12-31T10:30:00Z",
    "generationTime": 1250,
    "recordCount": 150,
    "cached": false
  },
  "errors": null
}
```

### 4. Standard Error Format
```json
{
  "success": false,
  "data": null,
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "Invalid date format",
      "field": "asOfDate",
      "details": "Expected ISO 8601 format"
    }
  ]
}
```

---

## 🔐 Authentication & Authorization

### Authentication
```yaml
security:
  - BearerAuth: []
  
securitySchemes:
  BearerAuth:
    type: http
    scheme: bearer
    bearerFormat: JWT
```

### Authorization Middleware
```typescript
// Every report endpoint MUST include this middleware
const requireReportAccess = async (req: NextRequest) => {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const user = await verifyToken(token);
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Check report permissions
  const hasAccess = await checkReportPermission(user.id, req.url);
  if (!hasAccess) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Inject organization filter
  req.organizationId = user.organizationId;
  return null; // Continue
};
```

---

## 📊 Financial Reports API

### Trial Balance Report

```yaml
/api/reports/trial-balance:
  get:
    summary: Generate Trial Balance Report
    description: |
      Generates a trial balance showing all account balances as of a specific date.
      Ensures total debits equal total credits for accounting integrity.
    tags:
      - Financial Reports
    security:
      - BearerAuth: []
    parameters:
      - name: asOfDate
        in: query
        required: true
        schema:
          type: string
          format: date
          example: "2024-12-31"
      - name: accountType
        in: query
        required: false
        schema:
          type: string
          enum: [SECONDARY, HOLDER]
          default: SECONDARY
      - name: format
        in: query
        required: false
        schema:
          type: string
          enum: [json, pdf, excel]
          default: json
    responses:
      '200':
        description: Trial balance generated successfully
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TrialBalanceResponse'
      '400':
        $ref: '#/components/responses/ValidationError'
      '401':
        $ref: '#/components/responses/Unauthorized'
      '403':
        $ref: '#/components/responses/Forbidden'
```

---

