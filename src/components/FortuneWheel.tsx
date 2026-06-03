import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const SEGMENTS = [
  { label: "100% SIGNUP BONUS", color: "#c9a84c" },
  { label: "50% SIGNUP BONUS", color: "#1a1a1a" },
  { label: "$5 FREEPLAY", color: "#c9a84c" },
  { label: "TRY AGAIN", color: "#1a1a1a" },
  { label: "75% SIGNUP BONUS", color: "#c9a84c" },
  { label: "$10 FREEPLAY", color: "#1a1a1a" },
];

interface FortuneWheelProps {
  isSignedIn: boolean;
  isVerified: boolean;
  canSpin: boolean;
  spinReady: boolean;
  countdownSeconds: number | null;
  onRequestLogin: () => void;
  onRequestVerificationCheck: () => void;
  onResendVerification?: () => void;
  verificationInfo?: string | null;
  verificationError?: string | null;
  onSpinComplete: (result: string) => void;
}

function formatCountdown(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

export function FortuneWheel({
  isSignedIn,
  isVerified,
  canSpin,
  spinReady,
  countdownSeconds,
  onRequestLogin,
  onRequestVerificationCheck,
  onResendVerification,
  verificationInfo,
  verificationError,
  onSpinComplete,
}: FortuneWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [winPopupOpen, setWinPopupOpen] = useState(false);

  const spin = () => {
    if (!isSignedIn) {
      onRequestLogin();
      return;
    }
    if (!isVerified) return;
    if (!canSpin) return;
    if (spinning) return;

    setSpinning(true);
    setResult(null);

    const winner = Math.floor(Math.random() * SEGMENTS.length);
    const segmentAngle = 360 / SEGMENTS.length;
    const target = 360 * 6 + (360 - winner * segmentAngle - segmentAngle / 2);
    const finalRotation = rotation + target - (rotation % 360);

    setRotation(finalRotation);
    setTimeout(() => {
      setSpinning(false);
      const selected = SEGMENTS[winner].label;
      setResult(selected);
      if (selected !== "TRY AGAIN") {
        setWinPopupOpen(true);
        onSpinComplete(selected);
      }
    }, 5200);
  };

  const segmentAngle = 360 / SEGMENTS.length;
  const radius = 200;
  const cx = 220;
  const cy = 220;

  const polarToCartesian = (angle: number, r: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center">
      <div className="relative mx-auto flex aspect-square w-full max-w-[320px] sm:max-w-[420px] items-center justify-center">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 z-20">
          <div className="w-0 h-0 border-l-[18px] border-r-[18px] border-t-[32px] border-l-transparent border-r-transparent border-t-primary drop-shadow-[0_0_10px_oklch(0.82_0.13_85)]" />
        </div>

        <div
          className="mx-auto w-full overflow-hidden rounded-full border-[10px] border-primary shadow-gold"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
          }}
        >
          <div className="aspect-square w-full">
            <svg className="h-full w-full" viewBox="0 0 440 440" preserveAspectRatio="xMidYMid meet">
              {SEGMENTS.map((seg, i) => {
                const startAngle = i * segmentAngle;
                const endAngle = startAngle + segmentAngle;
                const start = polarToCartesian(startAngle, radius);
                const end = polarToCartesian(endAngle, radius);
                const largeArc = segmentAngle > 180 ? 1 : 0;
                const path = `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
                const midAngle = startAngle + segmentAngle / 2;
                const textPos = polarToCartesian(midAngle, radius * 0.65);

                return (
                  <g key={i}>
                    <path d={path} fill={seg.color} stroke="#c9a84c" strokeWidth="2" />
                    <text
                      x={textPos.x}
                      y={textPos.y}
                      fill={seg.color === "#c9a84c" ? "#1a1a1a" : "#f0d78c"}
                      fontSize="14"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${midAngle}, ${textPos.x}, ${textPos.y})`}
                      style={{ fontFamily: "Cinzel, serif" }}
                    >
                      {seg.label.split(" ").map((word, idx) => (
                        <tspan key={idx} x={textPos.x} dy={idx === 0 ? "-0.5em" : "1.1em"}>
                          {word}
                        </tspan>
                      ))}
                    </text>
                  </g>
                );
              })}
              <circle cx={cx} cy={cy} r="28" fill="url(#goldGrad)" stroke="#1a1a1a" strokeWidth="3" />
              <defs>
                <radialGradient id="goldGrad">
                  <stop offset="0%" stopColor="#f0d78c" />
                  <stop offset="100%" stopColor="#8b7320" />
                </radialGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center justify-center gap-4 text-center">
        <button
          onClick={spin}
          disabled={spinning || (isSignedIn && !isVerified) || !canSpin}
          className="px-12 py-4 rounded-full bg-gold-gradient text-primary-foreground font-bold text-lg uppercase tracking-[0.2em] shadow-gold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
        {spinning
          ? "Spinning..."
          : !isSignedIn
          ? "Login to Spin"
          : !isVerified
          ? "Verify Email to Spin"
          : !canSpin
          ? "Spin Limit Reached"
          : "Spin the Wheel"}
      </button>

        {isSignedIn && isVerified && countdownSeconds !== null && countdownSeconds > 0 && (
          <div className="rounded-3xl border border-gold/20 bg-background/80 px-5 py-4 text-sm text-primary-foreground shadow-[0_0_20px_rgba(201,168,76,0.1)]">
            <p className="font-semibold uppercase tracking-[0.18em] text-muted-foreground">Next spin available in</p>
            <p className="mt-2 text-3xl font-display font-bold text-gold-gradient">{formatCountdown(countdownSeconds)}</p>
          </div>
        )}

        {isSignedIn && isVerified && spinReady && (
          <p className="mt-3 text-sm text-emerald-300">Your spin is ready! Tap the wheel to play again.</p>
        )}

        {!isSignedIn && !spinning && (
          <p className="mt-3 text-sm text-muted-foreground">You must sign in before spinning the wheel.</p>
        )}
      {isSignedIn && !isVerified && !spinning && (
        <div className="flex flex-col items-center gap-3 mt-3 text-sm text-muted-foreground">
          <p>Please verify your email before using the site.</p>
          {verificationInfo && <p className="text-sm text-primary">{verificationInfo}</p>}
          {verificationError && <p className="text-sm text-destructive">{verificationError}</p>}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onRequestVerificationCheck}
              className="rounded-full px-5 py-2 bg-primary text-primary-foreground font-semibold transition hover:bg-primary/90"
            >
              Check Verification Status
            </button>
            {onResendVerification ? (
              <button
                type="button"
                onClick={onResendVerification}
                className="rounded-full px-5 py-2 bg-secondary text-secondary-foreground font-semibold transition hover:bg-secondary/90"
              >
                Resend Verification Email
              </button>
            ) : null}
          </div>
        </div>
      )}
      {isSignedIn && isVerified && !canSpin && !spinning && (
        <p className="mt-3 text-sm text-muted-foreground">You only get one spin unless you hit TRY AGAIN.</p>
      )}

      {result && (
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">You won</p>
          <p className="mt-2 text-3xl font-display font-bold text-gold-gradient">{result}</p>
          <p className="mt-2 text-sm text-muted-foreground">Contact an agent to claim your prize 🎉</p>
        </div>
      )}
      </div>

      <Dialog open={winPopupOpen} onOpenChange={setWinPopupOpen}>
        <DialogContent className="sm:max-w-xl border-gold bg-card">
          <DialogHeader className="text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Big Win</p>
            <DialogTitle className="text-4xl font-display text-gold-gradient">Congratulations!</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              You landed a winning prize on the Fortune Wheel.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 rounded-3xl border border-gold/40 bg-background/80 p-8 text-center shadow-[0_0_30px_rgba(201,168,76,0.16)]">
            <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground">Prize</p>
            <p className="mt-4 text-5xl font-display font-bold text-gold-gradient">{result}</p>
            <p className="mt-4 text-sm text-muted-foreground max-w-md mx-auto">
              Your prize is reserved. Contact an agent to claim it and keep your lucky streak alive.
            </p>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setWinPopupOpen(false)}
              className="rounded-full bg-gold-gradient px-8 py-3 text-sm font-bold uppercase tracking-[0.2em] text-primary-foreground shadow-gold transition hover:scale-[1.02]"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
