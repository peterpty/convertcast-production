# Credentials Management Guide

## 🔐 **SECURITY CRITICAL - READ CAREFULLY**

All credentials are stored in `.env.local` which is **PROTECTED by .gitignore** and will **NEVER be committed to git**.

---

## ✅ **Current Configuration**

### **✅ Stored in `.env.local`**

```env
# Twilio SMS
TWILIO_ACCOUNT_SID=<configured>
TWILIO_AUTH_TOKEN=<configured>
TWILIO_PHONE_NUMBER=+18889730264

# Mailgun Email
MAILGUN_API_KEY=<configured>
MAILGUN_DOMAIN=mail.convertcast.com
MAILGUN_FROM_EMAIL=registration@mail.convertcast.com
MAILGUN_FROM_NAME=ConvertCast
```

---

## 🧪 **Testing Credentials**

### **Option 1: Test Endpoint (Recommended)**

Visit: `http://localhost:3002/api/test-notifications`

This will test both services without actually sending messages (uses test numbers/domains).

### **Option 2: Manual Test with Real Send**

```bash
# Test Email (replace with real email)
curl -X POST http://localhost:3002/api/test-notifications/send \
  -H "Content-Type: application/json" \
  -d '{"type": "email", "to": "your@email.com"}'

# Test SMS (replace with real phone)
curl -X POST http://localhost:3002/api/test-notifications/send \
  -H "Content-Type: application/json" \
  -d '{"type": "sms", "to": "+1234567890"}'
```

---

## 🚀 **Production Deployment (Vercel)**

### **Step 1: Add Environment Variables in Vercel Dashboard**

1. Go to your Vercel project
2. Click **Settings** → **Environment Variables**
3. Add each variable individually:

```
TWILIO_ACCOUNT_SID = <configured>
TWILIO_AUTH_TOKEN = <configured>
TWILIO_PHONE_NUMBER = +18889730264

MAILGUN_API_KEY = <configured>
MAILGUN_DOMAIN = mail.convertcast.com
MAILGUN_FROM_EMAIL = registration@mail.convertcast.com
MAILGUN_FROM_NAME = ConvertCast

CRON_SECRET = <generate_random_string>
```

### **Step 2: Environment Selection**

- Select **Production**, **Preview**, and **Development**
- This ensures variables are available in all environments

### **Step 3: Redeploy**

After adding variables, trigger a new deployment for changes to take effect.

---

## 🔄 **Rotating Credentials**

### **If You Need to Change Credentials:**

1. **Update `.env.local`** for local development
2. **Update Vercel Environment Variables** for production
3. **Redeploy** your application
4. **Test** using the test endpoint

### **When to Rotate:**

- If credentials are accidentally exposed
- Regular security practice (every 90 days)
- If you suspect unauthorized access
- When team members leave

---

## 🛡️ **Security Best Practices**

### ✅ **DO:**
- Keep `.env.local` in `.gitignore` ✅ (Already done)
- Use environment variables for all secrets ✅ (Already done)
- Test in development before production ✅
- Rotate credentials regularly
- Use separate credentials for dev/staging/production (if available)
- Monitor usage in Twilio/Mailgun dashboards
- Set up billing alerts

### ❌ **DON'T:**
- ❌ Never commit `.env.local` to git
- ❌ Never share credentials in Slack/email
- ❌ Never hardcode credentials in code
- ❌ Never log credentials (even in development)
- ❌ Never use production credentials in development (if you have separate ones)

---

## 📊 **Service Dashboards**

### **Twilio**
- **Dashboard:** https://console.twilio.com/
- **Phone Numbers:** https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
- **Usage & Billing:** https://console.twilio.com/us1/billing/manage-billing/billing-overview
- **Logs:** https://console.twilio.com/us1/monitor/logs/sms

**Your Number:** (888) 973-0264

### **Mailgun**
- **Dashboard:** https://app.mailgun.com/
- **Domain Settings:** https://app.mailgun.com/app/sending/domains/mail.convertcast.com
- **Logs:** https://app.mailgun.com/app/logs
- **API Keys:** https://app.mailgun.com/app/account/security/api_keys

