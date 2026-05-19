const https = require("https");

const PI_API_BASE = process.env.PI_API_BASE || "https://api.minepi.com/v2";

function getApiKey() {
  return process.env.PI_SERVER_API_KEY || "";
}

function piRequest(method, apiPath, bodyObj) {
  const PI_SERVER_API_KEY = getApiKey();
  if (!PI_SERVER_API_KEY) {
    const err = new Error("PI_SERVER_API_KEY is not set");
    err.statusCode = 500;
    throw err;
  }

  const url = new URL(PI_API_BASE + apiPath);
  const body = bodyObj ? JSON.stringify(bodyObj) : "";

  const options = {
    method,
    hostname: url.hostname,
    path: url.pathname + url.search,
    headers: {
      Authorization: `Key ${PI_SERVER_API_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    },
  };

  return new Promise((resolve, reject) => {
    const r = https.request(options, (resp) => {
      let data = "";
      resp.on("data", (chunk) => { data += chunk; });
      resp.on("end", () => {
        let parsed = data;
        try { parsed = data ? JSON.parse(data) : null; } catch { parsed = data; }
        const statusCode = resp.statusCode || 0;
        if (statusCode >= 200 && statusCode < 300) {
          resolve(parsed);
          return;
        }
        const err = new Error(typeof parsed === "string" ? parsed : JSON.stringify(parsed));
        err.statusCode = statusCode;
        err.response = parsed;
        reject(err);
      });
    });
    r.on("error", reject);
    if (body) r.write(body);
    r.end();
  });
}

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(statusCode, data) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(data),
  };
}

function readJsonBody(event) {
  try {
    if (!event || !event.body) return {};
    return JSON.parse(event.body);
  } catch (e) {
    return {};
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const body = readJsonBody(event);
    const paymentId = body?.paymentId ? String(body.paymentId) : "";

    if (!paymentId) {
      return json(400, { error: "paymentId is required" });
    }

    const result = await piRequest(
      "POST",
      `/payments/${encodeURIComponent(paymentId)}/approve`,
      null
    );

    return json(200, result);
  } catch (err) {
    return json(502, {
      error: "Pi API approve failed",
      message: err?.message || "Unknown error",
      statusCode: err?.statusCode || null,
      response: err?.response || null,
    });
  }
};
