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
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/assert [external] (assert, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("assert", () => require("assert"));

module.exports = mod;
}),
"[externals]/querystring [external] (querystring, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("querystring", () => require("querystring"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/bankroll-cup/app/api/auth/[...nextauth]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>handler,
    "POST",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$bankroll$2d$cup$2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/bankroll-cup/node_modules/next-auth/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$bankroll$2d$cup$2f$node_modules$2f$next$2d$auth$2f$providers$2f$discord$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/bankroll-cup/node_modules/next-auth/providers/discord.js [app-route] (ecmascript)");
;
;
// Cache für Rollen
const roleCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 Minuten
const getCachedRole = (userId)=>{
    const cached = roleCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.role;
    }
    roleCache.delete(userId);
    return null;
};
const setCachedRole = (userId, role)=>{
    roleCache.set(userId, {
        role,
        timestamp: Date.now()
    });
};
const fetchUserRole = async (userId)=>{
    const cachedRole = getCachedRole(userId);
    if (cachedRole) {
        console.log(`✅ [CACHE HIT] Role für ${userId}: ${cachedRole}`);
        return cachedRole;
    }
    if (!userId) {
        console.error("❌ [ERROR] Keine User ID vorhanden");
        return "player";
    }
    const discordToken = process.env.DISCORD_TOKEN;
    const serverId = process.env.DISCORD_SERVER_ID;
    if (!discordToken) {
        console.error("❌ [ERROR] DISCORD_TOKEN nicht in .env.local gesetzt!");
        return "player";
    }
    if (!serverId) {
        console.error("❌ [ERROR] DISCORD_SERVER_ID nicht in .env.local gesetzt!");
        return "player";
    }
    try {
        console.log(`🔍 [FETCH] Hole Rollen für Discord User: ${userId}`);
        console.log(`🔍 [FETCH] Server ID: ${serverId}`);
        const response = await fetch(`https://discord.com/api/v10/guilds/${serverId}/members/${userId}`, {
            method: "GET",
            headers: {
                Authorization: `Bot ${discordToken}`,
                "Content-Type": "application/json"
            }
        });
        if (!response.ok) {
            console.error(`❌ [DISCORD API] Status: ${response.status} ${response.statusText}`);
            if (response.status === 401) {
                console.error("❌ [ERROR] Bot Token ungültig oder abgelaufen!");
            } else if (response.status === 403) {
                console.error("❌ [ERROR] Bot hat keine Permissions im Server!");
            } else if (response.status === 404) {
                console.error(`❌ [ERROR] User ${userId} nicht im Server oder nicht gefunden!`);
            }
            return "player";
        }
        const member = await response.json();
        const roleIds = member.roles || [];
        console.log(`📋 [ROLES] User ${userId} hat Role IDs:`, roleIds);
        const adminRoleId = process.env.ADMIN_ROLE_ID;
        const modRoleId = process.env.MOD_ROLE_ID;
        const playerRoleId = process.env.PLAYER_ROLE_ID;
        console.log(`🏷️  [CONFIG] ADMIN_ROLE_ID: ${adminRoleId}`);
        console.log(`🏷️  [CONFIG] MOD_ROLE_ID: ${modRoleId}`);
        console.log(`🏷️  [CONFIG] PLAYER_ROLE_ID: ${playerRoleId}`);
        let role = "player";
        if (adminRoleId && roleIds.includes(adminRoleId)) {
            role = "admin";
            console.log(`🟢 [RESULT] User ${userId} → ADMIN`);
        } else if (modRoleId && roleIds.includes(modRoleId)) {
            role = "mod";
            console.log(`🟡 [RESULT] User ${userId} → MOD`);
        } else if (playerRoleId && roleIds.includes(playerRoleId)) {
            role = "player";
            console.log(`🔵 [RESULT] User ${userId} → PLAYER`);
        } else {
            console.warn(`⚠️  [RESULT] User ${userId} hat keine erkannte Rolle (Standard: PLAYER)`);
        }
        setCachedRole(userId, role);
        return role;
    } catch (error) {
        console.error("❌ [EXCEPTION] Role fetch error:", error);
        return "player";
    }
};
// ============= GOOGLE SHEETS INTEGRATION =============
async function syncUserToSheets(discordId, discordUsername, discordEmail) {
    try {
        console.log(`\n📊 [SHEETS] Synce User zu Google Sheets...`);
        console.log(`   Discord ID: ${discordId}`);
        console.log(`   Username: ${discordUsername}`);
        console.log(`   Email: ${discordEmail}`);
        // Rufe Sync API auf (auf dem Server, nicht im Client)
        const response = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/sync-user`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                discordId,
                discordUsername,
                discordEmail
            })
        });
        if (response.ok) {
            console.log(`✅ [SHEETS] User erfolgreich synchronisiert`);
        } else {
            console.error(`⚠️  [SHEETS] Sync API Error: ${response.status}`);
        }
    } catch (error) {
        console.error("❌ [SHEETS] Sync Error:", error);
    // Fehler nicht kritisch - App funktioniert auch ohne Sheets Sync
    }
}
// ============= NEXTAUTH KONFIGURATION =============
const handler = (0, __TURBOPACK__imported__module__$5b$project$5d2f$bankroll$2d$cup$2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])({
    providers: [
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$bankroll$2d$cup$2f$node_modules$2f$next$2d$auth$2f$providers$2f$discord$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])({
            clientId: process.env.DISCORD_CLIENT_ID || "",
            clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
            allowDangerousEmailAccountLinking: true,
            // Wichtige Scopes für Email und Guilds
            authorization: {
                params: {
                    scope: "identify email guilds"
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60
    },
    callbacks: {
        async jwt ({ token, account, profile }) {
            // Initial Login: Discord ID und Daten speichern
            if (account?.provider === "discord" && profile?.id) {
                token.discordId = profile.id;
                token.discordUsername = profile.username;
                token.discordEmail = profile.email;
                token.discordImage = profile.image;
                console.log(`📝 [JWT] Discord Profile gespeichert:`);
                console.log(`   ID: ${profile.id}`);
                console.log(`   Username: ${profile.username}`);
                console.log(`   Email: ${profile.email}`);
                // ✅ Synce zu Google Sheets
                await syncUserToSheets(profile.id, profile.username || "", profile.email || "");
            }
            // Username aktualisieren
            if (profile?.username || profile?.name) {
                token.name = profile.username || profile.name;
            }
            // Role beim Login oder nach Cache-Ablauf laden
            const discordId = token.discordId;
            if (discordId) {
                const lastRoleCheck = token.lastRoleCheck || 0;
                const timeSinceCheck = Date.now() - lastRoleCheck;
                if (!token.role || timeSinceCheck > CACHE_TTL) {
                    console.log(`♻️  [JWT] Aktualisiere Rollen (${timeSinceCheck}ms seit letztem Check)`);
                    const role = await fetchUserRole(discordId);
                    token.role = role;
                    token.lastRoleCheck = Date.now();
                } else {
                    console.log(`⏭️  [JWT] Role noch gültig (${Math.round(timeSinceCheck / 1000)}s alt)`);
                }
            }
            return token;
        },
        async session ({ session, token }) {
            if (session.user) {
                session.user.id = token.discordId;
                session.user.role = token.role || "player";
                // ✅ Füge Discord Daten hinzu
                session.user.discordId = token.discordId;
                session.user.discordEmail = token.discordEmail;
                session.user.discordUsername = token.discordUsername;
                // Setze Email
                if (token.discordEmail) {
                    session.user.email = token.discordEmail;
                }
                // Setze Image
                if (token.discordImage) {
                    session.user.image = token.discordImage;
                }
                console.log(`✅ [SESSION] Benutzer: ${token.name} | Rolle: ${token.role} | Discord ID: ${token.discordId}`);
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        error: "/auth/error"
    }
});
;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__f8c0b65c._.js.map