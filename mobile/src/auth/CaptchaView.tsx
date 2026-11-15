import React from "react";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { allowCaptchaNavigation, captchaUrl, parseCaptchaMessage } from "./captcha";

/** Restricted WebView for the Turnstile challenge only: our captcha page + Cloudflare, no file access, no other navigation. */
export function CaptchaView({ siteOrigin, locale, onToken, onError }: { siteOrigin: string; locale: "en" | "ar"; onToken(t: string): void; onError(): void }) {
  const onMessage = (e: WebViewMessageEvent) => {
    const r = parseCaptchaMessage(e.nativeEvent.data, e.nativeEvent.url, siteOrigin);
    if ("token" in r) onToken(r.token); else onError();
  };
  return (
    <WebView
      source={{ uri: captchaUrl(siteOrigin, locale) }}
      originWhitelist={[siteOrigin, "https://challenges.cloudflare.com"]}
      onShouldStartLoadWithRequest={(req) => allowCaptchaNavigation(req.url, siteOrigin)}
      onMessage={onMessage}
      onError={onError}
      javaScriptEnabled
      domStorageEnabled={false}
      allowFileAccess={false}
      allowsLinkPreview={false}
      setSupportMultipleWindows={false}
      incognito
      style={{ height: 120, backgroundColor: "transparent" }}
      accessibilityLabel="CAPTCHA"
    />
  );
}
