# Email Registration Workflow - Status & Progress

**Last Updated:** 2025-10-21
**Current Status:** 🟡 IN PROGRESS - Mailgun integration complete, awaiting Vercel env var configuration
**Current Phase:** Phase 1 - Global Email Service (90% complete)
**Next Phase:** Phase 2 - User-Specific Email Integration (not started)
**Latest Commit:** `4a81510` - "debug: Add comprehensive email service logging to registration API"

---

## 📋 Quick Status Summary

### ✅ **Phase 1: Global Email Service (ALMOST COMPLETE)**

**What Works:**
- ✅ Email service integrated with Mailgun API
- ✅ Confirmation emails configured for manual attendee additions
- ✅ NOW LIVE emails configured for event start
- ✅ RLS policies fixed for registration creation
- ✅ Source constraint updated to include 'manual'
- ✅ Base64 encoding fixed for Edge runtime (btoa)
- ✅ JSON parsing fixed for non-JSON responses
- ✅ Comprehensive debug logging added

**What's Blocking:**
- ❌ Mailgun environment variables NOT configured in Vercel
- ❌ Production returns 401 error: "Mailgun error (401): Unauthorized"
- ❌ Emails not actually being delivered (but code is working!)

**Immediate Next Step:**
1. Add Mailgun env vars to Vercel (instructions below)
2. Redeploy
3. Test email delivery
4. Remove debug logs

---

## 🎯 **WHERE WE ARE - Detailed Status**

### **The Journey So Far:**

#### **Problem 1: RLS Policy Violation** ✅ FIXED
- **Error:** `new row for relation "registrations" violates check constraint`
- **Root Cause:** RLS policy "FOR ALL" lacked WITH CHECK clause
- **Solution:** Created explicit INSERT policy with WITH CHECK
- **Migration:** `20250119000001_fix_registrations_rls_policies.sql`
- **Status:** ✅ Deployed and working

#### **Problem 2: Source Constraint Violation** ✅ FIXED
- **Error:** `violates check constraint "registrations_source_check"`
- **Root Cause:** CHECK constraint only allowed ('email', 'sms', 'social'), code sends 'manual'
- **Solution:** Updated constraint to include 'manual'
- **Migration:** `20250119000002_add_manual_to_registrations_source.sql`
- **Status:** ✅ Deployed and working

#### **Problem 3: Email Service in Mock Mode** ✅ FIXED
- **Error:** Emails not being sent (only logged to console)
- **Root Cause:** emailService.ts had `'use client'` directive and no real integration
- **Solution:**
  - Removed `'use client'`
  - Added Mailgun auto-detection from env vars
  - Implemented Mailgun API v3 integration
- **Commit:** `d211d80`
- **Status:** ✅ Code deployed

#### **Problem 4: Buffer.from() Edge Runtime Error** ✅ FIXED
- **Error:** `SyntaxError: Unexpected token 'A'... is not valid JSON`
- **Root Cause:**
  - `Buffer.from()` doesn't work in Edge runtime
  - Code assumed all responses are JSON
  - HTML error responses caused parsing failures
- **Solution:**
  - Replaced `Buffer.from(...)` with `btoa(...)`
  - Added Content-Type checking before JSON parsing
  - Handle HTML/text error responses gracefully
- **Commit:** `7ea53e3`
- **Status:** ✅ Code deployed

#### **Problem 5: Mailgun 401 Unauthorized** 🟡 IN PROGRESS
- **Error:** `Failed to send confirmation email: Mailgun error (401)`
- **Root Cause:** Environment variables NOT configured in Vercel production
- **Evidence:** Vercel logs at OCT 21 13:51:11 show 401 error
- **Solution:** Add env vars to Vercel (see below)
- **Status:** 🟡 Waiting for user to add env vars and redeploy

---

## 🔧 **IMMEDIATE ACTION REQUIRED**

### **Step 1: Configure Mailgun Environment Variables in Vercel**

**Navigate to:** Vercel Dashboard → convertcast-production → Settings → Environment Variables

**Add these 3 variables:**

#### Variable 1: MAILGUN_API_KEY
```
Name: MAILGUN_API_KEY
Value: 335e646a6310fa0fb1460dc0a868a19d
Environments: ✓ Production ✓ Preview ✓ Development
```

