"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Callout } from "@/components/ui/feedback";

type Mode = { kind: "loading" } | { kind: "enroll"; factorId: string; qr: string; secret: string } | { kind: "challenge"; factorId: string } | { kind: "error" };

export function MfaPanel({ next }: { next: string }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [mode, setMode] = useState<Mode>({ kind: "loading" });
  const [code, setCode] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [busy, setBusy] = useState(false);

  const init = useCallback(async () => {
    try {
      const supabase = createBrowserSupabase();
      const { data: lvl } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (lvl?.currentLevel === "aal2") return router.replace(next as never);
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = data?.totp?.find((f) => f.status === "verified");
      if (verified) return setMode({ kind: "challenge", factorId: verified.id });
      for (const f of data?.all ?? []) if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
      const { data: enr, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (error || !enr) return setMode({ kind: "error" });
      setMode({ kind: "enroll", factorId: enr.id, qr: enr.totp.qr_code, secret: enr.totp.secret });
    } catch {
      setMode({ kind: "error" });
    }
  }, [next, router]);

  useEffect(() => {
    void init();
  }, [init]);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (mode.kind !== "enroll" && mode.kind !== "challenge") return;
    setBusy(true);
    setInvalid(false);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: mode.factorId, code: code.trim() });
    setBusy(false);
    if (error) return setInvalid(true);
    router.replace(next as never);
    router.refresh();
  }

  if (mode.kind === "loading") return <p role="status">…</p>;
  if (mode.kind === "error") return <Callout tone="danger">{t("errors.generic")}</Callout>;
  return (
    <form onSubmit={verify} className="space-y-4">
      <Callout tone="info">{t("mfaRequired")}</Callout>
      {mode.kind === "enroll" ? (
        <div className="space-y-3">
          <p>{t("mfaEnrollIntro")}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mode.qr} alt="" width={192} height={192} className="rounded-md border border-border bg-white p-2" />
          <p className="text-sm">{t("mfaSecret")}: <code className="break-all">{mode.secret}</code></p>
        </div>
      ) : (
        <p>{t("mfaChallengeIntro")}</p>
      )}
      {invalid ? <Callout tone="danger" role="alert">{t("mfaInvalid")}</Callout> : null}
      <Field label={t("mfaCode")} htmlFor="code">
        <Input id="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} required />
      </Field>
      <Button type="submit" disabled={busy || code.length !== 6} className="w-full">{t("mfaVerify")}</Button>
    </form>
  );
}
