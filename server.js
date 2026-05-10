const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const PI_SERVER_API_KEY = process.env.PI_SERVER_API_KEY || "";
const PI_API_BASE = process.env.PI_API_BASE || "https://api.minepi.com/v2";

function sendJson(res, statusCode, obj) {
  const payload = JSON.stringify(obj);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => {
      if (!body) { resolve({}); return; }
      try { resolve(JSON.parse(body)); } catch { reject(new Error("Invalid JSON")); }
    });
    req.on("error", reject);
  });
}

function piRequest(method, apiPath, bodyObj) {
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
        if (statusCode >= 200 && statusCode < 300) { resolve(parsed); return; }
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

async function handlePaymentApprove(req, res) {
  const body = await readJsonBody(req);
  const paymentId = body && body.paymentId ? String(body.paymentId) : "";
  if (!paymentId) { sendJson(res, 400, { error: "paymentId is required" }); return; }
  try {
    const result = await piRequest("POST", `/payments/${encodeURIComponent(paymentId)}/approve`, null);
    sendJson(res, 200, result);
  } catch (err) {
    sendJson(res, 502, { error: "Pi API approve failed", message: err.message || "Unknown error" });
  }
}

async function handlePaymentComplete(req, res) {
  const body = await readJsonBody(req);
  const paymentId = body && body.paymentId ? String(body.paymentId) : "";
  const txid = body && body.txid ? String(body.txid) : "";
  if (!paymentId) { sendJson(res, 400, { error: "paymentId is required" }); return; }
  if (!txid) { sendJson(res, 400, { error: "txid is required" }); return; }
  try {
    const result = await piRequest("POST", `/payments/${encodeURIComponent(paymentId)}/complete`, { txid });
    sendJson(res, 200, result);
  } catch (err) {
    sendJson(res, 502, { error: "Pi API complete failed", message: err.message || "Unknown error" });
  }
}

async function handlePaymentCancel(req, res) {
  const body = await readJsonBody(req);
  const paymentId = body && body.paymentId ? String(body.paymentId) : "";
  if (!paymentId) { sendJson(res, 400, { error: "paymentId is required" }); return; }
  try {
    const result = await piRequest("POST", `/payments/${encodeURIComponent(paymentId)}/cancel`, null);
    sendJson(res, 200, result);
  } catch (err) {
    sendJson(res, 502, { error: "Pi API cancel failed", message: err.message || "Unknown error" });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "POST" && url.pathname === "/payment/approve") {
    await handlePaymentApprove(req, res); return;
  }
  if (req.method === "POST" && url.pathname === "/payment/complete") {
    await handlePaymentComplete(req, res); return;
  }
  if (req.method === "POST" && url.pathname === "/payment/cancel") {
    await handlePaymentCancel(req, res); return;
  }

  // Serve static files from dist/
  const distDir = path.join(__dirname, "dist");
  let filePath = path.join(distDir, url.pathname === "/" ? "index.html" : url.pathname);
  const ext = path.extname(filePath);
  const mimeTypes = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon" };

  fs.readFile(filePath, (err, content) => {
    if (err) {
      // SPA fallback
      fs.readFile(path.join(distDir, "index.html"), (e2, c2) => {
        if (e2) { sendJson(res, 404, { error: "Not found" }); return; }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(c2);
      });
      return;
    }
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(content);
  });
});

server.listen(PORT, () => {
  process.stdout.write(`Zynmart server running on http://localhost:${PORT}\n`);
  process.stdout.write(`PI_SERVER_API_KEY: ${PI_SERVER_API_KEY ? "SET" : "NOT SET"}\n`);
});