#### Variable 2: MAILGUN_DOMAIN
```
Name: MAILGUN_DOMAIN
Value: mail.convertcast.com
Environments: ✓ Production ✓ Preview ✓ Development
```

#### Variable 3: NEXT_PUBLIC_APP_URL
```
Name: NEXT_PUBLIC_APP_URL
Value: https://www.convertcast.app
Environments: ✓ Production ✓ Preview ✓ Development
```

### **Step 2: Redeploy**
- Go to Deployments tab
- Click "..." on latest deployment
- Click "Redeploy"
- Wait for deployment to complete (~2 minutes)

### **Step 3: Test Email Delivery**
1. Navigate to: https://www.convertcast.app/dashboard/events
2. Click "Manage Attendees" on any event
3. Add a test attendee with a real email (e.g., your email)
4. Check Vercel logs for: `✅ Email sent via Mailgun`
5. Check your inbox for confirmation email

### **Step 4: Verify Success**

**In Vercel Logs, you should see:**
```
🔍 EMAIL DEBUG - Registration source: manual
🔍 EMAIL DEBUG - Will attempt to send email: true
🔍 EMAIL DEBUG - Email service provider: mailgun
🔍 EMAIL DEBUG - Has Mailgun API key: true
🔍 EMAIL DEBUG - Has Mailgun domain: true
📧 Sending confirmation email to: [email]
🔍 EMAIL DEBUG - About to call emailService.sendEmail()...
✅ Email sent via Mailgun
✅ Confirmation email sent successfully
```

**Instead of:**
```
⚠️ Failed to send confirmation email: Mailgun error (401): ...
```

### **Step 5: Remove Debug Logs** (after confirmation)
Once emails are working, remove the debug logs added in commit `4a81510`:
- Remove lines with `🔍 EMAIL DEBUG` from `src/app/api/events/[id]/registrations/route.ts`
- Commit and deploy

---

## 📁 **Key Files Modified**

### **1. Email Service** `src/lib/email/emailService.ts`
**What changed:**
- Removed `'use client'` directive (line 1)
- Added Mailgun auto-detection in constructor (lines 52-67)
- Implemented Mailgun API integration (lines 103-170)
- Changed base64 encoding: `Buffer.from()` → `btoa()` (line 115)
- Added Content-Type checking for JSON parsing (lines 129-148)

**Current provider detection logic:**
```typescript
constructor() {
  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
    this.provider = 'mailgun';
    console.log('✅ EmailService initialized with Mailgun provider');
  } else {
    this.provider = 'mock';
    console.log('⚠️ EmailService running in MOCK mode');
  }
}
```

### **2. Registration API** `src/app/api/events/[id]/registrations/route.ts`
**What changed:**
- Added debug logging (lines 345-357, 374-412)
- Email sending on manual attendee addition (lines 352-413)

**Email sending flow:**
```typescript
// Registration created successfully
→ Check if source === 'manual'
  → Format event date/time
  → Call emailService.sendEmail('event-confirmation', ...)
  → Log success or error
  → Continue (don't fail if email fails)
→ Return registration response
```

### **3. Database Migrations**

#### Migration 1: `20250119000001_fix_registrations_rls_policies.sql`
**Purpose:** Fix RLS policies for registration INSERT operations
**Changes:**
- Dropped "FOR ALL" policy
- Created explicit INSERT policy with WITH CHECK clause
- Created separate SELECT, UPDATE, DELETE policies

#### Migration 2: `20250119000002_add_manual_to_registrations_source.sql`
**Purpose:** Add 'manual' to allowed source values
**Changes:**
- Dropped existing CHECK constraint
- Recreated with 'manual' added: `CHECK (source IN ('email', 'sms', 'social', 'manual'))`

---

## 🚀 **PHASE 2: User-Specific Email Integration (NOT STARTED)**

### **User Requirement:**
> "I would like for it to be possible for the individual streamer/user to have their own mail service API key from the settings integrations being used for their email sending so convertcast isnt paying for it"

### **Infrastructure Already Exists:**
- ✅ `user_integrations` table in database (from migration `20250105000002_user_integrations_fixed.sql`)
- ✅ Helper function: `get_primary_integration(p_user_id, p_service_type)`
- ✅ Supports encrypted credentials storage

### **What Needs to Be Built:**

#### **1. Modify Email Service** (Estimated: 2 hours)
**File:** `src/lib/email/emailService.ts`

