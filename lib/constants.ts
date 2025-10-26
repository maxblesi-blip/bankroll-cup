// lib/constants.ts

/**
 * Discord Role IDs für Zugriffskontrolle
 */
export const DISCORD_ROLES = {
  BANKROLL_CUP_PARTICIPANT: "1432024313938051164",
} as const;

export type DiscordRole = typeof DISCORD_ROLES[keyof typeof DISCORD_ROLES];