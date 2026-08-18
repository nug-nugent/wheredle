import { Badge, Button, Card, Container, Stack, Text, Title } from "@mantine/core";
import { CountryReveal } from "../game/CountryReveal";
import { GuessInput } from "../game/GuessInput";
import { ShareScoreButton } from "../share/ShareScoreButton";
import { getConfirmedFacts } from "./categories";
import { ConfirmedFacts } from "./ConfirmedFacts";
import { GuessTable } from "./GuessTable";
import { LastGuess } from "./LastGuess";
import { buildAlexShare } from "./share";
import { useAlexGame } from "./useAlexGame";

export default function AlexApp() {
  const { state, pendingGuess, lastGuess, guess, commitGuess, newGame } = useAlexGame();
  const displayedGuess = pendingGuess ?? lastGuess;

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>Wheredle — Alex Mode</Title>
          <Text c="dimmed" size="sm">
            No clues up front. Guess a country and see how close you got.
          </Text>
        </div>

        <Card withBorder padding="lg" radius="md">
          <Stack gap="md">
            {state.status === "playing" && !pendingGuess && (
              <GuessInput
                onGuess={guess}
                guessedNames={new Set(state.guesses.map((g) => g.country.name))}
              />
            )}

            {state.status === "won" && (
              <Stack gap="md">
                <Badge color="green" size="lg" w="fit-content">
                  Correct!
                </Badge>
                <CountryReveal country={state.target} />
                <ShareScoreButton gameLabel="Wheredle: Alex Mode" {...buildAlexShare(state)} />
              </Stack>
            )}

            {state.guesses.length > 0 && (
              <ConfirmedFacts facts={getConfirmedFacts(state.guesses)} />
            )}

            {displayedGuess && (
              <LastGuess
                feedback={displayedGuess}
                revealing={displayedGuess === pendingGuess}
                onRevealComplete={() => commitGuess(displayedGuess)}
              />
            )}

            {state.guesses.length > 0 && (
              <Stack gap={4}>
                <Text size="xs" c="dimmed">
                  Guesses ({state.guesses.length})
                </Text>
                <GuessTable guesses={state.guesses} />
              </Stack>
            )}

            <Button onClick={newGame} w="fit-content" variant="subtle">
              New game
            </Button>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
