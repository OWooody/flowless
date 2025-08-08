# Scripts Directory

This directory contains utility scripts for development and maintenance tasks.

## Script Files

### Database Scripts
- `check-prisma-models.js` - Verify Prisma model definitions
- `check-tables.js` - Check database table structure
- `check-kb-data.js` - Verify knowledge base data

### Authentication Scripts
- `create-jwt.js` - JWT token creation utility

## Usage

These scripts can be run to perform maintenance and verification tasks:

```bash
# Check database models
node scripts/check-prisma-models.js

# Check database tables
node scripts/check-tables.js

# Check knowledge base data
node scripts/check-kb-data.js

# Create JWT token
node scripts/create-jwt.js
```

## Note

These are development utilities and may need updates as the codebase evolves. 