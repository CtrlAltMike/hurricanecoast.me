# Hurricane Slack Alerts Worker

This Worker posts three kinds of messages into the `ebbline.slack.com` workspace:

- Ko-fi donation events to `#ko-fi-donations`
- Reader feedback to `#hurricane-feedback`
- Daily privacy-preserving traffic summaries to `#hurricane-traffic`

The static site should never contain Slack webhook URLs, Ko-fi verification tokens, or Cloudflare API tokens. Keep all of those in Worker secrets.

## Endpoints

- `POST /kofi` receives Ko-fi webhook payloads.
- `POST /feedback` receives first-party reader feedback submissions from the static site.
- `POST /traffic` receives first-party page-view beacons from the static site.
- `POST /traffic/digest` manually sends a digest for testing. Requires `Authorization: Bearer $ADMIN_TOKEN`.
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
npx wrangler kv namespace create TRAFFIC_KV
npx wrangler kv namespace create TRAFFIC_KV --preview
```

Copy the returned namespace IDs into `wrangler.jsonc`.

Then set secrets:

```sh
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

The Worker stores only aggregate counts by date, page path, referrer hostname, and `utm_source`. It does not store IP addresses, cookies, user agents, or per-visitor identifiers.

To enable the beacon on the static site, add this meta tag in the page `<head>`:

```html
<meta name="hurricane-traffic-endpoint" content="https://hurricane-slack-alerts.mike-551.workers.dev/traffic">
```

Then add the script near the existing footer scripts:

```html
<script src="assets/js/traffic.js"></script>
```

If you later put the Worker on a same-origin route such as `https://hurricanesupplylist.com/traffic`, update the meta content accordingly.

The scheduled digest currently runs at `08:15 UTC`, summarizing the previous UTC date. Adjust `triggers.crons` in `wrangler.jsonc` if you want a different reporting time.

## Manual digest test

```sh
curl -X POST "https://hurricane-slack-alerts.mike-551.workers.dev/traffic/digest?date=2026-06-22" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Notes

Traffic counts are stored in KV with read-modify-write updates. That is sufficient for low-volume daily trend monitoring, but it can lose increments during concurrent writes. If traffic grows materially, move the traffic endpoint to D1 or Workers Analytics Engine before using it for precise reporting.
