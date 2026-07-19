import "server-only";
import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import type { IncomingHttpHeaders } from "node:http";
import * as cheerio from "cheerio";
import { validatePublicHttpUrl } from "@/lib/api/validation";

const MAX_RESPONSE_BYTES = 2_000_000;
const MAX_ARTICLE_CHARACTERS = 8_000;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;

export type ImportedArticle = {
  title: string;
  text: string;
  url: string;
  domain: string;
  accessedAt: string;
  truncated: boolean;
};

type PublicAddress = { address: string; family: number };
type ImportedResponse = { status: number; headers: IncomingHttpHeaders; body: Buffer };

export class ArticleImportError extends Error {
  constructor(public readonly code: "URL_INVALID" | "URL_FETCH_FAILED" | "URL_CONTENT_UNSUPPORTED" | "URL_CONTENT_TOO_LARGE") {
    super(code);
  }
}

function isPrivateAddress(address: string) {
  const lower = address.toLowerCase();
  if (lower === "::1" || lower === "::" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80:" ) || lower.startsWith("::ffff:127.")) return true;
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;
  return parts[0] === 0 || parts[0] === 10 || parts[0] === 127 || parts[0] === 169 && parts[1] === 254 || parts[0] === 192 && parts[1] === 168 || parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31;
}

async function publicAddressesForUrl(url: URL): Promise<PublicAddress[]> {
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) throw new ArticleImportError("URL_INVALID");
  const records = await lookup(hostname, { all: true, verbatim: true }).catch(() => { throw new ArticleImportError("URL_FETCH_FAILED"); });
  if (records.length === 0 || records.some((record) => isPrivateAddress(record.address))) throw new ArticleImportError("URL_INVALID");
  return records;
}

function headerValue(headers: IncomingHttpHeaders, name: string) {
  const value = headers[name];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

/** Pins the outbound connection to a DNS-validated public address. */
async function fetchPinnedPublicUrl(url: URL, addresses: PublicAddress[]): Promise<ImportedResponse> {
  const address = addresses[0];
  const request = url.protocol === "https:" ? httpsRequest : httpRequest;

  return new Promise((resolve, reject) => {
    const outbound = request(url, {
      headers: {
        "User-Agent": "LevelLens article importer/1.0",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Encoding": "identity",
      },
      lookup: (_hostname, _options, callback) => callback(null, address.address, address.family),
    }, (response) => {
      const chunks: Buffer[] = [];
      let byteLength = 0;
      response.on("data", (chunk: Buffer) => {
        byteLength += chunk.length;
        if (byteLength > MAX_RESPONSE_BYTES) {
          outbound.destroy(new ArticleImportError("URL_CONTENT_TOO_LARGE"));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => resolve({ status: response.statusCode || 0, headers: response.headers, body: Buffer.concat(chunks) }));
      response.on("error", reject);
    });
    outbound.setTimeout(REQUEST_TIMEOUT_MS, () => outbound.destroy(new ArticleImportError("URL_FETCH_FAILED")));
    outbound.on("error", reject);
    outbound.end();
  });
}

function normalizeText(value: string) {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

export function extractArticleHtml(html: string) {
  const $ = cheerio.load(html);
  $("script, style, noscript, svg, iframe, nav, footer, header, aside, form, button").remove();
  const title = normalizeText($("meta[property='og:title']").attr("content") || $("title").first().text() || $("h1").first().text()) || "Untitled article";
  const root = $("article").first().length ? $("article").first() : $("main").first().length ? $("main").first() : $("[role='main']").first().length ? $("[role='main']").first() : $("body").first();
  const blocks = root.find("p, li, blockquote, h2, h3").toArray().map((node) => normalizeText($(node).text())).filter((block) => block.length >= 20);
  const fallback = normalizeText(root.text());
  return { title: title.slice(0, 200), text: (blocks.length > 0 ? blocks.join("\n\n") : fallback).trim() };
}

export async function importArticle(rawUrl: unknown): Promise<ImportedArticle> {
  let url = validatePublicHttpUrl(rawUrl);
  if (!url) throw new ArticleImportError("URL_INVALID");

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const addresses = await publicAddressesForUrl(url);
    let response: ImportedResponse;
    try {
      response = await fetchPinnedPublicUrl(url, addresses);
    } catch (error) {
      if (error instanceof ArticleImportError) throw error;
      throw new ArticleImportError("URL_FETCH_FAILED");
    }
    if (response.status >= 300 && response.status < 400) {
      const location = headerValue(response.headers, "location");
      if (!location || redirect === MAX_REDIRECTS) throw new ArticleImportError("URL_FETCH_FAILED");
      url = validatePublicHttpUrl(new URL(location, url).toString());
      if (!url) throw new ArticleImportError("URL_INVALID");
      continue;
    }
    if (response.status < 200 || response.status >= 300) throw new ArticleImportError("URL_FETCH_FAILED");
    const contentType = headerValue(response.headers, "content-type");
    if (!/^(text\/html|application\/xhtml\+xml)\b/i.test(contentType)) throw new ArticleImportError("URL_CONTENT_UNSUPPORTED");
    const contentLength = Number(headerValue(response.headers, "content-length"));
    if (contentLength > MAX_RESPONSE_BYTES) throw new ArticleImportError("URL_CONTENT_TOO_LARGE");
    if (headerValue(response.headers, "content-encoding") && headerValue(response.headers, "content-encoding") !== "identity") throw new ArticleImportError("URL_CONTENT_UNSUPPORTED");
    const html = response.body.toString("utf8");
    const extracted = extractArticleHtml(html);
    if (extracted.text.length < 200) throw new ArticleImportError("URL_CONTENT_UNSUPPORTED");
    const truncated = extracted.text.length > MAX_ARTICLE_CHARACTERS;
    return { title: extracted.title, text: extracted.text.slice(0, MAX_ARTICLE_CHARACTERS).trim(), url: url.toString(), domain: url.hostname, accessedAt: new Date().toISOString(), truncated };
  }
  throw new ArticleImportError("URL_FETCH_FAILED");
}
