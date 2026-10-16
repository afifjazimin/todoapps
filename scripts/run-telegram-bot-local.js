// scripts/run-telegram-bot-local.js
// Runner untuk menguji Telegram Bot secara lokal (Long-Polling) tanpa perlu setup Webhook atau deploy ke Netlify!
// Cara guna: node scripts/run-telegram-bot-local.js [BOT_TOKEN]
// Atau letak TELEGRAM_BOT_TOKEN di .env dan run: npm run bot

const fs = require("fs");
const path = require("path");

// 1. Muatkan fail .env secara automatik jika wujud
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
            const [key, ...vals] = trimmed.split("=");
            const val = vals.join("=").trim().replace(/^['"]|['"]$/g, "");
            if (key && !process.env[key.trim()]) {
                process.env[key.trim()] = val;
            }
        }
    });
}

// 2. Ambil token dari parameter arahan atau process.env
const tokenArg = process.argv[2];
if (tokenArg) {
    process.env.TELEGRAM_BOT_TOKEN = tokenArg.trim();
}

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.log(`
=====================================================================
🤖 TELEGRAM BOT LOCAL RUNNER (DEV MODE)
=====================================================================

❌ Ralat: TELEGRAM_BOT_TOKEN tidak dijumpai!

CARA SELESAIKAN:
1. Sila masukkan token bot anda di .env:
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ

2. Atau jalankan arahan bersama token:
   node scripts/run-telegram-bot-local.js 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ

=====================================================================
`);
    process.exit(1);
}

// Muatkan webhook handler SELEPAS process.env siap
const webhookHandler = require("../netlify/functions/telegram-webhook.js").handler;

async function startBot() {
    console.log(`\n=====================================================================`);
    console.log(`🚀 MEMULAKAN TELEGRAM BOT TODOAPPS (MOD TEMPATAN / DEV)`);
    console.log(`=====================================================================`);
    
    // Periksa kesahihan bot token
    try {
        const getMeRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const meData = await getMeRes.json();
        if (!meData.ok) {
            console.error(`❌ Token tidak sah! Respons Telegram:`, meData.description);
            process.exit(1);
        }
        console.log(`✅ Sambungan Telegram berjaya!`);
        console.log(`🤖 Bot Name: @${meData.result.username} (${meData.result.first_name})`);
    } catch (err) {
        console.error(`❌ Ralat sambungan internet ke Telegram:`, err.message);
        process.exit(1);
    }

    // Padam webhook lama supaya long polling boleh terima mesej
    try {
        await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);
        console.log(`🔄 Webhook disetkan ke mod polling...`);
    } catch (e) {
        console.warn(`⚠️ Amaran semasa membersihkan webhook:`, e.message);
    }

    console.log(`\n🟢 Bot sedang MENDENGAR mesej (Listening)!`);
    console.log(`📱 Buka Telegram anda, cari bot anda dan hantar: /start`);
    console.log(`(Tekan Ctrl+C untuk hentikan bot pada bila-bila masa)\n`);

    let offset = 0;

    while (true) {
        try {
            const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=20`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.ok && Array.isArray(data.result)) {
                for (const update of data.result) {
                    offset = update.update_id + 1;
                    const msg = update.message || update.edited_message;
                    if (msg && msg.text) {
                        const sender = msg.from?.username ? `@${msg.from.username}` : (msg.from?.first_name || "User");
                        console.log(`📩 [${new Date().toLocaleTimeString()}] Mesej daripada ${sender}: "${msg.text}"`);

                        // Hantar update terus ke handler webhook sedia ada
                        const fakeEvent = {
                            httpMethod: "POST",
                            body: JSON.stringify(update),
                        };

                        try {
                            await webhookHandler(fakeEvent);
                        } catch (handlerErr) {
                            console.error(`❌ Ralat dalam handler:`, handlerErr);
                        }
                    }
                }
            } else if (!data.ok) {
                console.error(`⚠️ Telegram API error:`, data.description);
                await new Promise((r) => setTimeout(r, 3000));
            }
        } catch (err) {
            console.error(`⚠️ Rangkaian ralat semasa polling:`, err.message);
            await new Promise((r) => setTimeout(r, 4000));
        }
    }
}

startBot();
