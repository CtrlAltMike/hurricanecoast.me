const MAX_KOFI_BYTES = 64 * 1024;
const MAX_FEEDBACK_BYTES = 4096;
const MAX_FEEDBACK_MESSAGE_LENGTH = 400;
const MAX_FEEDBACK_NAME_LENGTH = 40;
const MAX_TRAFFIC_BYTES = 2048;
const TOP_ITEM_LIMIT = 12;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS" && (url.pathname === "/traffic" || url.pathname === "/feedback")) {
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

    if (request.method === "POST" && url.pathname === "/traffic") {
      if (!isAllowedOrigin(request, env)) {
        return corsResponse({ error: "origin_not_allowed" }, 403, env);
      }

      ctx.waitUntil(recordTraffic(request, env));
      return corsResponse(null, 204, env);
    }

    if (request.method === "POST" && url.pathname === "/traffic/digest") {
      if (!(await isAuthorized(request, env))) {
        return jsonResponse({ error: "unauthorized" }, 401);
      }

      const date = url.searchParams.get("date") || previousUtcDate(new Date());
      await sendTrafficDigest(env, date);
      return jsonResponse({ ok: true, date });
    }

    return jsonResponse({ error: "not_found" }, 404);
  },

  scheduled(controller, env, ctx) {
    const date = previousUtcDate(new Date(controller.scheduledTime));
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

async function recordTraffic(request, env) {
  if (!env.TRAFFIC_KV) {
    console.warn(JSON.stringify({ event: "traffic_missing_kv" }));
    return;
  }

  try {
    const body = await readBoundedText(request, MAX_TRAFFIC_BYTES);
    const event = JSON.parse(body);
    const date = utcDate(new Date());
    const key = `traffic:${date}`;
    const current = (await env.TRAFFIC_KV.get(key, "json")) || emptyTrafficDay(date);

    current.views += 1;
    increment(current.pages, normalizePath(event.path));
    increment(current.referrers, normalizeReferrer(event.referrer));
    increment(current.sources, normalizeSource(event.search));
    current.updatedAt = new Date().toISOString();

    trimCounters(current.pages);
    trimCounters(current.referrers);
    trimCounters(current.sources);

    await env.TRAFFIC_KV.put(key, JSON.stringify(current));
  } catch (error) {
    console.error(JSON.stringify({ event: "traffic_record_failed", message: error.message }));
  }
}

async function sendTrafficDigest(env, date) {
  if (!env.SLACK_TRAFFIC_WEBHOOK_URL || !env.TRAFFIC_KV) {
    console.warn(JSON.stringify({ event: "traffic_digest_missing_configuration" }));
    return;
  }

  const traffic = (await env.TRAFFIC_KV.get(`traffic:${date}`, "json")) || emptyTrafficDay(date);
  await postToSlack(env.SLACK_TRAFFIC_WEBHOOK_URL, formatTrafficDigest(traffic, env));
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

function formatTrafficDigest(traffic, env) {
  const siteName = env.TRAFFIC_SITE_NAME || "HurricaneSupplyList.com";
  const pageLines = topLines(traffic.pages);
  const referrerLines = topLines(traffic.referrers);
  const sourceLines = topLines(traffic.sources);

  return {
    text: `${siteName} traffic digest for ${traffic.date}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${siteName} traffic digest*\n${traffic.date}: *${traffic.views}* recorded page views`,
        },
      },
      digestSection("Top pages", pageLines),
      digestSection("Referrers", referrerLines),
      digestSection("UTM sources", sourceLines),
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
    .map(([label, count]) => `- ${label}: ${count}`);
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

function normalizeReferrer(referrer) {
  if (!referrer) {
    return "(direct)";
  }

  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    return host === "hurricanesupplylist.com" ? "(internal)" : host.slice(0, 80);
  } catch {
    return "(unknown)";
  }
}

function normalizeSource(search) {
  if (typeof search !== "string" || !search) {
    return "(none)";
  }

  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  const source = params.get("utm_source");
  return source ? source.slice(0, 80) : "(none)";
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

function increment(counter, key) {
  counter[key] = (counter[key] || 0) + 1;
}

function trimCounters(counter) {
  const entries = Object.entries(counter).sort((a, b) => b[1] - a[1]).slice(0, TOP_ITEM_LIMIT);

  for (const key of Object.keys(counter)) {
    delete counter[key];
  }

  for (const [key, value] of entries) {
    counter[key] = value;
  }
}

function truncate(value, limit) {
  return value.length > limit ? `${value.slice(0, limit - 1)}...` : value;
}

function previousUtcDate(date) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() - 1);
  return utcDate(copy);
}

function utcDate(date) {
  return date.toISOString().slice(0, 10);
}

function corsResponse(body, status, env) {
  const headers = new Headers();
  headers.set("access-control-allow-origin", env.TRAFFIC_ALLOWED_ORIGIN || "*");
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
