// The other games, for the "More games" panel. Hand-maintained, unlike the
// country dataset next to it — there are a handful of these and they change
// about as often as a new one gets built.
//
// Wheredle's own two modes deliberately aren't in here. Alex mode is a mode
// of this game, reached from the menu's own link across, and listing it
// alongside a separate site would pad the list while making both entries
// harder to read for what they are.

export interface OtherGame {
  name: string;
  /** One line, sentence case, no full stop — it sits under the name. */
  blurb: string;
  url: string;
}

export const OTHER_GAMES: readonly OtherGame[] = [
  {
    name: "Predictathon",
    blurb: "Online football prediction leagues for the Premier League, European Championships and World Cup",
    url: "https://predictathon.co.uk",
  },
];
