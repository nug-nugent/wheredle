import { Badge, Button, Card, Container, Group, Stack, Text, Title } from "@mantine/core";
import { ChoicePrompt } from "./game/ChoicePrompt";
import { CountryReveal } from "./game/CountryReveal";
import { MAX_GUESSES } from "./game/engine";
import { GuessInput } from "./game/GuessInput";
import { HintPanel } from "./game/HintPanel";
import { buildWheredleShare } from "./game/share";
import { useGame } from "./game/useGame";
import { ShareScoreButton } from "./share/ShareScoreButton";

export default function App() {
  const { state, guess, chooseHint, newGame, choiceOptions } = useGame();

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Title order={1}>Wheredle</Title>

        <Card withBorder padding="lg" radius="md">
          <Stack gap="md">
            {state.status === "playing" && (
              <HintPanel hints={state.hints} target={state.target} />
            )}

            {state.status === "playing" && choiceOptions && (
              <ChoicePrompt options={choiceOptions} onChoose={chooseHint} />
            )}

            {state.status === "playing" && !choiceOptions && (
              <GuessInput
                onGuess={guess}
                guessedNames={new Set(state.guesses.map((g) => g.country.name))}
              />
            )}

            {state.status !== "playing" && (
              <Stack gap="md">
                <Badge color={state.status === "won" ? "green" : "red"} size="lg" w="fit-content">
                  {state.status === "won" ? "Correct!" : "Out of guesses"}
                </Badge>
                <CountryReveal country={state.target} />
                <ShareScoreButton gameLabel="Wheredle" {...buildWheredleShare(state)} />
              </Stack>
            )}

            {state.guesses.length > 0 && (
              <Stack gap={4}>
                <Text size="xs" c="dimmed">
                  Guesses ({state.guesses.length}/{MAX_GUESSES})
                </Text>
                <Group gap="xs" wrap="wrap">
                  {state.guesses.map((g, i) => (
                    <Badge key={i} color={g.correct ? "green" : "gray"} variant="light">
                      {g.country.name}
                    </Badge>
                  ))}
                </Group>
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
