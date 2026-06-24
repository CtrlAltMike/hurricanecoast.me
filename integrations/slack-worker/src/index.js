const MAX_KOFI_BYTES = 64 * 1024;
const MAX_FEEDBACK_BYTES = 4096;
const MAX_FEEDBACK_MESSAGE_LENGTH = 400;
const MAX_FEEDBACK_NAME_LENGTH = 40;
const DAILY_TRAFFIC_CRON = "35 13 * * *";
const WEEKLY_TRAFFIC_CRON = "45 13 * * 1";
const CLOUDFLARE_GRAPHQL_ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";
const TRAFFIC_DIGEST_QUERY = `
  query TrafficDigest(
    $accountTag: string,
    $host: string,
    $startDate: Date,
    $endDate: Date
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        daily: rumPageloadEventsAdaptiveGroups(
          limit: 8,
          orderBy: [date_ASC],
          filter: { date_geq: $startDate, date_leq: $endDate, requestHost: $host }
        ) {
          count
          dimensions { date }
          sum { visits }
        }
        topPages: rumPageloadEventsAdaptiveGroups(
          limit: 5,
          orderBy: [count_DESC],
          filter: { date_geq: $startDate, date_leq: $endDate, requestHost: $host }
        ) {
          count
          sum { visits }
          dimensions { requestPath }
        }
        topReferrers: rumPageloadEventsAdaptiveGroups(
          limit: 20,
          orderBy: [count_DESC],
          filter: { date_geq: $startDate, date_leq: $endDate, requestHost: $host }
        ) {
          count
          sum { visits }
          dimensions { refererHost refererPath refererScheme }
        }
      }
    }
  }
`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS" && url.pathname === "/feedback") {
      return corsResponse(null, 204, env);
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return jsonResponse({ ok: true });
    }

    if (request.method === "POST" && url.pathname === "/kofi") {
      return handleKofiWebhook(request, env);
    }

    if (request.method === "POST" && url.pathname === "/feedback") {
      if (!isAllowedOrigin(request, env)) {
        return corsResponse({ error: "origin_not_allowed" }, 403, env);
      }

      return handleFeedback(request, env);
    }

    if (request.method === "POST" && url.pathname === "/traffic/digest") {
      if (!(await isAuthorized(request, env))) {
        return jsonResponse({ error: "unauthorized" }, 401);
      }

      const date = url.searchParams.get("date") || previousUtcDate(new Date());
      const period = url.searchParams.get("period") === "weekly" ? "weekly" : "daily";
      if (period === "weekly") {
        await sendWeeklyTrafficDigest(env, date);
      } else {
        await sendTrafficDigest(env, date);
      }

      return jsonResponse({ ok: true, period, date });
    }

    return jsonResponse({ error: "not_found" }, 404);
  },

  scheduled(controller, env, ctx) {
    const date = previousUtcDate(new Date(controller.scheduledTime));
    if (controller.cron === WEEKLY_TRAFFIC_CRON) {
      ctx.waitUntil(sendWeeklyTrafficDigest(env, date));
      return;
    }

    if (controller.cron && controller.cron !== DAILY_TRAFFIC_CRON) {
      console.warn(JSON.stringify({ event: "traffic_unknown_cron", cron: controller.cron }));
    }

    ctx.waitUntil(sendTrafficDigest(env, date));
  },
};

async function handleFeedback(request, env) {
  if (!env.SLACK_FEEDBACK_WEBHOOK_URL) {
    return corsResponse({ error: "missing_configuration" }, 500, env);
  }

  let payload;
  try {
    const body = await readBoundedText(request, MAX_FEEDBACK_BYTES);
    payload = JSON.parse(body);
  } catch (error) {
    return corsResponse({ error: "invalid_request" }, 400, env);
  }

  const feedback = normalizeFeedbackPayload(payload);
  if (!feedback.message) {
    return corsResponse({ error: "feedback_required" }, 400, env);
  }

  await postToSlack(env.SLACK_FEEDBACK_WEBHOOK_URL, formatFeedbackMessage(feedback));
  return corsResponse({ ok: true }, 200, env);
}

