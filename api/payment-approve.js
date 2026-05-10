import https from "https";

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

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  console.log('--- Payment Approve Start ---');
  console.log('Method:', req.method);
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Vercel automatically parses the body if Content-Type is application/json
    let body = req.body;
    if (typeof body === 'string' && body.length > 0) {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error("Failed to parse body string:", e);
      }
    }

    console.log('Parsed Body:', body);
    
    const paymentId = body?.paymentId ? String(body.paymentId) : "";
    console.log('PaymentId:', paymentId);

    if (!paymentId) {
      console.error('Error: paymentId is missing from body');
      return res.status(400).json({ error: "paymentId is required" });
    }

    const apiKey = getApiKey();
    console.log('API Key Status:', apiKey ? 'Present' : 'Missing');

    const result = await piRequest(
      "POST",
      `/payments/${encodeURIComponent(paymentId)}/approve`,
      null
    );
    
    console.log('Pi API Success:', result);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Pi API Error:', err.message);
    if (err.response) console.error('Pi API Response:', err.response);
    
    return res.status(502).json({
      error: "Pi API approve failed",
      message: err?.message || "Unknown error",
      statusCode: err?.statusCode || null,
      response: err?.response || null,
    });
  }
}
