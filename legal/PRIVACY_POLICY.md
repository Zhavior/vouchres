# VouchEdge Privacy Policy

**Last updated:** June 26, 2026

This Privacy Policy describes how VouchEdge ("we," "us," or "our") collects, uses, and shares your personal information when you use our website, mobile app, and services (collectively, "VouchEdge" or the "Service").

---

## 1. WHO WE ARE

VouchEdge is operated by **[REVIEW: Legal entity name — e.g. "VouchEdge Inc., a Delaware corporation"]**.

- Contact email: privacy@vouchedge.app
- Mailing address: **[REVIEW: Full business address]**
- Data Protection Officer (if applicable): **[REVIEW: Required for EU/UK users under GDPR. Can be the same as contact email for small operations.]** privacy@vouchedge.app

---

## 2. INFORMATION WE COLLECT

### 2.1 Information you provide
- **Account information:** email address, username, display name, password (hashed)
- **Profile information:** bio, avatar, jurisdiction
- **Beta signup:** email address (if you join the waitlist before signing up)
- **Payment information:** processed by Stripe — we do not store your card number, CVV, or full card details. We store your Stripe customer ID and subscription status.
- **Content you post:** picks, posts, comments, likes

### 2.2 Information collected automatically
- **Usage data:** pages visited, features used, time spent, IP address
- **Device information:** browser type, operating system, screen size
- **Authentication tokens:** Supabase JWT session tokens (stored in your browser's localStorage)
- **Cookies and similar technologies:** see Section 7 below

### 2.3 Information from third parties
- **Supabase:** provides authentication infrastructure — they process your email and login credentials
- **Stripe:** processes your payments — they receive your billing name, address, and payment method
- **MLB Stats API:** we fetch game data from MLB Advanced Media's public API. We do not send them your personal information.

### 2.4 Sensitive information we do NOT collect
We do **not** collect:
- Government-issued ID numbers (SSN, passport, etc.)
- Bank account numbers (Stripe handles all payment info)
- Precise geolocation (we only store the jurisdiction you self-report)
- Biometric data
- Health information
- Information about your betting activity on third-party sportsbooks

---

## 3. HOW WE USE YOUR INFORMATION

### 3.1 To provide the Service
- Create and manage your account
- Display your profile and content to other users
- Grade your picks and compute trust scores
- Process subscription payments
- Send service-related notifications (pick grades, subscription renewals)

### 3.2 To communicate with you
- Account verification emails
- Beta waitlist invitations
- Service announcements
- Customer support responses
- **[REVIEW: Marketing emails — opt-in required in most jurisdictions. Default to opt-OUT for transactional, opt-IN for marketing.]**

### 3.3 To improve the Service
- Aggregate, anonymized analytics (e.g. PostHog, if implemented)
- Debugging and error analysis (e.g. Sentry, if implemented)
- Model improvement — we may use aggregated, anonymized pick data to improve our prediction models

### 3.4 To protect the Service
- Detect and prevent fraud, abuse, and unauthorized access
- Enforce rate limits and free-tier quotas
- Comply with legal obligations

### 3.5 Legal basis (GDPR/UK GDPR)
For users in the European Economic Area, United Kingdom, and Switzerland, we process your personal information on the following legal bases:
- **Contract** (Art. 6(1)(b)): to provide the Service you requested
- **Legitimate interests** (Art. 6(1)(f)): to prevent fraud, improve the Service, and ensure security
- **Consent** (Art. 6(1)(a)): for marketing emails and non-essential cookies
- **Legal obligation** (Art. 6(1)(c)): to comply with applicable laws

You may withdraw consent at any time by emailing privacy@vouchedge.app.

---

## 4. HOW WE SHARE YOUR INFORMATION

### 4.1 Service providers
We share personal information with the following categories of service providers:
- **Supabase** (database and authentication) — https://supabase.com/privacy
- **Stripe** (payment processing) — https://stripe.com/privacy
- **Google Cloud / Google AI** (Gemini API for AI explanations) — https://policies.google.com/privacy
- **Render** (web hosting) — https://render.com/privacy
- **Sentry** (error tracking, if enabled) — https://sentry.io/privacy/
- **PostHog** (product analytics, if enabled) — https://posthog.com/privacy

### 4.2 Other users
Your profile (username, display name, avatar, bio, tier, trust score, picks, posts) is visible to other VouchEdge users. Your email address is never shown to other users.

### 4.3 Legal compliance
We may disclose your information if required to do so by law, court order, or government request, or if we believe in good faith that disclosure is necessary to:
- Protect the rights, property, or safety of VouchEdge, our users, or others
- Investigate fraud or violations of these Terms
- Respond to a valid legal request

### 4.4 Business transfers
If VouchEdge is involved in a merger, acquisition, or sale of assets, your information may be transferred. We will notify you via email before your information is transferred under different ownership.

### 4.5 We do NOT sell your data
We do not sell your personal information to third parties. **[REVIEW: CCPA/CPRA requires this explicit statement. Confirm with counsel.]**

---

## 5. DATA RETENTION

### 5.1 Account data
We retain your account information for as long as your account is active. If you delete your account, we will delete your account information within 30 days, except:
- Picks and posts may be retained in anonymized form for historical grading and trust-score integrity
- Information required for legal compliance or dispute resolution

### 5.2 Payment records
We retain Stripe customer IDs and subscription records for 7 years (or as required by tax law) after account deletion.

### 5.3 Usage logs
Server logs (IP addresses, request timestamps) are retained for 90 days for security and debugging purposes.

### 5.4 Beta signup emails
If you join the waitlist but never create an account, we retain your email for 2 years. Email privacy@vouchedge.app to have it removed sooner.

---

## 6. YOUR RIGHTS

### 6.1 Rights under GDPR/UK GDPR (EEA, UK, Switzerland users)
You have the right to:
- **Access** — request a copy of your personal data
- **Rectification** — request correction of inaccurate data
- **Erasure** ("right to be forgotten") — request deletion of your data
- **Restriction** — request that we limit processing of your data
- **Portability** — request your data in a machine-readable format
- **Objection** — object to processing based on legitimate interests
- **Withdraw consent** — for processing based on consent

To exercise these rights, email privacy@vouchedge.app. We will respond within 30 days.

### 6.2 Rights under CCPA/CPRA (California residents)
You have the right to:
- Know what personal information we collect and who we share it with
- Request deletion of your personal information
- Correct inaccurate personal information
- Opt out of the "sale" or "sharing" of your personal information (we do not sell or share your data)
- Not be discriminated against for exercising these rights

To exercise these rights, email privacy@vouchedge.app.

### 6.3 Other US states
**[REVIEW: If you have users from Virginia, Colorado, Connecticut, Utah, or other states with comprehensive privacy laws, add state-specific rights language as needed.]**

### 6.4 Account deletion
You can delete your account at any time via Settings. Deletion is irreversible and will:
- Remove your profile, posts, and comments (after a 30-day grace period)
- Anonymize your graded picks (we keep the pick record for trust-score integrity, but remove the user_id)
- Cancel any active subscription

---

## 7. COOKIES AND TRACKING

### 7.1 Essential cookies/storage
We use browser localStorage and session cookies to:
- Maintain your authentication session
- Remember your theme and UI preferences
- Store your draft posts and parlay slips

These are required for the Service to function and cannot be disabled.

### 7.2 Analytics cookies (if enabled)
If we implement PostHog or similar analytics, we use cookies to:
- Understand how users interact with VouchEdge
- Identify errors and performance issues
- Measure feature adoption

These are optional and can be disabled via your browser settings.

### 7.3 No advertising cookies
We do not use advertising cookies or share data with advertising networks.

---

## 8. INTERNATIONAL DATA TRANSFERS

VouchEdge is hosted in the United States. If you access VouchEdge from outside the US, your information will be transferred to the US and processed there.

For users in the EEA, UK, or Switzerland, we rely on **Standard Contractual Clauses** (SCCs) approved by the European Commission to ensure appropriate safeguards for international transfers. **[REVIEW: Confirm SCC coverage with counsel. Supabase and Stripe both publish their DPA — link to them.]**

---

## 9. SECURITY

### 9.1 Technical safeguards
We use industry-standard security measures including:
- HTTPS/TLS encryption for all data in transit
- Supabase Row-Level Security (RLS) to enforce data isolation between users
- Server-side storage of API keys (never exposed to the browser)
- Hashed passwords (managed by Supabase Auth)
- Rate limiting to prevent abuse

### 9.2 No perfect security
No method of transmission or storage is 100% secure. We cannot guarantee absolute security, but we work to protect your information using reasonable commercial efforts.

### 9.3 Breach notification
If we become aware of a data breach affecting your personal information, we will notify you and the relevant supervisory authority within 72 hours, as required by GDPR Article 33/34. **[REVIEW: Confirm your breach-response procedure with counsel.]**

---

## 10. CHILDREN'S PRIVACY

VouchEdge is not directed at children under 21, and we do not knowingly collect personal information from children under 21. If you believe we have collected information from a minor, contact privacy@vouchedge.app immediately so we can delete it.

---

## 11. YOUR CALIFORNIA PRIVACY RIGHTS (CCPA/CPRA)

### 11.1 Categories of personal information we collect
Under California law, we collect the following categories:
- **Identifiers:** email address, username, account ID
- **Customer records:** subscription tier, payment status (processed by Stripe)
- **Internet activity:** pages visited, features used, IP address
- **Geolocation:** self-reported jurisdiction (state-level only)

### 11.2 We do not sell or share
We do not sell your personal information, nor do we "share" it (as defined by CPRA) with third parties for cross-context behavioral advertising.

### 11.3 Sensitive personal information
We do not collect "sensitive personal information" as defined by CPRA (e.g. SSN, driver's license, financial account credentials, health information, precise geolocation).

### 11.4 Right to limit
Because we do not collect sensitive personal information, your right to limit its use under CPRA does not apply to VouchEdge.

---

## 12. CHANGES TO THIS PRIVACY POLICY

We may update this Privacy Policy from time to time. If we make material changes, we will notify you by email or in-app notification at least 30 days before the changes take effect. The "Last updated" date at the top of this policy indicates when it was last revised.

---

## 13. CONTACT

If you have questions about this Privacy Policy or your personal information, contact us:

- Email: privacy@vouchedge.app
- Mailing address: **[REVIEW: Full business address]**
- For EU/UK data protection inquiries: privacy@vouchedge.app

---

## 14. SUPERVISORY AUTHORITY (EU/UK USERS)

You have the right to lodge a complaint with your local supervisory authority if you believe we have violated your privacy rights. The supervisory authority in your country can be found at:

- EU: https://edpb.europa.eu/about-edpb/about-edpb/members_en
- UK: Information Commissioner's Office (ICO) — https://ico.org.uk

You may also contact us first — we will work to resolve your concern.

---

## ACKNOWLEDGMENT

By creating an account, you acknowledge that you have read and understood this Privacy Policy and consent to the collection, use, and sharing of your information as described herein.

---

**[REVIEW CHECKLIST — Complete before launch]**

- [ ] Insert legal entity name and business address
- [ ] Confirm governing jurisdiction
- [ ] Verify all third-party subprocessors are listed (Supabase, Stripe, Render, Google AI, Sentry, PostHog — remove any you don't use; add any you do)
- [ ] Sign Data Processing Agreements (DPAs) with each subprocessor
- [ ] Configure Supabase to use a non-US region if serving EU users (or rely on SCCs)
- [ ] Implement a cookie consent banner if serving EU/UK users
- [ ] Set up a data subject access request (DSAR) workflow — email privacy@vouchedge.app should route to a tracked mailbox
- [ ] Add a "Do Not Sell/Share My Personal Information" link in the footer (required for CCPA even if you don't sell data)
- [ ] Have counsel review the final policy
- [ ] Publish at /privacy and link in footer
