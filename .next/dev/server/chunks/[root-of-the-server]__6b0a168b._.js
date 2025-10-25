module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/bankroll-cup/app/api/check-discord-membership/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// app/api/check-discord-membership/route.ts
__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$bankroll$2d$cup$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/bankroll-cup/node_modules/next/server.js [app-route] (ecmascript)");
;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
async function POST(request) {
    try {
        const body = await request.json();
        let discordUserId = body.discordUserId;
        // Debug Logging
        console.log("=== Discord Membership Check ===");
        console.log("Request body:", body);
        console.log("DISCORD_BOT_TOKEN set?", !!DISCORD_BOT_TOKEN);
        console.log("DISCORD_GUILD_ID:", DISCORD_GUILD_ID);
        console.log("Discord User ID:", discordUserId);
        // Validierung 1: Guild ID
        if (!DISCORD_GUILD_ID) {
            console.error("❌ DISCORD_GUILD_ID nicht gesetzt!");
            return __TURBOPACK__imported__module__$5b$project$5d2f$bankroll$2d$cup$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "❌ Server Konfiguration fehlt: DISCORD_GUILD_ID nicht in .env.local gesetzt",
                isMember: false,
                hint: 'Bitte setze "DISCORD_GUILD_ID" in .env.local und starte den Server neu'
            }, {
                status: 500
            });
        }
        // Validierung 2: Bot Token
        if (!DISCORD_BOT_TOKEN) {
            console.error("❌ DISCORD_BOT_TOKEN nicht gesetzt!");
            return __TURBOPACK__imported__module__$5b$project$5d2f$bankroll$2d$cup$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "❌ Server Konfiguration fehlt: DISCORD_BOT_TOKEN nicht in .env.local gesetzt",
                isMember: false,
                hint: 'Bitte setze "DISCORD_BOT_TOKEN" in .env.local und starte den Server neu'
            }, {
                status: 500
            });
        }
        // Validierung 3: User ID
        if (!discordUserId) {
            console.error("❌ Discord User ID nicht vorhanden!");
            console.error("Request Body war:", body);
            return __TURBOPACK__imported__module__$5b$project$5d2f$bankroll$2d$cup$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "❌ Discord User ID erforderlich",
                isMember: false,
                hint: "Die Discord User ID konnte nicht aus der Session extrahiert werden",
                receivedData: body
            }, {
                status: 400
            });
        }
        console.log(`✓ Überprüfe: User ${discordUserId} im Guild ${DISCORD_GUILD_ID}`);
        // Überprüfe ob User auf dem Discord Server ist
        const response = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}`, {
            method: "GET",
            headers: {
                Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
                "Content-Type": "application/json"
            }
        });
        console.log(`Discord API Response Status: ${response.status}`);
        // Status 200 -> User ist auf dem Server ✓
        if (response.ok) {
            const memberData = await response.json();
            console.log(`✓ User ${discordUserId} ist Mitglied des Servers`);
            return __TURBOPACK__imported__module__$5b$project$5d2f$bankroll$2d$cup$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                isMember: true,
                nickname: memberData.nick || memberData.user?.username || "Member",
                joinedAt: memberData.joined_at,
                roles: memberData.roles || []
            });
        }
        // Status 404 -> User ist NICHT auf dem Server ✗
        if (response.status === 404) {
            console.log(`✗ User ${discordUserId} ist NICHT Mitglied des Servers`);
            return __TURBOPACK__imported__module__$5b$project$5d2f$bankroll$2d$cup$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                isMember: false,
                message: "Benutzer ist nicht auf dem Discord Server"
            });
        }
        // Andere Fehler
        const errorText = await response.text();
        console.error(`❌ Discord API Error ${response.status}:`, errorText);
        return __TURBOPACK__imported__module__$5b$project$5d2f$bankroll$2d$cup$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: `Discord API Error: ${response.status} ${response.statusText}`,
            isMember: false,
            details: errorText
        }, {
            status: response.status
        });
    } catch (error) {
        console.error("❌ Unerwarteter Fehler:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$bankroll$2d$cup$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Fehler beim Überprüfen der Discord Mitgliedschaft",
            isMember: false,
            details: error instanceof Error ? error.message : "Unbekannter Fehler"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__6b0a168b._.js.map