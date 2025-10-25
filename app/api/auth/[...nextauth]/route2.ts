import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

const handler = NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (profile) {
        token.name = profile.username || profile.name;
        token.image = profile.image;
        token.id = profile.id;
      }

      // Hole Discord Server Rolle
      if (token.id && process.env.DISCORD_TOKEN && process.env.DISCORD_SERVER_ID) {
        try {
          const response = await fetch(
            `https://discord.com/api/v10/guilds/${process.env.DISCORD_SERVER_ID}/members/${token.id}`,
            {
              headers: {
                Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
              },
            }
          );

          if (response.ok) {
            const member = await response.json();
            const roleIds = member.roles || [];

            if (process.env.ADMIN_ROLE_ID && roleIds.includes(process.env.ADMIN_ROLE_ID)) {
              token.role = "admin";
            } else if (process.env.MOD_ROLE_ID && roleIds.includes(process.env.MOD_ROLE_ID)) {
              token.role = "mod";
            } else if (process.env.PLAYER_ROLE_ID && roleIds.includes(process.env.PLAYER_ROLE_ID)) {
              token.role = "player";
            } else {
              token.role = "user";
            }
          } else {
            token.role = "player";
          }
        } catch (error) {
          console.error("Role fetch error:", error);
          token.role = "player";
        }
      } else {
        token.role = "player";
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role || "player";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };