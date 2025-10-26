// lib/constants.ts

/**
 * Discord Role IDs für Zugriffskontrolle
 */
export const DISCORD_ROLES = {
  BANKROLL_CUP_PARTICIPANT: "1430253515036557506",
} as const;

export type DiscordRole = typeof DISCORD_ROLES[keyof typeof DISCORD_ROLES];