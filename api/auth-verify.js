import https from "https";

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

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const accessToken = req.body?.accessToken;

    if (!accessToken) {
      return res.status(400).json({ error: "accessToken is required" });
    }

    const meResult = await piMeRequest(accessToken);

    return res.status(200).json({
      uid: meResult.uid,
      username: meResult.username,
      scopes: meResult.credentials?.scopes || [],
      valid_until: meResult.credentials?.valid_until || null,
    });
  } catch (err) {
    const status = err.statusCode || 502;
    return res.status(status).json({
      error: err.statusCode === 401 ? "Invalid or expired access token" : "Auth verification failed",
      message: err.message || "Unknown error",
    });
  }
}
