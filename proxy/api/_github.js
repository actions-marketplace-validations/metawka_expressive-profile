export const CLIENT_ID = "Ov23liY5DJwj4qqF4gPH";
const ORIGINS = ["https://metawka.github.io", "http://localhost:5230"];

export function cors(req, res) {
  const origin = req.headers.origin;
  if (ORIGINS.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  if (req.method !== "POST") {
    res.status(405).end();
    return true;
  }
  return false;
}

export async function forward(res, url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: CLIENT_ID, ...body }),
  });
  res.status(r.status).json(await r.json());
}
