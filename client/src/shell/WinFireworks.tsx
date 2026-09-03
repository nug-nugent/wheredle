import { useEffect, useRef, useState } from "react";
import { COLORS } from "../theme";

// The ceremony for a win, drawn in the same flat vocabulary as everything
// else: the sparks are little squares rather than round glints, so a burst
// reads as the tile grid coming apart rather than as clip art dropped on
// top of the game.
//
// It burns the guess feedback's own traffic light and nothing else — two
// shells of each colour, cycled — so the celebration is made of the same
// three colours the player has been reading all game. The page's ink was
// in here for a while as a fourth, and a black firework just looks like
// something has gone wrong.
const PALETTE = [COLORS.accent, COLORS.correctBg, COLORS.partialSolid];

const SHELL_COUNT = 6;
const SPARKS_PER_SHELL = 34;
// Pixels per second squared. The sparks feel half as heavy as the shell
// that threw them, which is what keeps a burst hanging in the air for a
// moment instead of raining straight down.
const GRAVITY = 1100;
const SPARK_GRAVITY = GRAVITY * 0.55;
// Air resistance, per second. Without it every burst stays a perfect
// expanding ring, which reads as a diagram rather than as an explosion.
const DRAG = 1.7;

type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  angle: number;
  spin: number;
  age: number;
  ttl: number;
  colour: string;
};

type Shell = {
  launchAt: number;
  x: number;
  peakY: number;
  colour: string;
  y: number;
  vy: number;
  state: "waiting" | "rising" | "spent";
};

function makeShells(width: number, height: number): Shell[] {
  return Array.from({ length: SHELL_COUNT }, (_, i) => ({
    // Spread across the middle of the screen with a little jitter, so five
    // launches don't march across it at even spacing.
    x: width * (0.16 + 0.68 * ((i + 0.5) / SHELL_COUNT) + (Math.random() - 0.5) * 0.1),
    peakY: height * (0.14 + Math.random() * 0.26),
    launchAt: i * 320 + Math.random() * 150,
    colour: PALETTE[i % PALETTE.length],
    y: height,
    vy: 0,
    state: "waiting",
  }));
}

function burst(shell: Shell, sparks: Spark[]) {
  for (let i = 0; i < SPARKS_PER_SHELL; i += 1) {
    // Evenly spaced angles with jitter, rather than fully random ones: a
    // random spread clumps, and a clumped burst looks like a mistake.
    const angle = (i / SPARKS_PER_SHELL) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
    const speed = 170 + Math.random() * 215;
    sparks.push({
      x: shell.x,
      y: shell.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3.5 + Math.random() * 4.5,
      angle: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 9,
      age: 0,
      ttl: 0.9 + Math.random() * 0.7,
      colour: shell.colour,
    });
  }
}

// Plays once, then takes itself off the page. It is decoration over a
// result the panel below states in words, so it is hidden from assistive
// tech and never in the way of a pointer.
export function WinFireworks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    // A player who has asked for less motion gets the badge and the
    // reveal, and no sparks at all — there is no quieter version of a
    // firework worth showing.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFinished(true);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const shells = makeShells(width, height);
    const sparks: Spark[] = [];
    let frame = 0;
    let start = 0;
    let previous = 0;

    const draw = (now: number) => {
      if (!start) {
        start = now;
        previous = now;
      }
      // Capped so a tab left in the background doesn't come back to a
      // single frame in which everything has already fallen off screen.
      const dt = Math.min((now - previous) / 1000, 1 / 30);
      previous = now;
      const elapsed = now - start;
      ctx.clearRect(0, 0, width, height);

      for (const shell of shells) {
        if (shell.state === "waiting" && elapsed >= shell.launchAt) {
          shell.state = "rising";
          // Exactly enough to arrive at its own peak with nothing to spare.
          shell.vy = -Math.sqrt(2 * GRAVITY * Math.max(height - shell.peakY, 1));
        }
        if (shell.state !== "rising") continue;
        shell.vy += GRAVITY * dt;
        shell.y += shell.vy * dt;
        if (shell.vy >= 0 || shell.y <= shell.peakY) {
          shell.state = "spent";
          burst(shell, sparks);
          continue;
        }
        ctx.fillStyle = shell.colour;
        for (let t = 0; t < 4; t += 1) {
          ctx.globalAlpha = 1 - t * 0.25;
          ctx.fillRect(shell.x - 2, shell.y + t * 7, 4, 4);
        }
        ctx.globalAlpha = 1;
      }

      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const spark = sparks[i];
        spark.age += dt;
        if (spark.age >= spark.ttl) {
          sparks.splice(i, 1);
          continue;
        }
        spark.vx -= spark.vx * DRAG * dt;
        spark.vy -= spark.vy * DRAG * dt;
        spark.vy += SPARK_GRAVITY * dt;
        spark.x += spark.vx * dt;
        spark.y += spark.vy * dt;
        spark.angle += spark.spin * dt;

        const life = spark.age / spark.ttl;
        ctx.save();
        ctx.globalAlpha = 1 - life * life;
        ctx.translate(spark.x, spark.y);
        ctx.rotate(spark.angle);
        ctx.fillStyle = spark.colour;
        const size = spark.size * (1 - life * 0.4);
        ctx.fillRect(-size / 2, -size / 2, size, size);
        ctx.restore();
      }

      if (sparks.length === 0 && shells.every((shell) => shell.state === "spent")) {
        setFinished(true);
        return;
      }
      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  if (finished) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        // Over the game, under the statistics modal a win invites you to open.
        zIndex: 100,
      }}
    />
  );
}
