const https = require("https");

const PI_API_BASE = process.env.PI_API_BASE || "https://api.minepi.com/v2";

function piMeRequest(accessToken) {
  const url = new URL(PI_API_BASE + "/me");
  const options = {
    method: "GET",
    hostname: url.hostname,
    path: url.pathname,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
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
        if (statusCode === 401) {
          const err = new Error("Invalid access token");
          err.statusCode = 401;
          err.response = parsed;
          reject(err);
          return;
        }
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
    const accessToken = body?.accessToken;

    if (!accessToken) {
      return json(400, { error: "accessToken is required" });
    }

    const meResult = await piMeRequest(accessToken);

    return json(200, {
      uid: meResult.uid,
      username: meResult.username,
      scopes: meResult.credentials?.scopes || [],
      valid_until: meResult.credentials?.valid_until || null,
    });
  } catch (err) {
    const status = err.statusCode || 502;
    return json(status, {
      error: err.statusCode === 401 ? "Invalid or expired access token" : "Auth verification failed",
      message: err.message || "Unknown error",
    });
  }
};
