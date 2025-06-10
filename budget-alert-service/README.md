# Budget Alert Service

A microservice for budget management and alerting in the DdevFinance application.

## 🎯 Overview

The Budget Alert Service is a standalone microservice that handles:
- **Budget Planning**: Create and manage user budgets per category
- **Real-time Transaction Processing**: Monitor spending against budgets
- **Automated Alerts**: Send email notifications when budget thresholds are exceeded
- **Budget Tracking**: Track spending patterns and budget utilization

## 🏗️ Architecture

```
budget-alert-service/
├── config/           # Database and email configuration
├── controllers/      # HTTP request handlers
├── routes/          # API route definitions
├── services/        # Core business logic
├── utils/           # Helper functions and utilities
├── migrations/      # Database schema and setup
├── index.js         # Main application entry point
└── package.json     # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL database (shared with main server)
- Email service credentials (Gmail, SMTP, etc.)

### Installation

1. **Install dependencies**
   ```bash
   cd budget-alert-service
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**
   ```bash
   # Run the migration (if not already done)
   psql -d your_database -f migrations/budget_service_setup.sql
   ```

4. **Start the service**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The service will start on `http://localhost:3002`

## 🔧 Configuration

### Environment Variables

```env
# Database (same as main server)
DATABASE_URL=postgresql://username:password@localhost:5432/ddevfinance

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Service Configuration
PORT=3002
NODE_ENV=production
```

### Email Setup

For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in `EMAIL_PASSWORD`

## 📡 API Endpoints

### Core Transaction Processing

```http
POST /api/transactions
Content-Type: application/json

{
  "user_id": "uuid",
  "category_id": "uuid", 
  "amount": 150.00,
  "transaction_type": "expense",
  "transaction_date": "2024-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction processed successfully",
  "data": {
    "budgetChecks": [
      {
        "budgetId": "uuid",
        "budgetName": "Monthly Food Budget",
        "alertSent": true,
        "alertType": "warning"
      }
    ]
  }
}
```

### Budget Management

```http
# Create Budget
POST /api/budgets
{
  "user_id": "uuid",
  "category_id": "uuid",
  "budget_name": "Monthly Food Budget",
  "budget_amount": 500.00,
  "period_type": "monthly",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31"
}

# Get User Budgets
GET /api/budgets/{userId}

# Update Budget
PUT /api/budgets/{userId}/{budgetId}

# Delete Budget
DELETE /api/budgets/{userId}/{budgetId}
```

### Alert Management

```http
# Get User Alerts
GET /api/alerts/{userId}

# Mark Alert as Read
PUT /api/alerts/{userId}/{alertId}/read

# Get Unread Count
GET /api/alerts/{userId}/unread-count
```

## 🔄 Integration with Main Server

### Transaction Hook

After processing any expense transaction in your main server, call the budget service:

```javascript
// In your main server transaction controller
async function createTransaction(req, res) {
  try {
    // ... process transaction in main database ...
    
    // Call budget alert service
    const budgetCheckResponse = await fetch('http://localhost:3002/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: transaction.user_id,
        category_id: transaction.category_id,
        amount: transaction.amount,
        transaction_type: transaction.type,
        transaction_date: transaction.created_at
      })
    });
    
    const budgetResult = await budgetCheckResponse.json();
    console.log('Budget check result:', budgetResult);
    
    // ... return transaction response ...
  } catch (error) {
    console.error('Budget service error:', error);
    // Continue with transaction even if budget service fails
  }
}
```

### Safe Integration

The service is designed to be **fault-tolerant**:
- If the budget service is down, your main transaction processing continues
- All database operations are in separate transactions
- Email failures don't affect budget calculations
- Comprehensive error handling and logging

## 🧪 Testing

### Test Transaction Processing
```bash
curl -X POST http://localhost:3002/api/transactions/test \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-user-uuid",
    "category_id": "your-category-uuid",
    "amount": 100
  }'
```

### Health Check
```bash
curl http://localhost:3002/api/health
```

### Preview Transaction Impact
```bash
curl -X POST http://localhost:3002/api/transactions/preview \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "uuid",
    "category_id": "uuid",
    "amount": 200,
    "transaction_type": "expense"
  }'
```

## 📊 Budget Alert Logic

### Alert Thresholds
- **Warning Alert**: 80% of budget spent (configurable)
- **Exceeded Alert**: 100% or more of budget spent

### Alert Prevention
- Only one alert per type per budget per 24-hour period
- Alerts respect user notification preferences
- Email failures are logged but don't block processing

### Budget Periods
- **Daily**: Current day
- **Weekly**: Sunday to Saturday
- **Monthly**: First to last day of month
- **Yearly**: January 1 to December 31

## 🗄️ Database Schema

The service uses existing tables from the main database:
- `tblbudget` - Budget definitions
- `tblbudgetalert` - Alert records
- `tblbudgetspending` - Cached spending summaries
- `tblnotificationpreference` - User alert preferences

## 🔍 Monitoring

### Logs
- All transactions are logged with timestamps
- Budget checks and alert sending are tracked
- Database errors are captured and logged

### Health Endpoints
- `GET /api/health` - Service health
- `GET /api/transactions/health` - Transaction processing health
- `GET /api/transactions/stats` - Service statistics

## 🛡️ Security

- Rate limiting (1000 requests per 15 minutes)
- Input validation and sanitization
- SQL injection prevention
- CORS protection
- Helmet security headers

## 🚀 Production Deployment

### Environment Setup
```bash
NODE_ENV=production
PORT=3002
DATABASE_URL=your-production-db-url
EMAIL_HOST=your-smtp-host
```

### Process Management
```bash
# Using PM2
pm2 start index.js --name budget-alert-service

# Using systemd
sudo systemctl enable budget-alert-service
sudo systemctl start budget-alert-service
```

### Nginx Proxy (Optional)
```nginx
location /budget-api/ {
    proxy_pass http://localhost:3002/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `DATABASE_URL` environment variable
   - Ensure PostgreSQL is running
   - Verify database credentials

2. **Email Alerts Not Working**
   - Check `EMAIL_*` environment variables
   - Verify SMTP credentials
   - Check email service logs

3. **Budget Calculations Incorrect**
   - Run budget recalculation: `POST /api/transactions/recalculate/{userId}`
   - Check transaction categorization
   - Verify budget date ranges

### Debug Mode
```bash
NODE_ENV=development npm run dev
```

## 🤝 Contributing

1. Follow existing code patterns
2. Add proper error handling
3. Include input validation
4. Update documentation
5. Test thoroughly

## 📝 License

MIT License - see LICENSE file for details.

---

**Need Help?** Check the API documentation at `http://localhost:3002/api/info` when the service is running.