async function handleKofiWebhook(request, env) {
  if (!env.SLACK_DONATIONS_WEBHOOK_URL || !env.KOFI_VERIFICATION_TOKEN) {
    return jsonResponse({ error: "missing_configuration" }, 500);
  }

  const body = await readBoundedText(request, MAX_KOFI_BYTES);
  const payload = parseKofiPayload(body, request.headers.get("content-type") || "");

  if (!payload || !(await timingSafeEqual(payload.verification_token || "", env.KOFI_VERIFICATION_TOKEN))) {
    return jsonResponse({ error: "invalid_signature" }, 401);
  }

  await postToSlack(env.SLACK_DONATIONS_WEBHOOK_URL, formatDonationMessage(payload));
  return jsonResponse({ ok: true });
}

async function sendTrafficDigest(env, date) {
  if (!hasTrafficDigestConfiguration(env)) {
    console.warn(JSON.stringify({ event: "traffic_digest_missing_configuration" }));
    return;
  }

  const [traffic, week] = await Promise.all([
    fetchCloudflareTraffic(env, date, date),
    fetchCloudflareTraffic(env, addUtcDays(date, -6), date),
  ]);
  const previousDay = week.days.find((day) => day.date === addUtcDays(date, -1)) || emptyTrafficDay(addUtcDays(date, -1));

  await postToSlack(env.SLACK_TRAFFIC_WEBHOOK_URL, formatTrafficDigest(traffic, env, {
    previousDay,
    week,
  }));
}

async function sendWeeklyTrafficDigest(env, endDate) {
  if (!hasTrafficDigestConfiguration(env)) {
    console.warn(JSON.stringify({ event: "traffic_weekly_missing_configuration" }));
    return;
  }

  const traffic = await fetchCloudflareTraffic(env, addUtcDays(endDate, -6), endDate);
  await postToSlack(env.SLACK_TRAFFIC_WEBHOOK_URL, formatWeeklyTrafficDigest(traffic, env));
}

function hasTrafficDigestConfiguration(env) {
  return Boolean(env.SLACK_TRAFFIC_WEBHOOK_URL && env.CLOUDFLARE_API_TOKEN && env.CLOUDFLARE_ACCOUNT_ID);
}

async function fetchCloudflareTraffic(env, startDate, endDate) {
  const host = trafficHostname(env);
  const data = await queryCloudflareGraphQL(env, TRAFFIC_DIGEST_QUERY, {
    accountTag: env.CLOUDFLARE_ACCOUNT_ID,
    host,
    startDate,
    endDate,
  });
  const account = data?.viewer?.accounts?.[0];
  if (!account) {
    throw new Error("Cloudflare Analytics did not return an account result");
  }

  const days = buildTrafficDays(startDate, endDate, account.daily);
  return {
    date: startDate === endDate ? startDate : null,
    startDate,
    endDate,
    views: days.reduce((total, day) => total + day.views, 0),
    activeDays: days.filter((day) => day.views > 0).length,
    pages: counterFromGroups(account.topPages, (group) => normalizePath(group.dimensions?.requestPath || "/")),
    referrers: counterFromGroups(account.topReferrers, (group) => normalizeAnalyticsReferrer(group.dimensions, host)),
    sources: {},
    days,
  };
}

