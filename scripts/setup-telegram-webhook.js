// Script: Setup Telegram Webhook URL
// Usage: node scripts/setup-telegram-webhook.js <TELEGRAM_BOT_TOKEN> <NETLIFY_SITE_URL>
// Example: node scripts/setup-telegram-webhook.js 78912345:ABCdef https://my-todo-app.netlify.app

const token = process.argv[2] || process.env.TELEGRAM_BOT_TOKEN;
const siteUrl = process.argv[3] || process.env.SITE_URL || process.env.URL;

if (!token || !siteUrl) {
    console.log(`
===========================================================
  Telegram Bot Webhook Setup Helper
===========================================================

Penggunaan:
  node scripts/setup-telegram-webhook.js <BOT_TOKEN> <SITE_URL>

Contoh:
  node scripts/setup-telegram-webhook.js 123456:ABC-DEF https://my-toodu.netlify.app

Nota:
  URL Netlify mestilah HTTPS yang aktif (contoh: https://your-site.netlify.app).
===========================================================
`);
    process.exit(1);
}

const cleanSiteUrl = siteUrl.replace(/\/+$/, "");
const webhookUrl = `${cleanSiteUrl}/.netlify/functions/telegram-webhook`;

console.log(`\n⏳ Sedang mendaftarkan webhook ke Telegram...`);
console.log(`📍 Webhook Endpoint: ${webhookUrl}\n`);

fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`)
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            console.log(`🎉 BERJAYA! Webhook didaftarkan.`);
            console.log(`Mesej Telegram: ${data.description}`);
            console.log(`\nSekarang buka bot Telegram anda dan cuba taip /start!`);
        } else {
            console.error(`❌ Gagal mendaftar webhook:`, data);
        }
    })
    .catch(err => {
        console.error(`❌ Ralat rangkaian:`, err.message);
    });
