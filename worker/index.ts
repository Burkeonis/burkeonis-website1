/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

// Cloudflare's `_headers` file only applies to responses served directly
// off the static-assets binding (legacy .html pages, CSS, images, etc).
// Anything rendered by the Next.js/vinext app router — the homepage,
// /pattern-files, /terms, /privacy, /refund, /disclaimer, /order/*, and
// every /api/* route — never passes through that layer, so it shipped
// with none of the security headers even after `_headers` was fixed.
// Enforce the same policy here, once, for every response this Worker
// returns, so static and dynamically-rendered pages are covered equally.
// `setIfAbsent` avoids double-setting a header a static response already
// carries from `_headers`.
function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  const setIfAbsent = (name: string, value: string) => {
    if (!headers.has(name)) headers.set(name, value);
  };

  setIfAbsent("X-Content-Type-Options", "nosniff");
  setIfAbsent("Referrer-Policy", "strict-origin-when-cross-origin");
  setIfAbsent("X-Frame-Options", "DENY");
  setIfAbsent("X-Permitted-Cross-Domain-Policies", "none");
  setIfAbsent("Cross-Origin-Opener-Policy", "same-origin");
  setIfAbsent("Cross-Origin-Resource-Policy", "same-origin");
  setIfAbsent("Origin-Agent-Cluster", "?1");
  setIfAbsent(
    "Permissions-Policy",
    "accelerometer=(), autoplay=(self), camera=(), display-capture=(), encrypted-media=(), fullscreen=(self), gamepad=(), geolocation=(), gyroscope=(), hid=(), idle-detection=(), magnetometer=(), microphone=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), serial=(), usb=(), web-share=(self), xr-spatial-tracking=()",
  );
  setIfAbsent("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  // Same interim CSP as `_headers`: 'unsafe-inline' on script-src is a
  // deliberate, documented compromise — the app router hydrates pages
  // with inline <script> tags, and a strict policy without a nonce/hash
  // would break every interactive page, checkout included. Everything
  // else in the policy stays locked to same-origin.
  setIfAbsent(
    "Content-Security-Policy",
    "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; script-src-attr 'none'; worker-src 'self' blob:; connect-src 'self'; manifest-src 'self'; upgrade-insecure-requests",
  );

  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      const imageResponse = await handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
      return withSecurityHeaders(imageResponse);
    }

    return withSecurityHeaders(await handler.fetch(request, env, ctx));
  },
};

export default worker;
