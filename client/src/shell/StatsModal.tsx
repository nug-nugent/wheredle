import { Modal } from "@mantine/core";
import type { Stats } from "../stats";
import { StatsPanel } from "./StatsPanel";
import { COLORS, FONT_FAMILY } from "../theme";

// A player's record for one mode, on demand rather than in the way. The
// figures used to sit in the game-over panel, which was already carrying an
// outcome badge, the country in full, a share button and a countdown before
// the player reached their own guesses.
//
// The two modes keep separate records — different guess limits, different
// boards, so a combined streak would mean nothing — and the modal says so
// rather than leaving the player to wonder which game they're looking at.
export function StatsModal({
  opened,
  onClose,
  gameLabel,
  stats,
}: {
  opened: boolean;
  onClose: () => void;
  gameLabel: string;
  stats: Stats;
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      radius={0}
      title="Statistics"
      styles={{
        content: { border: `1px solid ${COLORS.border}`, background: COLORS.surface },
        header: { background: COLORS.surface, fontFamily: FONT_FAMILY },
        title: { fontFamily: FONT_FAMILY, fontWeight: 800, fontSize: 16 },
        body: { fontFamily: FONT_FAMILY, paddingBottom: 20 },
      }}
    >
      <div style={{ fontSize: 12, color: COLORS.textDimmed }}>{gameLabel}</div>
      <StatsPanel stats={stats} />
      <div style={{ fontSize: 11, color: COLORS.textDimmed, marginTop: 18 }}>
        Each mode keeps its own record. Practice games count towards neither.
      </div>
    </Modal>
  );
}
