import { describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES, validateImage } from "@/lib/image-validation";

const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const jpg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const webp = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);
const text = (s: string) => new TextEncoder().encode(s);

describe("validateImage", () => {
  it("accepts PNG, JPEG and WebP by signature", () => {
    expect(validateImage(png, "image/png")).toEqual({ ok: true, ext: "png", mime: "image/png" });
    expect(validateImage(jpg, "image/jpeg")).toEqual({ ok: true, ext: "jpg", mime: "image/jpeg" });
    expect(validateImage(webp)).toEqual({ ok: true, ext: "webp", mime: "image/webp" });
  });
  it("rejects SVG, GIF, HTML and scripts even when the browser claims an image type", () => {
    for (const body of ['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', "GIF89a....", "<html><script>1</script>", "#!/bin/sh"]) {
      expect(validateImage(text(body), "image/png").ok).toBe(false);
    }
  });
  it("rejects a declared type that contradicts the content", () => {
    expect(validateImage(png, "image/jpeg").ok).toBe(false);
  });
  it("enforces the size limit and rejects empty files", () => {
    expect(validateImage(new Uint8Array(0)).ok).toBe(false);
    const big = new Uint8Array(MAX_IMAGE_BYTES + 1);
    big.set(png);
    expect(validateImage(big, "image/png")).toMatchObject({ ok: false, error: expect.stringMatching(/2 MB/) });
    const edge = new Uint8Array(MAX_IMAGE_BYTES);
    edge.set(png);
    expect(validateImage(edge, "image/png").ok).toBe(true);
  });
});
