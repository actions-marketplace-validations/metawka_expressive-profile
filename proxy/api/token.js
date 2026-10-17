import { cors, forward } from "./_github.js";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  const code = req.body?.device_code;
  if (typeof code !== "string" || code.length > 100) return res.status(400).json({ error: "bad_request" });
  await forward(res, "https://github.com/login/oauth/access_token", {
    device_code: code,
    grant_type: "urn:ietf:params:oauth:grant-type:device_code",
  });
}
