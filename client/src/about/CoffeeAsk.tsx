import { ExternalLink, Prose, Section } from "./InfoModal";

const KOFI_URL = "https://ko-fi.com/davidhuggett";

// The one ask in the whole product, and it sits at the bottom of two panels
// a player has to go looking for rather than anywhere near the game. Asked
// once, quietly, where somebody already enjoying the thing will find it.
export function CoffeeAsk() {
  return (
    <Section heading="Buy me a coffee">
      <Prose>
        Wheredle is free, has no ads and asks for no account. If the daily puzzle is worth a coffee to you, please follow the link: it's appreciated, and it changes nothing about the game either way.
      </Prose>
      <ExternalLink href={KOFI_URL} as="button">
        Buy me a coffee
      </ExternalLink>
    </Section>
  );
}