async function queryCloudflareGraphQL(env, query, variables) {
  const response = await fetch(CLOUDFLARE_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Cloudflare GraphQL failed with ${response.status}`);
  }

  const result = await response.json();
  if (result.errors?.length) {
    throw new Error(`Cloudflare GraphQL error: ${result.errors.map((error) => error.message).join("; ")}`);
  }

  return result.data;
}

function trafficHostname(env) {
  if (env.TRAFFIC_HOSTNAME) {
    return env.TRAFFIC_HOSTNAME;
  }

  try {
    return new URL(env.TRAFFIC_ALLOWED_ORIGIN).hostname;
  } catch {
    return "hurricanesupplylist.com";
  }
}

function buildTrafficDays(startDate, endDate, groups = []) {
  const byDate = new Map(groups.map((group) => [group.dimensions?.date, group.count || 0]));
  const days = [];
  let date = startDate;

  while (date <= endDate) {
    days.push({ ...emptyTrafficDay(date), views: byDate.get(date) || 0 });
    date = addUtcDays(date, 1);
  }

  return days;
}

function counterFromGroups(groups = [], labelForGroup) {
  const counter = {};
  for (const group of groups) {
    const label = labelForGroup(group);
    if (!label) {
      continue;
    }

    counter[label] = (counter[label] || 0) + (group.count || 0);
  }

  return Object.fromEntries(Object.entries(counter).sort((a, b) => b[1] - a[1]).slice(0, 5));
}

function parseKofiPayload(body, contentType) {
  if (contentType.includes("application/json")) {
    return JSON.parse(body);
  }

  const params = new URLSearchParams(body);
  const data = params.get("data");
  return data ? JSON.parse(data) : null;
}

function formatDonationMessage(payload) {
  const supporter = payload.from_name || "Someone";
  const amount = [payload.amount, payload.currency].filter(Boolean).join(" ");
  const kind = payload.type || "Ko-fi support";
  const message = payload.message ? `\n>${truncate(payload.message, 600)}` : "";
  const privateNote = payload.is_public === false ? "\nMarked private on Ko-fi." : "";

  return {
    text: `New HurricaneSupplyList.com Ko-fi support from ${supporter}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*New HurricaneSupplyList.com support*\n${supporter} sent ${amount || "a contribution"} via ${kind}.${message}${privateNote}`,
        },
      },
      payload.url
        ? {
            type: "actions",
            elements: [
              {
                type: "button",
                text: { type: "plain_text", text: "Open Ko-fi" },
                url: payload.url,
              },
            ],
          }
        : null,
    ].filter(Boolean),
  };
}

function formatFeedbackMessage(feedback) {
  const displayName = feedback.name || "Reader";
  const permission = feedback.canQuote ? "Yes" : "No";
  const page = feedback.pageTitle || feedback.path || "Unknown page";

  return {
    text: `New HurricaneSupplyList.com feedback from ${displayName}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*New HurricaneSupplyList.com feedback*\n*From:* ${escapeSlack(displayName)}\n*OK to quote after review:* ${permission}`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `>${escapeSlack(feedback.message).replace(/\n/g, "\n>")}`,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Page: ${escapeSlack(page)}${feedback.path ? ` (${escapeSlack(feedback.path)})` : ""}`,
          },
        ],
      },
    ],
  };
}

function formatTrafficDigest(traffic, env, context = {}) {
  const siteName = env.TRAFFIC_SITE_NAME || "HurricaneSupplyList.com";
  const pageLines = topLines(traffic.pages);
  const referrerLines = topLines(traffic.referrers);
  const previousViews = context.previousDay?.views || 0;
  const week = context.week || traffic;

  return {
    text: `${siteName} traffic digest for ${traffic.date}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: [
            `*${siteName} traffic digest*`,
            `${traffic.date}: *${traffic.views}* Cloudflare page views`,
            `Prior day: ${formatDelta(traffic.views, previousViews)}`,
            `Last 7 days: *${week.views}* views, ${formatAverage(week.views, 7)}/day average, ${week.activeDays}/7 active days`,
          ].join("\n"),
        },
      },
      digestSection("Top pages", pageLines),
      digestSection("Referrers", referrerLines),
    ].filter(Boolean),
  };
}

function formatWeeklyTrafficDigest(traffic, env) {
  const siteName = env.TRAFFIC_SITE_NAME || "HurricaneSupplyList.com";
  const busiest = busiestDay(traffic.days);

  return {
    text: `${siteName} weekly traffic summary for ${traffic.startDate} to ${traffic.endDate}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: [
            `*${siteName} weekly traffic summary*`,
            `${traffic.startDate} to ${traffic.endDate}: *${traffic.views}* Cloudflare page views`,
            `${formatAverage(traffic.views, traffic.days.length)}/day average across ${traffic.activeDays}/${traffic.days.length} active days`,
            busiest && busiest.views > 0 ? `Busiest day: ${busiest.date} with *${busiest.views}* views` : "No traffic recorded this week",
          ].join("\n"),
        },
      },
      digestSection("Daily views", traffic.days.map((day) => `- ${day.date}: ${day.views}`)),
      digestSection("Top pages", topLines(traffic.pages)),
      digestSection("Referrers", topLines(traffic.referrers)),
    ].filter(Boolean),
  };
}

function normalizeFeedbackPayload(payload) {
  const rawName = typeof payload?.name === "string" ? payload.name : "";
  const rawMessage = typeof payload?.message === "string" ? payload.message : "";
  const rawPath = typeof payload?.path === "string" ? payload.path : "";
  const rawPageTitle = typeof payload?.pageTitle === "string" ? payload.pageTitle : "";

  return {
    name: cleanSingleLine(rawName).slice(0, MAX_FEEDBACK_NAME_LENGTH),
    message: cleanMultiline(rawMessage).slice(0, MAX_FEEDBACK_MESSAGE_LENGTH),
    canQuote: payload?.canQuote === true,
    path: normalizePath(rawPath),
    pageTitle: cleanSingleLine(rawPageTitle).slice(0, 140),
  };
}

