# Domainatrix

<p align="center">
  <img src="./icon.png" alt="Domainatrix logo" width="300" />
</p>

Domainatrix is a self-hostable domain portfolio manager. Add your domains, let it pull live WHOIS, DNS, SSL, and host data with a single click, and get a clear view of what you own, when things expire, and what registrars are used.

Built with Next.js 16, TypeScript, Tailwind CSS 4, Drizzle ORM, and SQLite.

## Features

- **Dashboard** — portfolio health, expiry/SSL risk, renewal spend, notification coverage, provider breakdowns, recent activity, uptime sparkline, manual checks, uptime checks, and list/grid portfolio preview
- **Expiry timeline** — 12-month SVG timeline on the dashboard showing upcoming domain expirations by urgency
- **Manual checks** — run portfolio checks from the dashboard, compare fresh enrichment against the saved baseline, record changes, and create enabled notifications
- **Uptime checks** — run HTTP uptime checks from the dashboard, review the uptime activity grid on domain detail pages, and notify on down/recovered events when enabled
- **Expiry reminders** — scheduled/manual checks create expiry notifications at key thresholds when enabled
- **Change history** — recent portfolio activity on the dashboard and per-domain recent changes on detail pages
- **Domain inventory** — table with registrar, expiry, status badges, and tags
- **Add domain** — name, registrar autocomplete, expiry date, notes, tags, costings, notification preferences; duplicate detection with link to existing record
- **Edit domain** — update registrar with autocomplete, expiry, notes, tags, costings, and notification preferences
- **Delete domain** — two-click inline confirmation, cascades to all child records
- **Enrich domain** — pulls live WHOIS, DNS (NS/MX/TXT/IPv4/IPv6), SSL cert details, and host geolocation with one click. Results display on the detail page including WHOIS dates/contact/status data
- **Expiry rings** — circular SVG progress rings on domain detail showing domain and SSL expiry urgency
- **Subdomain discovery** — queries crt.sh Certificate Transparency logs and a DNS wordlist HTTP probe; results persist and display in Live/Unresolved groups with source tags
- **Core Web Vitals** — opt-in CrUX card on domain detail with LCP, CLS, and INP radial gauges (requires `CRUX_API_KEY`)
- **Tags** — chip-based tag input on create and edit forms; visible on the domain table and detail page
- **Links** — related URLs for live sites, admin panels, docs, repos, analytics, or any other domain resource
- **Costings** — purchase price, renewal cost, current value, and auto-renew status on create/edit/detail
- **Notification preferences** — per-domain toggles for expiry, SSL, DNS, IP, registrar, WHOIS, host, uptime, and security-status alerts
- **Notification center** — header bell dropdown, `/notifications` page, unread/sent/in-app-only counts, mark-read actions, retry delivery, and a temporary test-notification button
- **Webhook delivery** — optional `NOTIFICATION_WEBHOOK_URL` posts created notifications to Discord, Slack, automation tools, or a custom receiver
- **Email delivery** — optional SMTP settings send created notifications by email when no webhook is configured
- **Scheduled checks** — protected cron endpoint for running portfolio checks from a host or cron service
- **Import/export** — versioned JSON portfolio export and import from Settings

## Development

Install dependencies:

```bash
npm install
```

Copy the environment file:

```bash
cp .env.example .env
```

Set `CRON_SECRET` in `.env` before enabling scheduled checks. For local-only testing, a readable placeholder is fine:

```env
CRON_SECRET=dev-domainatrix-cron-secret-change-me
```

For anything real, generate a long random value:

```bash
openssl rand -base64 32
```

Then paste the generated value into `.env`:

```env
CRON_SECRET=paste-the-generated-value-here
```

Keep `.env.example` as a placeholder and do not commit the real secret.

Optional webhook notification delivery:

```env
NOTIFICATION_WEBHOOK_URL=https://example.com/domainatrix-webhook
```

When this is set, newly created notifications are still stored in the in-app notification center and are also posted as JSON to the webhook. If delivery succeeds, Domainatrix marks the notification as sent. If the webhook is missing or fails, the in-app notification still remains available.

Optional SMTP email delivery:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=alerts@example.com
SMTP_PASS=app-password
NOTIFICATION_EMAIL_FROM=Domainatrix <alerts@example.com>
NOTIFICATION_EMAIL_TO=you@example.com
```

Webhook delivery takes priority when `NOTIFICATION_WEBHOOK_URL` is configured. If no webhook is configured and all SMTP settings are present, Domainatrix sends notifications by email instead.

Optional Core Web Vitals (CrUX) — requires a Google Cloud API key with the Chrome UX Report API enabled:

```env
CRUX_API_KEY=your-google-cloud-api-key
```

When set, domain detail pages show a CrUX card with LCP, CLS, and INP scores. Low-traffic domains without CrUX data show a clean empty state rather than an error.

Run the app:

```bash
npm run dev
```

Example scheduled check:

```bash
curl -fsS \
  -H "Authorization: Bearer paste-the-generated-value-here" \
  http://localhost:3000/api/monitoring/checks/cron
```

If the command runs from the same shell where `CRON_SECRET` is exported, you can use:

```bash
curl -fsS \
  -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/monitoring/checks/cron
```

Useful checks:

```bash
npm run lint
npm run test
npm run typecheck
npm run build
```

Generate migrations after schema changes:

```bash
npm run db:generate
```

Apply migrations manually if needed:

```bash
npm run db:migrate
```

## License

Apache-2.0. See [`LICENSE`](./LICENSE).

Made with 💖 by Pink Pixel.
