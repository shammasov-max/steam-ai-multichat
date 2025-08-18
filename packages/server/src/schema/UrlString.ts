import { Schema as S } from "effect"
import { pipe } from "effect/Function"

// Reusable template-literal types for URL strings
export type UrlProtocol = "http" | "https"
export type UrlStringTemplate<P extends UrlProtocol = UrlProtocol> = `${P}://${string}`

// Runtime validator using the built-in URL class
const isUrlStringLiteral = (s: string): s is UrlStringTemplate => { try { const u = new URL(s); return u.protocol === "http:" || u.protocol === "https:" } catch { return false } }

// Schema for constrained http(s) URL strings (encoded side)
const _UrlString = pipe(
  S.String,
  S.filter(isUrlStringLiteral, { message: () => "Expected a valid http(s) URL" }),
  S.annotations({ identifier: "UrlString" })
)

// Redeclare to expose a template-literal string on both Type and Encoded sides
export const UrlString: S.Schema<UrlStringTemplate, UrlStringTemplate> = _StringToUrlString as unknown as S.Schema<UrlStringTemplate, UrlStringTemplate>

// URL <-> string bidirectional schema using built-in URL for validation
export const URLFromString = S.transform(
  HttpUrlString,
  S.instanceOf(URL),
  {
    strict: true,
    decode: (value) => new URL(value),
    encode: (url) => url.toString() as HttpUrlStringTemplateLiteral,
  }
)

// Narrower https-only variant (optional utility)
export type UrlString = HttpUrlStringTemplateLiteral<"https">
const isURLString = (s: string): s is UrlString => { try { const u = new URL(s); return u.protocol === "https:" } catch { return false } }
const _UrlString = pipe(
  S.String,
  S.filter(isURLString, { message: () => "Expected a valid https URL" }),
  S.annotations({ identifier: "UrlString" })
)
export const UrlString: S.Schema<UrlString, UrlString> = _UrlString as unknown as S.Schema<UrlString, UrlString>
export const HttpsURLFromString = S.transform(
  UrlString,
  S.instanceOf(URL),
  {
    strict: true,
    decode: (value) => new URL(value),
    encode: (url) => url.toString() as UrlString,
  }
)