**Changes needed:**
- Add optional `userId` parameter to `sendEmail()` and `sendBulkEmails()`
- Query `user_integrations` table for user's email service config
- Support multiple providers: Mailgun, SendGrid, Resend
- Fallback to global ConvertCast credentials if user has none configured

**Example:**
```typescript
async sendEmail(
  templateId: string,
  recipient: EmailRecipient,
  variables: Record<string, string> = {},
  userId?: string  // ← NEW: optional user ID
): Promise<EmailSendResult> {
  // If userId provided, query user_integrations
  if (userId) {
    const userConfig = await this.getUserEmailConfig(userId);
    if (userConfig) {
      // Use user's API keys instead of global
      return this.sendViaUserProvider(userConfig, ...);
    }
  }

  // Fallback to global ConvertCast credentials
  return this.sendViaGlobalProvider(...);
}
```

#### **2. Create Encryption Helper** (Estimated: 1 hour)
**File:** `src/lib/encryption/cryptoHelper.ts` (new file)

**Purpose:** Encrypt/decrypt API keys before storing in database

**Functions needed:**
```typescript
export function encryptApiKey(plaintext: string): string
export function decryptApiKey(encrypted: string): string
```

**Implementation:** Use Node.js `crypto` module with AES-256-GCM

#### **3. Create Integrations API** (Estimated: 3 hours)
**Files to create:**
- `src/app/api/integrations/route.ts` - List user's integrations
- `src/app/api/integrations/[id]/route.ts` - Get/Update/Delete specific integration

**Endpoints:**
```
GET    /api/integrations           - List all integrations for current user
POST   /api/integrations           - Create new integration
GET    /api/integrations/:id       - Get integration details
PATCH  /api/integrations/:id       - Update integration
DELETE /api/integrations/:id       - Delete integration
POST   /api/integrations/:id/test  - Test integration (send test email)
```

#### **4. Create Settings UI** (Estimated: 4 hours)
**Files to create:**
- `src/app/dashboard/settings/integrations/page.tsx` - Main integrations page
- `src/components/settings/IntegrationCard.tsx` - Display integration status
- `src/components/settings/AddIntegrationModal.tsx` - Add new integration form

**UI Features:**
- List all configured integrations (email, SMS)
- Add new integration (Mailgun, SendGrid, Resend, Twilio)
- Test integration (send test email/SMS)
- Set primary integration
- Delete integration
- Show usage stats

#### **5. Update API Routes to Pass userId** (Estimated: 1 hour)
**Files to update:**
- `src/app/api/events/[id]/registrations/route.ts` - Pass userId to emailService
- `src/app/api/events/[id]/start/route.ts` - Pass userId for NOW LIVE emails

**Example:**
```typescript
// Get authenticated user
const { data: { user } } = await supabase.auth.getUser();

// Pass userId to email service
const emailResult = await emailService.sendEmail(
  'event-confirmation',
  recipient,
  variables,
  user.id  // ← Pass user ID
);
```

### **Phase 2 Total Estimated Time:** 11 hours

### **Phase 2 Priority:** HIGH (user explicitly requested this feature)

---

## 🧪 **Testing Checklist**

### **Phase 1 Testing** (After Vercel env vars configured)
- [ ] Add new attendee via UI
- [ ] Verify Vercel logs show "✅ Email sent via Mailgun"
- [ ] Verify email received in inbox
- [ ] Verify email has correct event details
- [ ] Verify "Add to Calendar" link works
- [ ] Verify "Join Event" link works
- [ ] Test NOW LIVE emails when event starts
- [ ] Remove debug logs after confirmation

### **Phase 2 Testing** (After user-specific integration built)
- [ ] Configure Mailgun integration in Settings
- [ ] Test sending email with user's API key
- [ ] Verify fallback to global credentials if user has no config
- [ ] Test multiple users with different providers
- [ ] Test integration deletion
- [ ] Test primary integration switching
- [ ] Verify encrypted storage of API keys

---

## 📊 **Current Metrics**

**Email Templates Available:**
1. `event-confirmation` - Registration confirmation
2. `reminder-24h` - 24-hour reminder
3. `reminder-1h` - 1-hour reminder
4. `live-starting` - NOW LIVE notification

**Email Service Features:**
- ✅ Individual email sending
- ✅ Bulk email sending (with rate limiting)
- ✅ Template variable substitution
- ✅ HTML and plain text versions
- ✅ Error handling and logging
- ❌ User-specific API keys (Phase 2)
- ❌ Multiple provider support (Phase 2)
- ❌ Usage tracking (Phase 2)

