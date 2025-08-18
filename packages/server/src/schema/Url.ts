import { Schema as S } from "@effect/schema";
import * as Parser from "@effect/schema/Parser";
import * as Encoder from "@effect/schema/Encoder";
import { pipe } from "effect/Function";

/** Base: any URL that the platform `URL` accepts */
export const Url = pipe(
  S.String,
  S.transformOrFail(
    S.InstanceOf(URL),
    (s, ctx) => {
      try { return new URL(s); }
      catch (e) { return S.fail(ctx, `invalid URL: ${(e as Error).message}`); }
    },
    (u) => u.toString()
  )
);
export type Url = S.To<typeof Url>;   // URL
export type UrlInput = S.From<typeof Url>; // string

/** Restrict to http/https (optional) */
export const HttpUrl = pipe(
  Url,
  S.filter((u) => u.protocol === "http:" || u.protocol === "https:", {
    message: () => "protocol must be http or https"
  })
);

/** Proxy URL: http/https, must include a port; creds optional */
export const ProxyUrl = pipe(
  HttpUrl,
  S.filter((u) => u.port !== "", { message: () => "port is required" })
);
export type ProxyUrl = S.To<typeof ProxyUrl>; // URL
