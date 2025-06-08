# Gmail Email Configuration Guide

## Overview
The Budget Alert Service uses Gmail SMTP to send email notifications. Gmail requires App Passwords for third-party applications since 2022.

## Step-by-Step Setup

### 1. Enable 2-Factor Authentication
- Go to your [Google Account settings](https://myaccount.google.com/)
- Navigate to **Security** → **2-Step Verification**
- Follow the prompts to enable 2FA (required for App Passwords)

### 2. Generate Gmail App Password
- Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
- Select **Mail** as the app
- Choose your device or enter a custom name (e.g., "Budget Alert Service")
- Click **Generate**
- Copy the 16-character password (spaces will be ignored)

### 3. Update Environment Variables
Edit your `.env` file and replace the email settings:

```env
# Replace with your actual Gmail address
EMAIL_USER=your-gmail@gmail.com

# Replace with the 16-character App Password from step 2
EMAIL_PASSWORD=abcd efgh ijkl mnop

# Optional: Customize the sender name
EMAIL_FROM_NAME=DdevFinance Budget Alerts

# Should match EMAIL_USER
EMAIL_FROM_ADDRESS=your-gmail@gmail.com
```

### 4. Test the Configuration
After updating the `.env` file, restart the Budget Alert Service:

```bash
cd budget-alert-service
npm start
```

Look for this message in the logs:
```
✅ Email connection verified
📧 Email Alerts: Enabled
```

## Alternative Email Providers

If you prefer not to use Gmail, you can configure other providers:

### Outlook/Hotmail
```env
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### Yahoo Mail
```env
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
```

### Custom SMTP Server
Update `config/email.js` to use custom SMTP settings instead of the 'gmail' service.

## Troubleshooting

### Common Issues

1. **"Invalid login" error**
   - Make sure you're using an App Password, not your regular Gmail password
   - Verify 2-factor authentication is enabled

2. **"Less secure app access" error**
   - This is an old error. Gmail no longer supports "less secure apps"
   - You must use App Passwords

3. **Connection timeout**
   - Check your firewall settings
   - Ensure port 587 or 465 is not blocked

4. **Rate limiting**
   - Gmail has sending limits (500 emails/day for free accounts)
   - Consider using a dedicated email service for production

### Test Email Functionality

You can test email sending by calling the alerts endpoint:

```bash
curl -X POST http://localhost:3002/api/alerts/test \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "type": "warning"}'
```

## Production Recommendations

For production environments, consider:

1. **Dedicated Email Service**: Use services like SendGrid, Amazon SES, or Mailgun
2. **Domain Email**: Use an email address from your own domain
3. **Email Templates**: Customize the email templates in `services/AlertService.js`
4. **Rate Limiting**: Implement proper rate limiting for email sending