function digestSection(title, lines) {
  if (!lines.length) {
    return null;
  }

  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*${title}*\n${lines.join("\n")}`,
    },
  };
}

function topLines(counter) {
  return Object.entries(counter || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => `- ${escapeSlack(label)}: ${count}`);
}

function formatDelta(current, previous) {
  const delta = current - previous;
  if (previous === 0) {
    return current === 0 ? "no change from 0" : `+${current} from 0`;
  }

  const sign = delta > 0 ? "+" : "";
  const percent = Math.round((delta / previous) * 100);
  return `${sign}${delta} (${sign}${percent}%)`;
}

function formatAverage(total, days) {
  return (total / Math.max(days, 1)).toFixed(total < 10 ? 1 : 0);
}

function busiestDay(days) {
  return [...days].sort((a, b) => b.views - a.views)[0] || null;
}

async function postToSlack(webhookUrl, payload) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed with ${response.status}`);
  }
}

async function isAuthorized(request, env) {
  if (!env.ADMIN_TOKEN) {
    return false;
  }

  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return timingSafeEqual(token, env.ADMIN_TOKEN);
}

function isAllowedOrigin(request, env) {
  const allowed = env.TRAFFIC_ALLOWED_ORIGIN;
  if (!allowed) {
    return true;
  }

  if (request.headers.get("origin") === allowed) {
    return true;
  }

  const referer = request.headers.get("referer");
  if (!referer) {
    return false;
  }

  try {
    return new URL(referer).origin === allowed;
  } catch {
    return false;
  }
}

async function readBoundedText(request, maxBytes) {
  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (declaredLength > maxBytes) {
    throw new Error("request_body_too_large");
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return "";
  }

  const chunks = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    received += value.byteLength;
    if (received > maxBytes) {
      throw new Error("request_body_too_large");
    }

    chunks.push(value);
  }

  const merged = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(merged);
}

async function timingSafeEqual(left, right) {
  const encoder = new TextEncoder();
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);

  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let difference = left.length === right.length ? 0 : 1;

  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }

  return difference === 0;
}

function emptyTrafficDay(date) {
  return {
    date,
    views: 0,
    pages: {},
    referrers: {},
    sources: {},
    updatedAt: null,
  };
}

function normalizePath(path) {
  if (typeof path !== "string" || !path.startsWith("/")) {
    return "/";
  }

  return path.replace(/\/index\.html$/, "/").slice(0, 160);
}

function normalizeAnalyticsReferrer(dimensions = {}, hostname) {
  const refererHost = dimensions.refererHost || "";
  if (!refererHost || dimensions.refererScheme === "unknown") {
    return "(direct)";
  }

  const host = refererHost.replace(/^www\./, "");
  return host === hostname.replace(/^www\./, "") ? "(internal)" : host.slice(0, 80);
}

function cleanSingleLine(value) {
  return value.replace(/\s+/g, " ").trim();
}

function cleanMultiline(value) {
  return value.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function escapeSlack(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function truncate(value, limit) {
  return value.length > limit ? `${value.slice(0, limit - 1)}...` : value;
}

function previousUtcDate(date) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() - 1);
  return utcDate(copy);
}

function addUtcDays(date, days) {
  const copy = new Date(`${date}T00:00:00.000Z`);
  copy.setUTCDate(copy.getUTCDate() + days);
  return utcDate(copy);
}

function utcDate(date) {
  return date.toISOString().slice(0, 10);
}

function corsResponse(body, status, env) {
  const headers = new Headers();
  const allowedOrigin = env.TRAFFIC_ALLOWED_ORIGIN || "*";
  headers.set("access-control-allow-origin", allowedOrigin);
  if (allowedOrigin !== "*") {
    headers.set("access-control-allow-credentials", "true");
  }
  headers.set("access-control-allow-methods", "POST, OPTIONS");
  headers.set("access-control-allow-headers", "content-type");

  if (body === null) {
    return new Response(null, { status, headers });
  }

  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers });
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
