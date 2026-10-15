# AI Solutions landing funnel

## Routes

- `/ai-solutions/` — primary paid-media landing page
- `/ai-solutions/ai-development/` — Google Ads: AI development
- `/ai-solutions/business-automation/` — Google Ads: business automation
- `/ai-solutions/healthcare/` — LinkedIn: healthcare
- `/ai-solutions/manufacturing/` — LinkedIn: manufacturing
- `/ai-solutions/logistics/` — LinkedIn: logistics
- `/ai-solutions/voice-agents/` — Meta: AI voice agents
- `/thank-you/` — shown only after a confirmed lead response
- `/privacy/` — consultation-form privacy notice
- `/api/leads` — validated lead delivery endpoint

Campaign routes share one component and configuration map. They are marked `noindex` and canonicalize to the main AI Solutions route to prevent near-duplicate search results.

## Required configuration

Copy the relevant values from `.env.example` into the deployment environment. The Oswell Sales Agent is the only lead destination. Configure `CRM_WEBHOOK_URL=https://sales.oswelltechnologies.com/api/public/leads/` and set `CRM_WEBHOOK_TOKEN` to the same secret as `LANDING_PAGE_INGEST_TOKEN` in the Sales Agent environment. The token is sent server-to-server as a bearer token and must never be exposed through a `NEXT_PUBLIC_` variable. A submission is treated as successful only after the Sales Agent confirms storage.

Confirmed submissions appear in **Sales Agent → Leads** as high-priority `New Lead` records with the next action `Review inbound website enquiry`. Business objective and project details are visible in the lead record, while campaign, variant, UTM values, permitted advertising click IDs, and submission timestamps are retained in `landing_lead_submissions`.

`LEAD_NOTIFICATION_WEBHOOK_URL` receives a minimal notification payload after confirmed storage. It deliberately excludes the prospect's personal contact details.

The verified GA4 property is enabled after visitor consent. GTM, Google Ads, Meta Pixel, and LinkedIn IDs remain placeholders until the corresponding accounts provide them. Form values are never sent to analytics platforms.

The Cal.com scheduling link already used on the corporate site is connected. The page records booking CTA clicks only. A real `meeting_booked` event requires a Cal.com webhook or redirect that confirms a completed booking; do not treat a click as a booking conversion.

## Security notes

The endpoint validates and sanitizes input, checks same-origin requests and a custom form header, uses a honeypot and minimum completion time, and applies an in-process rate limit. Production should also enforce rate limiting at the hosting/WAF layer because in-process limits are not shared across serverless instances. Use HTTPS in production and rotate webhook credentials through the hosting secret manager.

## Validation checklist

1. Run `npm run build`.
2. Test required fields, invalid email and URL input, consent, loading state, provider failure, confirmed redirect, and mobile keyboard behavior.
3. Submit one authorized test lead and confirm it appears in Sales Agent → Leads with source `Lead from Website`, including the stored attribution and sales notification.
4. Verify GA4, GTM, Google Ads, Meta, and LinkedIn in each platform's debug tools after IDs are configured and consent is granted.
5. Complete a test Cal.com booking after its confirmation webhook is configured and verify exactly one `meeting_booked` event.
6. Check desktop, tablet, mobile, keyboard navigation, reduced-motion mode, Lighthouse, and network failure behavior.

## Deployment plan

1. Configure the environment variables in staging.
2. Deploy the feature branch to a protected preview environment.
3. Complete the checklist above with authorized test records.
4. Confirm conversion IDs, CRM field mapping, notification recipients, retention policy, and Cal.com confirmation tracking.
5. Deploy the same reviewed revision to production and verify the primary route plus one representative campaign route.

No production deployment should occur without explicit approval.

## Rollback plan

Redeploy the last known-good revision of the site. The funnel is isolated to new routes, so the existing homepage and corporate static pages are unaffected. If lead delivery fails while the page remains live, disable paid campaigns or route their destinations back to the corporate contact page until the previous revision is restored.
