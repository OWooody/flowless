# Promo Code System

This document describes the promo code system that allows bulk upload and management of promotional codes with batch/group organization.

## Overview

The promo code system provides:
- **Bulk Upload**: Upload multiple promo codes at once via file upload, manual entry, or auto-generation
- **Batch Management**: Organize codes into named batches for easy reference and tracking
- **Usage Tracking**: Monitor which codes have been used, when, and by whom
- **Flexible Discounts**: Support for percentage, fixed amount, and free shipping discounts
- **Export Functionality**: Export codes to CSV for external use

## Database Schema

### PromoCodeBatch
Represents a group/batch of promo codes with shared settings:

```sql
model PromoCodeBatch {
  id             String   @id @default(cuid())
  name           String   // Batch/group name for reference
  description    String?
  totalCodes     Int      @default(0)
  usedCodes      Int      @default(0)
  discountType   String   // 'percentage', 'fixed', 'free_shipping'
  discountValue  Float    // Percentage (0-100) or fixed amount
  minOrderValue  Float?   // Minimum order value required
  maxUses        Int?     // Maximum uses per code (null = unlimited)
  validFrom      DateTime @default(now())
  validUntil     DateTime?
  isActive       Boolean  @default(true)
  userId         String
  organizationId String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

### PromoCode
Individual promo codes within a batch:

```sql
model PromoCode {
  id             String   @id @default(cuid())
  code           String   @unique // The actual promo code
  batchId        String
  isUsed         Boolean  @default(false)
  usedAt         DateTime?
  usedBy         String?  // User ID who used the code
  orderId        String?  // Order ID where code was used
  discountAmount Float?   // Actual discount applied
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

## API Endpoints

### GET /api/promocodes
Fetch all promo code batches for the authenticated user.

**Response:**
```json
{
  "batches": [
    {
      "id": "batch_id",
      "name": "Summer Sale 2024",
      "description": "Summer promotion codes",
      "totalCodes": 100,
      "usedCodes": 25,
      "discountType": "percentage",
      "discountValue": 15,
      "minOrderValue": 50,
      "maxUses": 1,
      "validFrom": "2024-06-01T00:00:00Z",
      "validUntil": "2024-08-31T23:59:59Z",
      "isActive": true,
      "createdAt": "2024-06-01T10:00:00Z"
    }
  ],
  "summary": {
    "total": 1,
    "active": 1,
    "inactive": 0,
    "totalCodes": 100,
    "usedCodes": 25
  }
}
```

### POST /api/promocodes
Create a new promo code batch with bulk codes.

**Request:**
```json
{
  "name": "Summer Sale 2024",
  "description": "Summer promotion codes",
  "discountType": "percentage",
  "discountValue": 15,
  "minOrderValue": 50,
  "maxUses": 1,
  "validFrom": "2024-06-01",
  "validUntil": "2024-08-31",
  "isActive": true,
  "codes": ["SUMMER15", "SAVE2024", "PROMO123"]
}
```

### GET /api/promocodes/[id]
Fetch a specific batch by ID.

### PUT /api/promocodes/[id]
Update a batch's settings.

### DELETE /api/promocodes/[id]
Delete a batch and all associated codes.

### GET /api/promocodes/[id]/codes
Fetch codes within a batch with pagination and filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `status`: Filter by 'used', 'unused', or 'all'
- `search`: Search codes by text

## Pages

### /promocodes
Main page listing all promo code batches with:
- Batch name and description
- Discount type and value
- Usage statistics with progress bars
- Status indicators
- Action buttons (View, Edit, Codes)

### /promocodes/create
Create new batch page with:
- **Batch Information**: Name, description
- **Discount Settings**: Type, value, minimum order
- **Usage Settings**: Max uses, validity dates
- **Code Upload Methods**:
  - **Manual Entry**: Text area for entering codes
  - **File Upload**: CSV or text file upload
  - **Auto Generate**: Generate codes with prefix and length

### /promocodes/[id]
Batch detail page with:
- **Overview Tab**: Statistics cards, batch details
- **Codes Tab**: Table of all codes with usage status
- Export functionality

## Features

### Bulk Upload Methods

1. **Manual Entry**
   - Text area for entering codes one per line
   - Real-time validation and preview

2. **File Upload**
   - Support for CSV and text files
   - One code per line format
   - Automatic parsing and validation

3. **Auto Generation**
   - Generate codes with custom prefix
   - Configurable code length
   - Bulk generation (up to 10,000 codes)

### Discount Types

1. **Percentage Discount**
   - Value: 0-100%
   - Example: 15% off

2. **Fixed Amount Discount**
   - Value: Dollar amount
   - Example: $10 off

3. **Free Shipping**
   - No value required
   - Applies free shipping

### Usage Tracking

- Track when codes are used
- Record user who used the code
- Store order ID and actual discount applied
- Update batch usage statistics

### Export Functionality

- Export codes to CSV format
- Include usage status and details
- Download with batch name as filename

## Usage Examples

### Creating a Summer Sale Batch

1. Navigate to `/promocodes/create`
2. Enter batch name: "Summer Sale 2024"
3. Set discount type: Percentage, 15%
4. Set minimum order: $50
5. Choose "Auto Generate" method
6. Generate 100 codes with prefix "SUMMER"
7. Set validity dates
8. Create batch

### Uploading Existing Codes

1. Navigate to `/promocodes/create`
2. Enter batch information
3. Choose "File Upload" method
4. Upload CSV file with codes
5. Review preview and create batch

### Monitoring Usage

1. Navigate to `/promocodes`
2. Click on a batch to view details
3. Check usage statistics and progress
4. Export codes for external tracking

## Security Features

- User authentication required for all operations
- Batch ownership validation
- Duplicate code detection
- Input validation and sanitization
- Rate limiting on API endpoints

## Performance Considerations

- Pagination for large code lists
- Indexed database queries
- Efficient bulk operations
- Caching for frequently accessed data

## Future Enhancements

- Code validation rules
- Advanced filtering and search
- Integration with e-commerce platforms
- Analytics and reporting
- A/B testing capabilities
- Email campaign integration 