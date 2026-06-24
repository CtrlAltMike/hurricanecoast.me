# Hurricane Slack Alerts Worker

This Worker posts three kinds of messages into the `ebbline.slack.com` workspace:

- Ko-fi donation events to `#ko-fi-donations`
- Reader feedback to `#hurricane-feedback`
- Daily and weekly Cloudflare Web Analytics traffic summaries to `#hurricane-traffic`

The static site should never contain Slack webhook URLs, Ko-fi verification tokens, or Cloudflare API tokens. Keep all of those in Worker secrets.

## Endpoints

- `POST /kofi` receives Ko-fi webhook payloads.
- `POST /feedback` receives first-party reader feedback submissions from the static site.
- `POST /traffic/digest` manually sends a daily or weekly digest for testing. Requires `Authorization: Bearer $ADMIN_TOKEN`.
- `GET /health` returns a basic health response.

## Slack setup

Create three Slack incoming webhooks:

- `#ko-fi-donations` -> `SLACK_DONATIONS_WEBHOOK_URL`
- `#hurricane-feedback` -> `SLACK_FEEDBACK_WEBHOOK_URL`
- `#hurricane-traffic` -> `SLACK_TRAFFIC_WEBHOOK_URL`

Slack incoming webhooks accept a JSON payload and post it to the channel selected when the webhook is created.

## Cloudflare setup

From this directory:

```sh
npm install --save-dev wrangler
```

`wrangler.jsonc` contains the Cloudflare account ID and `TRAFFIC_HOSTNAME` used by the traffic digest. The digest reads Cloudflare Web Analytics/RUM through the GraphQL Analytics API instead of storing its own page-view counter.

Create a scoped Cloudflare API token with `Account Analytics: Read`, then store it as `CLOUDFLARE_API_TOKEN`.

Then set secrets:

```sh
npx wrangler secret put CLOUDFLARE_API_TOKEN
npx wrangler secret put SLACK_DONATIONS_WEBHOOK_URL
npx wrangler secret put SLACK_FEEDBACK_WEBHOOK_URL
npx wrangler secret put SLACK_TRAFFIC_WEBHOOK_URL
npx wrangler secret put KOFI_VERIFICATION_TOKEN
npx wrangler secret put ADMIN_TOKEN
```

Deploy:

```sh
npx wrangler deploy
```

## Ko-fi setup

In Ko-fi webhook settings, set the webhook URL to:

```text
https://<worker-host>/kofi
```

Open the Advanced section, copy Ko-fi's generated verification token, and store that value in the Worker secret `KOFI_VERIFICATION_TOKEN`.

## Feedback widget

The static site uses a floating feedback widget with an optional first name or initials, a required 400-character feedback field, and an optional quote-permission checkbox. Submissions are posted privately to Slack for review. They are not published on the site automatically.

To enable the widget on the static site, add this meta tag in the page `<head>`:

```html
<meta name="hurricane-feedback-endpoint" content="https://hurricane-slack-alerts.mike-551.workers.dev/feedback">
```

Then add the script near the existing footer scripts:

```html
<script src="assets/js/feedback.js"></script>
```

## Traffic digest

The traffic digest does not collect browser events itself. It queries Cloudflare Web Analytics/RUM when the daily or weekly scheduled Worker runs, then posts an aggregate summary to Slack.

The digest currently includes total page views, daily trend, top pages, and referrer hosts. UTM source breakdowns are omitted because Cloudflare Web Analytics pageload events do not expose request query strings through the RUM GraphQL dataset.

The daily traffic digest currently runs at `13:35 UTC`, summarizing the previous UTC date. That is 6:35 AM Pacific during daylight time. The weekly summary runs Mondays at `13:45 UTC`, summarizing the previous seven UTC dates. Adjust `triggers.crons` in `wrangler.jsonc` if you want different reporting times.

## Manual digest test

```sh
curl -X POST "https://hurricane-slack-alerts.mike-551.workers.dev/traffic/digest?date=2026-06-22" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Weekly digest test:

```sh
curl -X POST "https://hurricane-slack-alerts.mike-551.workers.dev/traffic/digest?period=weekly&date=2026-06-22" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Notes

Cloudflare Web Analytics remains the source of truth. The Worker only queries aggregate data and sends Slack messages; it does not write traffic data to KV or maintain a separate counter.
