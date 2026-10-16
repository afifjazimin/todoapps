// scripts/verify-setup.js
// Semak status konfigurasi Supabase dan Telegram Bot secara automatik

const fs = require("fs");
const path = require("path");

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

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || process.env.SUPABASE_KEY;
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;

async function check() {
    console.log(`\n========================================================`);
    console.log(`🔍 STATUS INTEGRASI TELEGRAM BOT & SUPABASE`);
    console.log(`========================================================\n`);

    // 1. Supabase Connection
    if (!supabaseUrl || !supabaseKey) {
        console.log(`❌ 1. Supabase .env: Tiada konfigurasi SUPABASE_URL / KEY di .env`);
    } else {
        console.log(`✅ 1. Supabase .env: Dijumpai (${supabaseUrl})`);
    }

    // 2. Table board_columns
    try {
        const res1 = await fetch(`${supabaseUrl}/rest/v1/board_columns?select=id&limit=1`, {
            headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        });
        if (res1.ok) {
            console.log(`✅ 2. Database board_columns: Sedia & Berfungsi!`);
        } else {
            console.log(`❌ 2. Database board_columns: Gagal (${res1.status})`);
        }
    } catch (e) {
        console.log(`❌ 2. Database board_columns: Ralat rangkaian (${e.message})`);
    }

    // 3. Table telegram_profiles
    try {
        const res2 = await fetch(`${supabaseUrl}/rest/v1/telegram_profiles?select=user_id&limit=1`, {
            headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        });
        if (res2.ok) {
            console.log(`✅ 3. Database telegram_profiles: Sedia & Berfungsi!`);
        } else if (res2.status === 404) {
            console.log(`⚠️ 3. Database telegram_profiles: BELUM DIBUAT.`);
            console.log(`   👉 Sila copy fail docs/SUPABASE_TELEGRAM_MIGRATION.sql dan run di Supabase SQL Editor.`);
        } else {
            console.log(`⚠️ 3. Database telegram_profiles: Respons status ${res2.status}`);
        }
    } catch (e) {
        console.log(`❌ 3. Database telegram_profiles: Ralat (${e.message})`);
    }

    // 4. Telegram Bot Token
    if (!telegramToken) {
        console.log(`\n⚠️ 4. Telegram Bot Token: BELUM DIISI di .env (TELEGRAM_BOT_TOKEN)`);
        console.log(`   👉 Dapatkan token daripada @BotFather di Telegram.`);
    } else {
        try {
            const tgRes = await fetch(`https://api.telegram.org/bot${telegramToken}/getMe`);
            const tgData = await tgRes.json();
            if (tgData.ok) {
                console.log(`\n✅ 4. Telegram Bot Token: SAH & AKTIF!`);
                console.log(`   🤖 Username: @${tgData.result.username}`);
                console.log(`   📛 Nama: ${tgData.result.first_name}`);
            } else {
                console.log(`\n❌ 4. Telegram Bot Token: TIDAK SAH (${tgData.description})`);
            }
        } catch (e) {
            console.log(`\n❌ 4. Telegram Bot Token: Gagal disambungkan (${e.message})`);
        }
    }

    console.log(`\n========================================================\n`);
}

check();
