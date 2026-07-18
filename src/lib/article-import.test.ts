import { describe, expect, it } from "vitest";
import { extractArticleHtml } from "./article-import";
import { validatePublicHttpUrl } from "./api/validation";

describe("article URL import", () => {
  it("accepts only HTTP(S) URLs without credentials", () => {
    expect(validatePublicHttpUrl("https://example.org/article")?.hostname).toBe("example.org");
    expect(validatePublicHttpUrl("ftp://example.org/article")).toBeNull();
    expect(validatePublicHttpUrl("https://user:password@example.org/article")).toBeNull();
  });

  it("extracts article content while excluding navigation and scripts", () => {
    const extracted = extractArticleHtml(`
      <html><head><title>Water in cities</title><script>ignore()</script></head>
      <body><nav>Navigation should not appear</nav><article>
      <p>Small city gardens can lower temperatures and give neighbors a place to meet.</p>
      <p>Students can measure the shade, count insects, and compare the soil after rain.</p>
      </article><footer>Footer should not appear</footer></body></html>
    `);
    expect(extracted.title).toBe("Water in cities");
    expect(extracted.text).toContain("Small city gardens");
    expect(extracted.text).toContain("Students can measure");
    expect(extracted.text).not.toContain("Navigation");
    expect(extracted.text).not.toContain("Footer");
  });
});
