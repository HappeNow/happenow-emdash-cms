import type { APIRoute } from "astro";
import { getEmDashCollection } from "emdash";

export const GET: APIRoute = async ({ site, url }) => {
	const siteUrl = site?.origin || url.origin;

	const { entries: posts } = await getEmDashCollection("posts", {
		orderBy: { published_at: "desc" },
		limit: 1000,
	});

	const urls = posts
		.filter((post) => post.data.publishedAt)
		.map((post) => {
			const lastmod = (
				post.data.updatedAt ?? post.data.publishedAt
			)?.toISOString();
			return `  <url>
    <loc>${escapeXml(`${siteUrl}/blog/${post.id}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
  </url>`;
		})
		.join("\n");

	const indexUrl = `  <url>
    <loc>${escapeXml(`${siteUrl}/blog`)}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexUrl}
${urls}
</urlset>`;

	return new Response(xml, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
};

const XML_ESCAPE_PATTERNS = [
	[/&/g, "&amp;"],
	[/</g, "&lt;"],
	[/>/g, "&gt;"],
	[/"/g, "&quot;"],
	[/'/g, "&apos;"],
] as const;

function escapeXml(str: string): string {
	let result = str;
	for (const [pattern, replacement] of XML_ESCAPE_PATTERNS) {
		result = result.replace(pattern, replacement);
	}
	return result;
}
