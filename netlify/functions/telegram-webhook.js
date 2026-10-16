// Netlify Serverless Function: Telegram Bot Webhook
// Handles Telegram commands: /start, /add, /assign, /tasks, /done, /help
// No external npm dependencies required (uses native fetch & Supabase REST API)

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
// Use Service Role Key if available (recommended for serverless webhooks), fallback to anon key
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_KEY || process.env.SUPABASE_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Helper: Send reply to Telegram chat
async function sendTelegramMessage(chatId, text) {
    if (!TELEGRAM_BOT_TOKEN) {
        console.error("Missing TELEGRAM_BOT_TOKEN in environment variables");
        return;
    }
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: "HTML",
                disable_web_page_preview: true,
            }),
        });
    } catch (err) {
        console.error("Failed to send Telegram message:", err);
    }
}

// Helper: Query Supabase REST API directly with headers
async function supabaseRequest(endpoint, options = {}) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        throw new Error("Missing Supabase configuration");
    }
    const cleanUrl = SUPABASE_URL.replace(/\/+$/, "");
    const url = `${cleanUrl}/rest/v1/${endpoint.replace(/^\/+/, "")}`;
    const headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
        ...(options.headers || {}),
    };

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Supabase error (${res.status}): ${errorText}`);
    }
    return await res.json();
}

// Helper: Look up linked Supabase user by Telegram chat ID
async function getLinkedProfile(chatId) {
    const profiles = await supabaseRequest(
        `telegram_profiles?telegram_chat_id=eq.${chatId}&is_linked=eq.true&select=user_id,telegram_username`
    );
    return profiles && profiles.length > 0 ? profiles[0] : null;
}

// Main Netlify Handler
exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 200, body: "Telegram webhook endpoint active" };
    }

    let body;
    try {
        body = JSON.parse(event.body || "{}");
    } catch {
        return { statusCode: 400, body: "Invalid JSON" };
    }

    const message = body.message || body.edited_message;
    if (!message || !message.text) {
        return { statusCode: 200, body: "Ignored non-text update" };
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const username = message.from?.username || message.from?.first_name || "User";

    try {
        // ── 1. /start [link_code] ───────────────────────────────────────────
        if (text.startsWith("/start")) {
            const parts = text.split(/\s+/);
            const code = parts[1]?.trim()?.toUpperCase();

            if (code) {
                // Attempt to link profile by code
                const matchingProfiles = await supabaseRequest(
                    `telegram_profiles?link_code=eq.${code}&select=user_id,is_linked`
                );

                if (!matchingProfiles || matchingProfiles.length === 0) {
                    await sendTelegramMessage(
                        chatId,
                        "❌ <b>Kod Tidak Sah</b>\n\nKod sambungan ini salah atau telah tamat tempoh. Sila buka web app TodoApps anda dan klik <b>Connect Telegram</b> untuk jana kod baru."
                    );
                    return { statusCode: 200, body: "OK" };
                }

                const profile = matchingProfiles[0];
                // Update profile as linked
                await supabaseRequest(`telegram_profiles?user_id=eq.${profile.user_id}`, {
                    method: "PATCH",
                    body: JSON.stringify({
                        telegram_chat_id: chatId,
                        telegram_username: username,
                        is_linked: true,
                        linked_at: new Date().toISOString(),
                    }),
                });

                await sendTelegramMessage(
                    chatId,
                    `🎉 <b>Akaun Berjaya Disambungkan!</b>\n\nSelamat datang, <b>@${username}</b>! Akaun TodoApps anda kini aktif dipautkan.\n\n<b>Arahan yang boleh digunakan:</b>\n• <code>/add Siapkan proposal projek #work</code>\n• <code>/assign rakan@email.com Review coding</code>\n• <code>/tasks</code> (Lihat senarai task)\n• <code>/done 1</code> (Tandakan task siap)\n• <code>/help</code> (Panduan penuh)`
                );
                return { statusCode: 200, body: "OK" };
            }

            // /start without code: check if already linked
            const existing = await getLinkedProfile(chatId);
            if (existing) {
                await sendTelegramMessage(
                    chatId,
                    `👋 <b>Hai @${username}!</b>\n\nAkaun anda sudah disambungkan ke TodoApps.\n\nTaip <code>/tasks</code> untuk lihat tugasan atau <code>/help</code> untuk panduan arahan.`
                );
            } else {
                await sendTelegramMessage(
                    chatId,
                    `👋 <b>Selamat datang ke TodoApps Bot!</b>\n\nSila pautkan akaun anda terlebih dahulu:\n1. Buka laman web TodoApps anda.\n2. Klik butang <b>Telegram Bot</b> di menu sidebar.\n3. Salin <b>Kod 6-Aksara</b> dan hantar di sini:\n<code>/start KOD_ANDA</code>`
                );
            }
            return { statusCode: 200, body: "OK" };
        }

        // Check if user is linked for all subsequent commands
        const linkedProfile = await getLinkedProfile(chatId);
        if (!linkedProfile) {
            await sendTelegramMessage(
                chatId,
                `⚠️ <b>Akaun Belum Disambungkan</b>\n\nSila pautkan akaun TodoApps anda terlebih dahulu.\nBuka web app, klik <b>Telegram Bot</b>, dan hantar:\n<code>/start KOD_ANDA</code>`
            );
            return { statusCode: 200, body: "OK" };
        }

        const userId = linkedProfile.user_id;

        // ── 2. /help ────────────────────────────────────────────────────────
        if (text === "/help") {
            const helpText = `📋 <b>PANDUAN TELEGRAM BOT TODOAPPS</b>\n\n` +
                `<b>1. Tambah Task Baru:</b>\n` +
                `<code>/add &lt;tajuk&gt; [#kategori] [due:YYYY-MM-DD]</code>\n` +
                `<i>Contoh:</i>\n` +
                `<code>/add Siapkan slide presentation #work due:tomorrow</code>\n\n` +
                `<b>2. Beri / Agihkan Task (Assign):</b>\n` +
                `<code>/assign &lt;email&gt; &lt;tajuk task&gt;</code>\n` +
                `<i>Contoh:</i>\n` +
                `<code>/assign kawan@email.com Semak dokumen kontrak</code>\n\n` +
                `<b>3. Lihat Senarai Task Aktif:</b>\n` +
                `<code>/tasks</code> atau <code>/list</code>\n\n` +
                `<b>4. Tandakan Task Siap:</b>\n` +
                `<code>/done &lt;nombor task&gt;</code>\n` +
                `<i>Contoh:</i> <code>/done 1</code>`;
            await sendTelegramMessage(chatId, helpText);
            return { statusCode: 200, body: "OK" };
        }

        // ── 3. /add <task> ──────────────────────────────────────────────────
        if (text.startsWith("/add")) {
            const rawContent = text.replace(/^\/add\s*/i, "").trim();
            if (!rawContent) {
                await sendTelegramMessage(
                    chatId,
                    "⚠️ Sila sertakan tajuk task.\n<i>Contoh:</i> <code>/add Beli barang dapur #shopping</code>"
                );
                return { statusCode: 200, body: "OK" };
            }

            // Extract hashtag category
            const catMatch = rawContent.match(/#(work|personal|shopping|fitness)/i);
            const category = catMatch ? catMatch[1].toLowerCase() : "personal";

            // Extract due date if provided
            let dueDate = null;
            const dueMatch = rawContent.match(/\bdue:(today|tomorrow|\d{4}-\d{2}-\d{2})\b/i);
            if (dueMatch) {
                const dueVal = dueMatch[1].toLowerCase();
                if (dueVal === "today") {
                    dueDate = new Date().toISOString().split("T")[0];
                } else if (dueVal === "tomorrow") {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    dueDate = d.toISOString().split("T")[0];
                } else {
                    dueDate = dueVal;
                }
            }

            // Clean title string
            const cleanTitle = rawContent
                .replace(/\s*#(work|personal|shopping|fitness)/ig, "")
                .replace(/\s*\bdue:(today|tomorrow|\d{4}-\d{2}-\d{2})\b/ig, "")
                .trim();

            if (!cleanTitle) {
                await sendTelegramMessage(chatId, "⚠️ Tajuk task tidak boleh kosong.");
                return { statusCode: 200, body: "OK" };
            }

            // Find user's first column (e.g. 'To Do' or first open column)
            let columnId = null;
            let columnName = "To Do";
            try {
                const userCols = await supabaseRequest(
                    `board_columns?user_id=eq.${userId}&order=position.asc&select=id,name,is_done`
                );
                if (userCols && userCols.length > 0) {
                    const openCol = userCols.find(c => !c.is_done) || userCols[0];
                    columnId = openCol.id;
                    columnName = openCol.name;
                }
            } catch (err) {
                console.error("Error fetching board columns:", err);
            }

            // Get user's email for owner_email
            let ownerEmail = null;
            try {
                const users = await supabaseRequest(`todos?user_id=eq.${userId}&select=owner_email&limit=1`);
                ownerEmail = users[0]?.owner_email || null;
            } catch {}

            // Insert new task
            const insertPayload = {
                title: cleanTitle,
                user_id: userId,
                category,
                is_completed: false,
                column_id: columnId,
                position: -Math.floor(Date.now() / 1000),
                owner_email: ownerEmail,
            };
            if (dueDate) insertPayload.due_date = dueDate;

            await supabaseRequest("todos", {
                method: "POST",
                body: JSON.stringify(insertPayload),
            });

            const dueText = dueDate ? `\n📅 Due: <code>${dueDate}</code>` : "";
            await sendTelegramMessage(
                chatId,
                `✅ <b>Task Berjaya Ditambah!</b>\n\n📌 <b>${cleanTitle}</b>\n📂 Kategori: <code>${category}</code>\n📋 Board Column: <b>${columnName}</b>${dueText}`
            );
            return { statusCode: 200, body: "OK" };
        }

        // ── 4. /assign <email> <task> ───────────────────────────────────────
        if (text.startsWith("/assign")) {
            const raw = text.replace(/^\/assign\s*/i, "").trim();
            const emailMatch = raw.match(/^(\S+@\S+\.\S+)\s+(.+)$/);

            if (!emailMatch) {
                await sendTelegramMessage(
                    chatId,
                    "⚠️ Format salah.\n<i>Format yang betul:</i>\n<code>/assign rakan@email.com Tajuk task di sini</code>"
                );
                return { statusCode: 200, body: "OK" };
            }

            const targetEmail = emailMatch[1].trim().toLowerCase();
            const taskTitle = emailMatch[2].trim();

            // Find user's first column
            let columnId = null;
            try {
                const userCols = await supabaseRequest(
                    `board_columns?user_id=eq.${userId}&order=position.asc&select=id,is_done`
                );
                if (userCols && userCols.length > 0) {
                    columnId = (userCols.find(c => !c.is_done) || userCols[0]).id;
                }
            } catch {}

            // Insert todo under sender
            const newTodo = await supabaseRequest("todos", {
                method: "POST",
                body: JSON.stringify({
                    title: taskTitle,
                    user_id: userId,
                    category: "work",
                    is_completed: false,
                    column_id: columnId,
                    position: -Math.floor(Date.now() / 1000),
                }),
            });

            const todoId = newTodo[0]?.id;
            if (todoId) {
                // Share with recipient
                await supabaseRequest("todo_shares", {
                    method: "POST",
                    body: JSON.stringify({
                        todo_id: todoId,
                        shared_with_email: targetEmail,
                        user_id: userId,
                    }),
                });
            }

            await sendTelegramMessage(
                chatId,
                `🤝 <b>Task Berjaya Diberikan!</b>\n\n📌 <b>${taskTitle}</b>\n👤 Assigned to: <code>${targetEmail}</code>\n\n<i>Task ini automatik muncul di column 'Shared with me' rakan anda!</i>`
            );
            return { statusCode: 200, body: "OK" };
        }

        // ── 5. /tasks or /list ──────────────────────────────────────────────
        if (text === "/tasks" || text === "/list") {
            const activeTodos = await supabaseRequest(
                `todos?user_id=eq.${userId}&is_completed=eq.false&order=created_at.desc&limit=10&select=id,title,category,due_date`
            );

            if (!activeTodos || activeTodos.length === 0) {
                await sendTelegramMessage(
                    chatId,
                    "🎉 <b>Tiada Task Aktif!</b>\n\nSemua tugasan telah siap atau belum dicipta. Taip <code>/add &lt;task&gt;</code> untuk tambah task baru."
                );
                return { statusCode: 200, body: "OK" };
            }

            let msg = `📝 <b>Senarai Tugasan Aktif Anda (${activeTodos.length}):</b>\n\n`;
            activeTodos.forEach((t, i) => {
                const num = i + 1;
                const due = t.due_date ? ` (📅 ${t.due_date})` : "";
                msg += `<b>${num}.</b> ${t.title} <i>[#${t.category || "personal"}]</i>${due}\n`;
            });
            msg += `\n<i>Taip <code>/done &lt;nombor&gt;</code> untuk tandakan siap (contoh: <code>/done 1</code>).</i>`;

            await sendTelegramMessage(chatId, msg);
            return { statusCode: 200, body: "OK" };
        }

        // ── 6. /done <nombor> ───────────────────────────────────────────────
        if (text.startsWith("/done")) {
            const numStr = text.replace(/^\/done\s*/i, "").trim();
            const index = parseInt(numStr, 10) - 1;

            if (isNaN(index) || index < 0) {
                await sendTelegramMessage(
                    chatId,
                    "⚠️ Sila nyatakan nombor task dari senarai <code>/tasks</code>.\n<i>Contoh:</i> <code>/done 1</code>"
                );
                return { statusCode: 200, body: "OK" };
            }

            const activeTodos = await supabaseRequest(
                `todos?user_id=eq.${userId}&is_completed=eq.false&order=created_at.desc&limit=10&select=id,title`
            );

            const targetTodo = activeTodos?.[index];
            if (!targetTodo) {
                await sendTelegramMessage(
                    chatId,
                    `❌ Nombor task tidak dijumpai. Taip <code>/tasks</code> untuk lihat senarai terkini.`
                );
                return { statusCode: 200, body: "OK" };
            }

            // Find user's Done column if exists
            let doneColumnId = null;
            try {
                const userCols = await supabaseRequest(
                    `board_columns?user_id=eq.${userId}&is_done=eq.true&select=id&limit=1`
                );
                if (userCols && userCols.length > 0) doneColumnId = userCols[0].id;
            } catch {}

            const updatePayload = { is_completed: true };
            if (doneColumnId) updatePayload.column_id = doneColumnId;

            await supabaseRequest(`todos?id=eq.${targetTodo.id}`, {
                method: "PATCH",
                body: JSON.stringify(updatePayload),
            });

            await sendTelegramMessage(
                chatId,
                `🎉 <b>Tahniah! Task Selesai:</b>\n\n✅ <s>${targetTodo.title}</s>\n\n<i>Task telah dialihkan ke column Done.</i>`
            );
            return { statusCode: 200, body: "OK" };
        }

        // Default fallback for unrecognized messages
        await sendTelegramMessage(
            chatId,
            `🤖 Arahan tidak dikenali. Taip <code>/help</code> untuk panduan atau <code>/add &lt;tajuk task&gt;</code> untuk tambah tugasan.`
        );
        return { statusCode: 200, body: "OK" };

    } catch (error) {
        console.error("Webhook processing error:", error);
        await sendTelegramMessage(chatId, "⚠️ Ralat berlaku semasa memproses arahan anda. Sila cuba sebentar lagi.");
        return { statusCode: 200, body: "Error handled" };
    }
};
