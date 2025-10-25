export interface Player {
  id: string;
  name: string;
  ggpokerNickname: string;
  bankroll: number;
  livestreamLink: string;
  lastVerification: string;
}

export const mockPlayers: Player[] = [
  {
    id: "1",
    name: "Spieler A",
    ggpokerNickname: "ProPlayer123",
    bankroll: 3500,
    livestreamLink: "https://twitch.tv/prostream",
    lastVerification: "2025-10-23",
  },
  {
    id: "2",
    name: "Spieler B",
    ggpokerNickname: "HighRoller99",
    bankroll: 2800,
    livestreamLink: "",
    lastVerification: "2025-10-23",
  },
  {
    id: "3",
    name: "Spieler C",
    ggpokerNickname: "GrindNinja",
    bankroll: 2100,
    livestreamLink: "https://twitch.tv/grindninja",
    lastVerification: "2025-10-22",
  },
];