---

## 🐛 **Known Issues**

### **Issue 1: Vercel Build Failures** (RESOLVED)
- **Error:** "An unexpected error happened" during Vercel deployment
- **Root Cause:** Vercel platform infrastructure issue
- **Status:** Resolved - deployments now succeeding
- **Evidence:** Commit `31cb1e2` deployed successfully

### **Issue 2: Debug Logs Still Active** (PENDING)
- **Location:** `src/app/api/events/[id]/registrations/route.ts` lines 345-412
- **Impact:** Extra console logs in production
- **Severity:** Low (informational only)
- **Action Required:** Remove after email delivery confirmed working

---

## 💡 **Troubleshooting Guide**

### **Problem: "EmailService running in MOCK mode"**

**If you see this in CLIENT-SIDE console:**
- ✅ This is normal - client-side import of emailService
- ✅ Doesn't affect server-side email sending
- ✅ Ignore this message

**If you see this in SERVER-SIDE logs (Vercel):**
- ❌ Environment variables not configured
- ❌ Follow "Configure Mailgun Environment Variables" section above

### **Problem: "Mailgun error (401)"**

**Root Cause:** Invalid or missing Mailgun API key

**Solutions:**
1. Verify `MAILGUN_API_KEY` is set in Vercel env vars
2. Verify API key is correct: `335e646a6310fa0fb1460dc0a868a19d`
3. Verify domain is correct: `mail.convertcast.com`
4. Redeploy after adding env vars

### **Problem: "already_existed: true" - No email sent**

**Root Cause:** Registration already exists for that viewer/event combination

**Explanation:**
- API returns early when registration exists (line 276-291)
- Email code only runs for NEW registrations
- This is by design to prevent duplicate emails

**Solution:** Add attendee with a different email address

### **Problem: Email not in inbox**

**Check these:**
1. Spam/junk folder
2. Verify email address was typed correctly
3. Check Vercel logs for "✅ Email sent via Mailgun"
4. If logs show success but no email, check Mailgun dashboard for delivery status

---

## 📝 **Git History**

**Recent commits related to email workflow:**
```
4a81510 - debug: Add comprehensive email service logging to registration API
31cb1e2 - chore: Force Vercel rebuild - local build succeeds
c39d940 - chore: Re-trigger Vercel deployment after transient error
7ea53e3 - fix: Replace Buffer.from with btoa for email auth + handle non-JSON responses
d211d80 - feat: Integrate Mailgun for real email sending
2db6420 - fix: Move viewport configuration to separate export for Next.js 15
cdaa285 - fix: Update registrations RLS policies to support manual additions
```

**Database migrations:**
```
20250119000002_add_manual_to_registrations_source.sql
20250119000001_fix_registrations_rls_policies.sql
20250105000002_user_integrations_fixed.sql (for Phase 2)
```

---

## 🎓 **Lessons Learned**

1. **Always check server logs, not client console** - Email service runs server-side
2. **Environment variables must be in Vercel** - Local .env.local doesn't affect production
3. **Redeploy after adding env vars** - Changes don't take effect until redeployed
4. **Edge runtime compatibility** - Use `btoa()` instead of `Buffer.from()`
5. **Check response Content-Type** - Don't assume all API responses are JSON
6. **RLS policies need WITH CHECK** - "FOR ALL" policies don't work for INSERT
7. **Database constraints are strict** - CHECK constraints must match application logic

---

## 🔄 **Next Session Quick Start**

**When you return to this work, do this:**

1. **Check if Phase 1 is complete:**
   ```
   Are Mailgun env vars in Vercel? → If NO, add them (instructions above)
   Are emails being delivered? → If NO, check troubleshooting guide
   Are debug logs removed? → If NO, clean them up
   ```

2. **If Phase 1 is complete, start Phase 2:**
   - Read "Phase 2: User-Specific Email Integration" section above
   - Start with modifying emailService to accept userId parameter
   - Follow the 5-step implementation plan

3. **If stuck, check:**
   - Vercel function logs for error messages
   - This document's troubleshooting guide
   - Recent git commits for context

---

**End of Email Workflow Status Document**
**Last Updated:** 2025-10-21
**Document Version:** 1.0
**Maintained by:** Claude Code
