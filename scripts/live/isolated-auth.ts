/**
 * ISOLATED CI ONLY. Replaces the CAPTCHA secret of the LOCAL Supabase Auth (GoTrue) container by recreating the container with
 * the same configuration and one environment variable changed. Only Cloudflare's public TEST secrets are accepted, and only on the
 * allow-listed loopback stack. (A hosted project's CAPTCHA configuration cannot be reached through this module.)
 */
import { execFileSync } from "node:child_process";
import { assertIsolatedApi, assertTestCaptchaSecret, requireIsolated } from "./target";

const docker = (...args: string[]) => execFileSync("docker", args, { encoding: "utf8" }).trim();

export async function setLocalCaptchaSecret(secret: string): Promise<void> {
  requireIsolated("change the CAPTCHA secret");
  assertTestCaptchaSecret(secret);
  const base = assertIsolatedApi(process.env.LIVE_SUPABASE_URL);
  const names = docker("ps", "--filter", "name=supabase_auth_", "--format", "{{.Names}}").split("\n").filter(Boolean);
  if (names.length !== 1) throw new Error(`expected exactly one local auth container, found ${names.length}`);
  const name = names[0]!;
  const info = JSON.parse(docker("inspect", name))[0];
  const env: string[] = (info.Config.Env as string[]).filter((e) => !e.startsWith("GOTRUE_SECURITY_CAPTCHA_SECRET="));
  env.push(`GOTRUE_SECURITY_CAPTCHA_SECRET=${secret}`);
  if (!env.some((e) => e === "GOTRUE_SECURITY_CAPTCHA_ENABLED=true")) throw new Error("local auth container is not configured with CAPTCHA enabled");
  const net = info.HostConfig.NetworkMode as string;
  const aliases: string[] = ((info.NetworkSettings.Networks?.[net]?.Aliases as string[] | undefined) ?? []).filter((a) => !/^[0-9a-f]{12}$/.test(a));
  const args = ["run", "-d", "--name", name, "--network", net, "--restart", info.HostConfig.RestartPolicy?.Name || "no"];
  for (const a of aliases) args.push("--network-alias", a);
  for (const [k, v] of Object.entries((info.Config.Labels ?? {}) as Record<string, string>)) args.push("--label", `${k}=${v}`);
  for (const e of env) args.push("-e", e);
  const entry = info.Config.Entrypoint as string[] | null;
  if (entry?.length) args.push("--entrypoint", entry[0]!);
  args.push(info.Config.Image as string, ...((entry ?? []).slice(1)), ...((info.Config.Cmd as string[] | null) ?? []));
  docker("rm", "-f", name);
  docker(...args);
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`${base}/auth/v1/health`, { headers: { apikey: process.env.LIVE_ANON_KEY ?? "" } }); if (r.ok) return; } catch { /* still starting */ }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("local auth did not become healthy after the CAPTCHA secret change");
}
