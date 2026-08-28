import { MODE_LABEL, MODE_URL, OTHER_MODE } from "../mode";
import { CoffeeAsk } from "./CoffeeAsk";
import { ExternalLink, Prose, Section } from "./InfoModal";

const REPO_URL = "https://github.com/nug-nugent/wheredle";

// What the game is, where its facts come from and how to complain about
// them. The credits are the part that isn't optional: the dataset is other
// people's work, stitched together.
export function AboutPanel() {
  return (
    <>
      <Prose>
        Wheredle is a daily country-guessing game. One country a day, the same one for every player, narrowed down
        until you name it or run out of guesses.
      </Prose>
      <Prose>
        There are no accounts and no ads - your games and your record live in this
        browser and go nowhere else, which means that a new phone starts a fresh streak.
      </Prose>
      <Section heading="Two ways to play">
        <Prose>
          The main game feeds you clues - a letter, a crop of the flag, its outline - and asks you to get there in
          seven. Alex mode gives you nothing up front and scores each guess against the answer across a board of six
          categories, in six. Same country dataset, different day's answer, separate records.
        </Prose>
        <Prose>
          <a href={MODE_URL[OTHER_MODE]}>Go to {MODE_LABEL[OTHER_MODE]}</a>.
        </Prose>
      </Section>
      <Section heading="Where the facts come from">
        <Prose>
          Names, continents, languages, borders and currencies come from{" "}
          <ExternalLink href="https://github.com/mledoze/countries">mledoze/countries</ExternalLink>; population,
          majority religion and government type from{" "}
          <ExternalLink href="https://github.com/samayo/country-json">samayo/country-json</ExternalLink>; the flags
          from <ExternalLink href="https://github.com/hjnilsson/country-flags">hjnilsson/country-flags</ExternalLink>.
          Climate zones are worked out here, by crossing a{" "}
          <ExternalLink href="https://koeppen-geiger.vu-wien.ac.at/">Köppen-Geiger climate grid</ExternalLink>{" "}
          (Kottek et al. 2006; Rubel & Kottek 2010) with country outlines from{" "}
          <ExternalLink href="https://www.naturalearthdata.com/">Natural Earth</ExternalLink>.
          Human Development Index figures are hand-curated from the UNDP's{" "}
          <ExternalLink href="https://hdr.undp.org/">2025 Human Development Report</ExternalLink>, since no maintained
          machine-readable source for them exists.
        </Prose>
        <Prose>
          Which is to say a country's facts are only as current as those datasets are, and a few of the fuzzier ones -
          a majority religion, a government type - are a single word standing in for something far messier.
        </Prose>
      </Section>
      <Section heading="Something wrong?">
        <Prose>
          Bad data, a country the guess box won't accept, or anything plainly broken:{" "}
          <ExternalLink href={`${REPO_URL}/issues`}>open an issue on GitHub</ExternalLink>. The{" "}
          <ExternalLink href={REPO_URL}>source is there</ExternalLink> too.
        </Prose>
      </Section>
      <CoffeeAsk />
    </>
  );
}
