// Cloudflare Pages Function — robots.txt
// Cloudflare'ın "Managed Content" otomatik wrapper'ını bypass eder
// (Content-Signal directive'i Google'da "unknown directive" uyarısı verir)

const ROBOTS_TXT = `# AI Chatbot Crawlers
User-agent: GPTBot
Allow: /
Disallow: /admin
Disallow: /admin-login

User-agent: ChatGPT-User
Allow: /
Disallow: /admin
Disallow: /admin-login

User-agent: ClaudeBot
Allow: /
Disallow: /admin
Disallow: /admin-login

User-agent: PerplexityBot
Allow: /
Disallow: /admin
Disallow: /admin-login

User-agent: Google-Extended
Allow: /
Disallow: /admin
Disallow: /admin-login

User-agent: Applebot-Extended
Allow: /
Disallow: /admin
Disallow: /admin-login

# General
User-agent: *
Allow: /

Disallow: /admin
Disallow: /admin.html
Disallow: /admin-login
Disallow: /admin-login.html
Disallow: /blog-seed*
Disallow: /blog-update*
Disallow: /mekan-ekle.html

Sitemap: https://assosukesfet.com/sitemap.xml

# AI Content Index
# llms.txt: https://assosukesfet.com/llms.txt
# llms-full.txt: https://assosukesfet.com/llms-full.txt
`;

export async function onRequestGet() {
  return new Response(ROBOTS_TXT, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
