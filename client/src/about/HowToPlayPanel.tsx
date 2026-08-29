import type { ReactNode } from "react";
import { MODE } from "../mode";
import { COLORS } from "../theme";
import { Prose, Section } from "./InfoModal";

// The rules, in whichever mode the player is actually looking at. Both sets
// end with the same "Both modes" section rather than repeating the daily
// business twice in each — that part is the shell's behaviour, not the
// game's.

function List({ children }: { children: ReactNode }) {
  return (
    <ul style={{ margin: "0 0 10px", paddingLeft: 20, fontSize: 14, lineHeight: 1.55, color: COLORS.text }}>
      {children}
    </ul>
  );
}

function WheredleRules() {
  return (
    <>
      <Prose>
        One country a day, the same one for every player, in seven guesses or fewer. You start with a single clue, and
        every wrong guess buys the next one.
      </Prose>
      <Section heading="The clues">
        <List>
          <li>A letter from the country's name, there from the off.</li>
          <li>A zoomed crop of its flag.</li>
          <li>Its border outline.</li>
          <li>
            Then three of your choosing — continent, population and language, in whatever order you like, until all
            three are spent.
          </li>
          <li>The full flag, before your last guess.</li>
        </List>
      </Section>
    </>
  );
}

function AlexRules() {
  return (
    <>
      <Prose>
        One country a day, the same one for every player, in six guesses or fewer. There are no clues to start with
        here; your guesses are the clues.
      </Prose>
      <Section heading="The board">
        <Prose>
          Guess any country and the board scores it against the answer, column by column: green where that column
          matches the answer, red where it doesn't. Six columns a day. Continent and name length are always among them;
          the other four are drawn from population, land area, land borders, HDI, majority religion, government type,
          climate and language, so a day of religion and government plays nothing like a day of numbers.
        </Prose>
        <Prose>
          The numeric columns are bucketed into thirds by rank rather than compared outright, so a green one means
          "same third as the answer" and names the range it covers. Two columns can come out halfway, in amber:
          language, where a language shares a family with one the answer speaks, deepening the closer the relation;
          and climate, below.
        </Prose>
        <Prose>
          Climate lists every zone covering a decent share of a country, so most have one but a big, varied one can
          have four. Green means your guess has exactly the answer's zones; amber means it shares one without
          matching the set; red means it shares none, which rules out every zone your guess had in one go.
        </Prose>
        <Prose>
          Anything a guess pins down for good moves out of the table and into what you know, so the board narrows as
          you go rather than staying full width all game.
        </Prose>
      </Section>
    </>
  );
}

export function HowToPlayPanel() {
  return (
    <>
      {MODE === "alex" ? <AlexRules /> : <WheredleRules />}
      <Section heading="Both modes">
        <List>
          <li>
            The guess box knows alternate names - official long forms, former names, abbreviations, a few endonyms -
            and forgives a typo or two, so "Ivory Coast", "Burma" and "DRC" all find their country.
          </li>
          <li>A new puzzle at your own midnight. A game in progress is kept in this browser until then.</li>
          <li>
            A practice game is always there in this menu - a random country, as many as you like. It counts towards no
            record and no streak, and the day's own game is waiting where you left it.
          </li>
          <li>The two modes keep separate records: different guess limits, different boards.</li>
        </List>
      </Section>
    </>
  );
}
