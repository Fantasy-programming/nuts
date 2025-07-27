# Transaction Rules

The transaction rules feature allows you to automatically categorize and organize your transactions based on custom rules. This helps maintain consistency and saves time when managing your finances.

## 🔧 Features

### Rule Conditions
Rules can be triggered based on the following conditions:

- **Description**: Match transaction descriptions using text comparison
  - Equals, Does not equal, Contains, Does not contain, Starts with, Ends with
- **Amount**: Match transaction amounts using numerical comparison
  - Equals, Greater than, Greater than or equal, Less than, Less than or equal
- **Account**: Match specific accounts by name or ID
- **Direction**: Match transaction direction (Incoming, Outgoing, Internal)
- **Type**: Match transaction type (Income, Expense, Transfer)
- **Category**: Match specific categories

### Rule Actions
When conditions are met, rules can perform these actions:

- **Set Category**: Automatically assign a category to the transaction
- **Set Description**: Override or modify the transaction description
- **Set Tags**: Add tags to the transaction for better organization
- **Set Note**: Add notes to the transaction details

### Rule Logic
- Multiple conditions can be combined using AND/OR logic
- Rules are processed in priority order (higher priority first)
- Only the first matching rule is applied to each transaction
- Rules can be enabled/disabled without deletion

## 📋 Usage

### Creating Rules

1. Navigate to **Settings** → **Rules**
2. Click **"Create Rule"**
3. Define rule conditions:
   - Select condition type (description, amount, etc.)
   - Choose operator (equals, contains, etc.)
   - Enter comparison value
   - Add multiple conditions with AND/OR logic
4. Define actions to take when conditions match
5. Set rule priority (higher numbers = higher priority)
6. Save the rule

### Managing Rules

- **Enable/Disable**: Toggle rules on/off using the switch
- **Edit**: Modify conditions, actions, and priority
- **Delete**: Remove rules permanently
- **Reorder**: Use priority settings to control execution order

### Rule Examples

**Example 1: Grocery Store Auto-Categorization**
```json
{
  "name": "Auto-categorize Groceries",
  "conditions": {
    "operator": "OR",
    "rules": [
      {
        "field": "description",
        "operator": "contains",
        "value": "grocery"
      },
      {
        "field": "description", 
        "operator": "contains",
        "value": "supermarket"
      }
    ]
  },
  "actions": {
    "set_category": "groceries"
  }
}
```

**Example 2: Large Expense Flagging**
```json
{
  "name": "Flag Large Expenses",
  "conditions": {
    "operator": "AND",
    "rules": [
      {
        "field": "amount",
        "operator": "greater_than",
        "value": 500
      },
      {
        "field": "type",
        "operator": "equals", 
        "value": "expense"
      }
    ]
  },
  "actions": {
    "set_note": "Large expense - review needed",
    "set_tags": ["review-needed", "large-expense"]
  }
}
```

**Example 3: Income Categorization**
```json
{
  "name": "Categorize Salary",
  "conditions": {
    "operator": "AND",
    "rules": [
      {
        "field": "type",
        "operator": "equals",
        "value": "income"
      },
      {
        "field": "account",
        "operator": "equals",
        "value": "Checking Account"
      }
    ]
  },
  "actions": {
    "set_category": "salary"
  }
}
```

## API Endpoints

### Rules Management
- `GET /api/rules` - List all rules
- `POST /api/rules` - Create a new rule
- `GET /api/rules/{id}` - Get rule details
- `PUT /api/rules/{id}` - Update a rule
- `DELETE /api/rules/{id}` - Delete a rule
- `POST /api/rules/{id}/toggle` - Toggle rule active status

### Rule Application
- `POST /api/rules/apply/{transactionId}` - Apply rules to a specific transaction

## Technical Implementation

### Database Schema
```sql
CREATE TABLE transaction_rules (
    id UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    deleted_at TIMESTAMPTZ
);
```

### Rule Processing
1. When a transaction is created, the system fetches all active rules for the user
2. Rules are sorted by priority (descending) and creation date
3. Each rule is evaluated against the transaction data
4. The first matching rule's actions are applied to the transaction
5. Rule application is logged but doesn't fail transaction creation

### Condition Evaluation
- String conditions are case-insensitive
- Amount conditions support decimal precision
- Account/Category conditions can match by ID or name
- Direction conditions map transaction types to user-friendly labels

## Performance Considerations

- Rules are only fetched for active users
- Rule evaluation is performed asynchronously after transaction creation
- Failed rule applications don't affect transaction creation
- Rules are cached per user session

## Security

- Users can only create/modify their own rules
- Rule conditions and actions are validated on the server
- SQL injection protection through parameterized queries
- User authorization required for all rule operations

## Future Enhancements

- Rule templates for common scenarios
- Bulk rule application to existing transactions
- Rule testing and preview functionality
- Advanced condition types (date ranges, recurring patterns)
- Rule performance analytics and suggestions