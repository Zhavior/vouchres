import { Router } from "express";
import type { Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import type { RequestWithContext } from "../middleware/requestContext";
import { getSafePublicOrigin } from "../lib/publicOrigin";
import { BLOG_POSTS } from "../../src/data/blog/posts";

export const seoRoutes = Router();

/**
 * Dynamic XML sitemap generation for search engine indexing.
 */
seoRoutes.get(
  "/sitemap.xml",
  asyncHandler(async (req: RequestWithContext, res: Response) => {
    const baseUrl = getSafePublicOrigin();
    const now = new Date().toISOString().split("T")[0];

    const staticUrls = [
      { loc: `${baseUrl}/`, priority: "1.0", changefreq: "daily" },
      { loc: `${baseUrl}/today`, priority: "1.0", changefreq: "daily" },
      { loc: `${baseUrl}/hr-board`, priority: "0.9", changefreq: "daily" },
      { loc: `${baseUrl}/td-next`, priority: "0.9", changefreq: "daily" },
      { loc: `${baseUrl}/live-games`, priority: "0.8", changefreq: "daily" },
      { loc: `${baseUrl}/research`, priority: "0.8", changefreq: "daily" },
      { loc: `${baseUrl}/build`, priority: "0.8", changefreq: "daily" },
      { loc: `${baseUrl}/news`, priority: "0.8", changefreq: "daily" },
      { loc: `${baseUrl}/about`, priority: "0.8", changefreq: "monthly" },
      { loc: `${baseUrl}/dev`, priority: "0.8", changefreq: "monthly" },
      { loc: `${baseUrl}/contact`, priority: "0.7", changefreq: "monthly" },
      { loc: `${baseUrl}/blog`, priority: "0.9", changefreq: "weekly" },
      { loc: `${baseUrl}/policy`, priority: "0.3", changefreq: "yearly" },
      { loc: `${baseUrl}/terms`, priority: "0.3", changefreq: "yearly" },
    ];

    const blogUrls = BLOG_POSTS.map((post) => ({
      loc: `${baseUrl}/blog/${post.slug}`,
      priority: "0.8",
      changefreq: "monthly",
    }));

    const allUrls = [...staticUrls, ...blogUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (item) => `  <url>
    <loc>${item.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.send(xml);
  })
);

/**
 * Standard robots.txt
 */
seoRoutes.get(
  "/robots.txt",
  asyncHandler(async (req: RequestWithContext, res: Response) => {
    const baseUrl = getSafePublicOrigin();
    const robots = `User-agent: *
Allow: /
Allow: /today
Allow: /hr-board
Allow: /td-next
Allow: /live-games
Allow: /research
Allow: /build
Allow: /news
Allow: /about
Allow: /contact
Allow: /blog
Allow: /blog/*
Allow: /policy
Allow: /terms
Allow: /v/*
Allow: /p/*
Allow: /l/*

Disallow: /api/
Disallow: /admin/

Sitemap: ${baseUrl}/sitemap.xml
`;

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.send(robots);
  })
);

/**
 * Engineering RSS / Atom feed for developer syndication.
 */
seoRoutes.get(
  ["/feed.xml", "/rss.xml", "/feed"],
  asyncHandler(async (req: RequestWithContext, res: Response) => {
    const baseUrl = getSafePublicOrigin();
    const now = new Date().toUTCString();

    const items = BLOG_POSTS.map((post) => {
      const link = `${baseUrl}/blog/${post.slug}`;
      const pubDate = new Date(post.date).toUTCString();
      return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${post.excerpt}]]></description>
      <author>${post.author}</author>
      <category>${post.tag}</category>
      <pubDate>${pubDate !== "Invalid Date" ? pubDate : now}</pubDate>
    </item>`;
    }).join("\n");

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>VouchEdge — Transmission Log</title>
    <link>${baseUrl}/blog</link>
    <description>Engineering updates, methodology breakdowns, and release notes from VouchEdge.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.send(rssXml);
  })
);
