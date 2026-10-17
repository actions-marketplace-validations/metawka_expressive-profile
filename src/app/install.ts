const AUTH = "https://expressive-profile-auth.vercel.app/api";
const API = "https://api.github.com";

// Auth
export interface DeviceCode {
  device_code: string;
  user_code: string;
  verification_uri: string;
  interval: number;
  expires_in: number;
}

export class InstallError extends Error {}

async function post(path: string, body: object) {
  const r = await fetch(`${AUTH}/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.json();
}

export async function requestCode(): Promise<DeviceCode> {
  const j = await post("code", {});
  if (!j.device_code) throw new InstallError("auth");
  return j;
}

export async function waitForToken(code: DeviceCode, signal: AbortSignal): Promise<string> {
  let interval = Math.max(5, code.interval) * 1000;
  const until = Date.now() + code.expires_in * 1000;
  while (Date.now() < until) {
    await new Promise((r) => setTimeout(r, interval));
    if (signal.aborted) throw new InstallError("cancel");
    const j = await post("token", { device_code: code.device_code });
    if (j.access_token) return j.access_token;
    if (j.error === "slow_down") interval += 5000;
    else if (j.error === "access_denied") throw new InstallError("denied");
    else if (j.error === "expired_token") throw new InstallError("expired");
    else if (j.error !== "authorization_pending") throw new InstallError("auth");
  }
  throw new InstallError("expired");
}

// Repo
async function gh(token: string, path: string, init: RequestInit = {}) {
  const r = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
  });
  const body = r.status === 204 ? null : await r.json().catch(() => null);
  return { status: r.status, body };
}

function b64(text: string) {
  const bytes = new TextEncoder().encode(text);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export async function whoami(token: string) {
  const r = await gh(token, "/user");
  if (r.status !== 200) throw new InstallError("auth");
  return r.body.login as string;
}

export async function existingReadme(token: string, login: string) {
  const repo = await gh(token, `/repos/${login}/${login}`);
  if (repo.status === 404) return false;
  const own = await gh(token, `/repos/${login}/${login}/contents/profile.json`);
  if (own.status === 200) return false;
  const readme = await gh(token, `/repos/${login}/${login}/readme`);
  return readme.status === 200;
}

export async function install(token: string, login: string, files: Record<string, string>, step: (n: number) => void, name = login) {
  step(0);
  let repo = await gh(token, `/repos/${login}/${name}`);
  if (repo.status === 404) {
    repo = await gh(token, "/user/repos", { method: "POST", body: JSON.stringify({ name, auto_init: true, description: "My GitHub profile" }) });
    if (repo.status !== 201) throw new InstallError("repo");
  }
  const full = `/repos/${login}/${name}`;
  const branch = repo.body.default_branch || "main";
  let ref = await gh(token, `${full}/git/ref/heads/${branch}`);
  for (let i = 0; ref.status !== 200 && i < 5; i++) {
    if (ref.status === 409 || ref.status === 404) {
      await gh(token, `${full}/contents/.profile/.keep`, { method: "PUT", body: JSON.stringify({ message: "Added profile", content: "", branch }) });
    }
    await new Promise((r) => setTimeout(r, 1200));
    ref = await gh(token, `${full}/git/ref/heads/${branch}`);
  }
  if (ref.status !== 200) throw new InstallError("repo");
  const head = ref.body.object.sha;
  const commit = await gh(token, `${full}/git/commits/${head}`);
  step(1);
  const tree: { path: string; mode: string; type: string; sha: string }[] = [];
  const entries = Object.entries(files);
  for (let i = 0; i < entries.length; i += 6) {
    const chunk = await Promise.all(
      entries.slice(i, i + 6).map(async ([path, text]) => {
        const blob = await gh(token, `${full}/git/blobs`, { method: "POST", body: JSON.stringify({ content: b64(text), encoding: "base64" }) });
        if (blob.status !== 201) throw new InstallError("upload");
        return { path, mode: "100644", type: "blob", sha: blob.body.sha as string };
      }),
    );
    tree.push(...chunk);
  }
  step(2);
  const t = await gh(token, `${full}/git/trees`, { method: "POST", body: JSON.stringify({ base_tree: commit.body.tree.sha, tree }) });
  if (t.status !== 201) throw new InstallError("upload");
  const c = await gh(token, `${full}/git/commits`, { method: "POST", body: JSON.stringify({ message: "Added Expressive Profile", tree: t.body.sha, parents: [head] }) });
  if (c.status !== 201) throw new InstallError("upload");
  const up = await gh(token, `${full}/git/refs/heads/${branch}`, { method: "PATCH", body: JSON.stringify({ sha: c.body.sha }) });
  if (up.status !== 200) throw new InstallError("upload");
  step(3);
}