**Your Domain:** mail.convertcast.com
**From Email:** registration@mail.convertcast.com

---

## 💰 **Cost Monitoring**

### **Twilio SMS Pricing**
- **Outbound SMS:** ~$0.0075/message (US)
- **Inbound SMS:** $0.0075/message
- **Phone Number:** $1.00/month

### **Mailgun Email Pricing**
- **First 5,000 emails/month:** FREE (Flex Trial)
- **After 5,000:** $0.80/1,000 emails
- **Email Validation:** $0.001/email (optional)

### **Monthly Cost Estimate (1,000 registrations, 8 notifications)**

| Service | Cost per Notification | Total (8 notifications) | Monthly (4 events) |
|---------|----------------------|-------------------------|-------------------|
| Email Only | $0.64 | $5.12 | $20.48 |
| SMS Only | $7.50 | $60.00 | $240.00 |
| Both | $8.14 | $65.12 | $260.48 |

**Recommendation:** Start with email-only notifications (much cheaper), offer SMS as premium add-on.

---

## 🔍 **Troubleshooting**

### **Email Not Sending**

1. **Check Mailgun Domain Verification**
   - Go to https://app.mailgun.com/app/sending/domains/mail.convertcast.com
   - Ensure DNS records are verified (SPF, DKIM, MX)
   - May take up to 48 hours for DNS propagation

2. **Check API Key Format**
   - Mailgun API keys should be 32 characters (hex)
   - If yours is different, regenerate in Mailgun dashboard

3. **Check Sending Limits**
   - New Mailgun accounts have sending limits
   - Request limit increase if needed

### **SMS Not Sending**

1. **Check Phone Number Format**
   - Must be E.164 format: `+1234567890`
   - No spaces, dashes, or parentheses

2. **Check Twilio Number Capabilities**
   - Go to https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
   - Ensure "SMS" is enabled for your number

3. **Check Geographic Permissions**
   - Twilio restricts SMS to certain countries by default
   - Enable additional countries in Twilio settings if needed

### **Test Endpoint Returns Errors**

1. **Restart development server** after adding environment variables
2. **Check for typos** in variable names (must match exactly)
3. **Check logs** in terminal for detailed error messages
4. **Verify credentials** in Twilio/Mailgun dashboards

---

## 📝 **Environment Variables Checklist**

### **Local Development (`.env.local`)**
- [ ] TWILIO_ACCOUNT_SID
- [ ] TWILIO_AUTH_TOKEN
- [ ] TWILIO_PHONE_NUMBER
- [ ] MAILGUN_API_KEY
- [ ] MAILGUN_DOMAIN
- [ ] MAILGUN_FROM_EMAIL
- [ ] MAILGUN_FROM_NAME
- [ ] CRON_SECRET

### **Production (Vercel Dashboard)**
- [ ] All variables from above
- [ ] Selected for Production environment
- [ ] Selected for Preview environment
- [ ] Application redeployed

---

## 🎯 **Next Steps**

1. **Test Credentials**
   ```bash
   # Visit test endpoint
   open http://localhost:3002/api/test-notifications
   ```

2. **Verify Mailgun Domain**
   - Check DNS records in Mailgun dashboard
   - Send test email to your own address

3. **Verify Twilio Number**
   - Send test SMS to your own phone
   - Check Twilio logs for delivery confirmation

4. **Implement Event Scheduling APIs**
   - Continue with Phase 1 of EVENT_SCHEDULING_IMPLEMENTATION.md

5. **Set Up Production**
   - Add environment variables to Vercel
   - Deploy and test in production

---

## 🆘 **Support**

### **Twilio Support**
- Docs: https://www.twilio.com/docs
- Support: https://support.twilio.com/

### **Mailgun Support**
- Docs: https://documentation.mailgun.com/
- Support: https://help.mailgun.com/

---

**Last Updated:** 2025-10-04
**Status:** ✅ Credentials Configured - Ready for Testing
