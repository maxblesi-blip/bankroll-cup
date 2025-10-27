// lib/constants.ts

/**
 * Discord Role IDs für Zugriffskontrolle
 */
export const DISCORD_ROLES = {
  BANKROLL_CUP_PARTICIPANT: "1432024313938051164",
  ADMIN: "admin_role_id",
  TEST: "test_role_id",
} as const;

export type DiscordRole = typeof DISCORD_ROLES[keyof typeof DISCORD_ROLES];

/**
 * Prüfe ob User Zugriff hat (Admin/Test ODER Bankroll Participant)
 */
export function hasAccess(userRoles: string[]): boolean {
  return userRoles.some((role) =>
    Object.values(DISCORD_ROLES).includes(role)
  );
}