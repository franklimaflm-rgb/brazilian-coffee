// Runs before `vite dev` and `vite build`; writes public/sitemap.xml.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://brazilian-coffee.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const coffeeIds = ["espresso", "cappuccino", "latte", "americano"];

const entries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/menu", changefreq: "weekly", priority: "0.9" },
  { path: "/delivery", changefreq: "monthly", priority: "0.8" },
  { path: "/track-order", changefreq: "monthly", priority: "0.5" },
  { path: "/help", changefreq: "monthly", priority: "0.6" },
  { path: "/install", changefreq: "monthly", priority: "0.4" },
  { path: "/auth", changefreq: "yearly", priority: "0.3" },
  { path: "/qrcode", changefreq: "yearly", priority: "0.3" },
  ...coffeeIds.map((id) => ({
    path: `/coffee/${id}`,
    changefreq: "monthly" as const,
    priority: "0.8",
  })),
];

function generateSitemap(items: SitemapEntry[]) {
  const urls = items.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n")
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
