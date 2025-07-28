# Drizzle ORM Integration - Local-First Database Architecture

This document describes the implementation of Drizzle ORM integration for the offline-first architecture, replacing the previous raw SQL.js implementation with a type-safe, schema-driven approach.

## Overview

The Drizzle integration provides:
- **Type-safe database operations** using Drizzle ORM
- **Schema-first approach** mirroring backend PostgreSQL structure
- **Automatic migrations** and data validation
- **Performance optimizations** through proper indexing
- **Developer experience** improvements with IntelliSense and error catching

## Architecture

### File Structure

```
client/src/core/database/
├── index.ts                    # Main exports
├── client.ts                   # Database client with sql.js integration
├── types.ts                    # Common types and utilities
└── schema/
    ├── index.ts                # Schema exports
    ├── users.ts                # User table schema
    ├── currencies.ts           # Currency table schema + seed data
    ├── accounts.ts             # Account table schema
    ├── categories.ts           # Category table schema
    ├── transactions.ts         # Transaction table schema
    ├── preferences.ts          # Preferences table schema
    └── tags.ts                 # Tags table schema
```

### Core Components

#### 1. LocalDatabaseClient (`client.ts`)
- Manages SQLite database initialization with sql.js
- Handles schema creation and data seeding
- Provides Drizzle ORM instance for type-safe queries
- Manages data persistence to localStorage

#### 2. Database Schemas (`schema/`)
- Complete table definitions mirroring backend PostgreSQL
- Type-safe field definitions with proper constraints
- Default values and validation rules
- Support for relationships and foreign keys

#### 3. DrizzleQueryService (`services/drizzle-query.service.ts`)
- Replaces the old SQLiteIndexService
- Provides type-safe query methods
- Handles CRDT data synchronization
- Optimized query performance with proper joins

## Migration from SQLite Service

### Before (Raw SQL)
```typescript
// Raw SQL queries with potential runtime errors
this.db.run(`
  INSERT INTO transactions (id, amount, type, account_id, category_id)
  VALUES (?, ?, ?, ?, ?)
`, [id, amount, type, accountId, categoryId]);
```

### After (Drizzle ORM)
```typescript
// Type-safe operations with compile-time validation
await db.insert(schema.transactions).values({
  id,
  amount,
  type,
  accountId,
  categoryId,
});
```

## Schema Design

### Core Principles
1. **Backend Compatibility**: All schemas mirror backend PostgreSQL tables
2. **Type Safety**: Full TypeScript integration with proper typing
3. **Validation**: Built-in data validation and constraints
4. **Performance**: Proper indexing for common query patterns

### Key Features
- **Audit Fields**: `created_at`, `updated_at`, `deleted_at` for all tables
- **Soft Deletes**: Using `deleted_at` field instead of hard deletes
- **Foreign Keys**: Proper relationships between tables
- **JSON Fields**: Support for flexible metadata storage
- **Enums**: Type-safe enums for constrained values

## Usage Examples

### Initialize Database
```typescript
import { localDb } from '@/core/database';

await localDb.initialize();
const db = localDb.get();
```

### Type-Safe Queries
```typescript
import { eq, and, desc } from 'drizzle-orm';
import { schema } from '@/core/database';

// Get transactions with account info
const transactions = await db
  .select()
  .from(schema.transactions)
  .leftJoin(schema.accounts, eq(schema.transactions.accountId, schema.accounts.id))
  .where(and(
    eq(schema.transactions.type, 'expense'),
    isNull(schema.transactions.deletedAt)
  ))
  .orderBy(desc(schema.transactions.transactionDatetime));
```

### CRDT Integration
```typescript
import { drizzleQueryService } from '@/core/offline-first';

// Rebuild database from CRDT data
await drizzleQueryService.rebuildFromCRDT(
  transactions,
  accounts,
  categories
);
```

## Performance Optimizations

### Indexing Strategy
- **Primary Keys**: All tables have UUID primary keys
- **Foreign Keys**: Indexed for join performance
- **Query Patterns**: Indexes on commonly filtered fields
- **Date Ranges**: Optimized for transaction date filtering

### Query Optimization
- **Selective Loading**: Only load required fields
- **Proper Joins**: Efficient LEFT JOINs for optional data
- **Pagination Support**: Built-in limit/offset handling
- **Batch Operations**: Efficient bulk inserts and updates

## Testing

### Browser Console Testing
```javascript
// Test complete integration
await validateDrizzleIntegration();

// Test specific operations
const db = localDb.get();
const stats = await drizzleQueryService.getStats();
console.log('Database stats:', stats);
```

### Validation Tests
- Schema creation and migration
- CRDT data synchronization
- Query performance and correctness
- Data integrity and validation

## Benefits Over Raw SQL

### Developer Experience
- **IntelliSense**: Full autocomplete and type checking
- **Error Prevention**: Compile-time error catching
- **Refactoring Safety**: Automated schema updates
- **Documentation**: Self-documenting schema definitions

### Performance
- **Query Optimization**: Automatic query optimization
- **Index Management**: Proper index creation and usage
- **Batch Operations**: Efficient bulk data operations
- **Memory Management**: Optimized object creation

### Maintenance
- **Schema Evolution**: Easy schema migrations
- **Code Organization**: Clean separation of concerns
- **Testing**: Better unit test capabilities
- **Debugging**: Improved error messages and debugging

## Future Enhancements

### Planned Features
1. **Schema Migrations**: Automated migration system
2. **Query Caching**: Intelligent query result caching
3. **Compression**: Data compression for storage efficiency
4. **Backup/Restore**: Database backup and restore functionality

### Performance Improvements
1. **Virtual Tables**: Support for virtual tables and views
2. **Full-Text Search**: Advanced search capabilities
3. **Analytics Queries**: Optimized analytical query support
4. **Real-time Updates**: Live query subscriptions

## Migration Guide

### For Existing Code
1. Replace `sqliteIndexService` imports with `drizzleQueryService`
2. Update raw SQL queries to use Drizzle query builder
3. Replace manual table creation with schema definitions
4. Update test files to use new validation functions

### Breaking Changes
- Raw SQL queries need to be converted to Drizzle syntax
- Table structure changes require schema updates
- Performance characteristics may differ for complex queries

## Troubleshooting

### Common Issues
1. **Type Errors**: Ensure proper schema imports and typing
2. **Migration Failures**: Check schema compatibility
3. **Performance Issues**: Review query patterns and indexing
4. **Data Loss**: Always backup before major migrations

### Debug Tools
- Browser console testing functions
- Query logging and performance monitoring
- Schema validation and integrity checks
- CRDT synchronization verification