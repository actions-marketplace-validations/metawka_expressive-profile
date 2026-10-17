import { cors, forward } from "./_github.js";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  await forward(res, "https://github.com/login/device/code", { scope: "public_repo workflow" });
}
