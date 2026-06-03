import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { applyActionCode, onAuthStateChanged, reload, signOut, sendEmailVerification } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import heroImg from "@/assets/hero.jpg";
import juwaImg from "@/assets/game-juwa.jpg";
import milkywayImg from "@/assets/game-milkyway.jpg";
import gamevaultImg from "@/assets/game-gamevault.jpg";
import cashmachineImg from "@/assets/game-cashmachine.jpg";
import orionstarsImg from "@/assets/game-orionstars.jpg";
import pandamasterImg from "@/assets/game-pandamaster.jpg";
import cashappLogo from "@/assets/pay-cashapp.png";
import chimeLogo from "@/assets/pay-chime.png";
import paypalLogo from "@/assets/pay-paypal.png";
import { generateTopWinners, Wheeler } from "@/lib/daily-wheelers";
import { GameCard } from "@/components/GameCard";
import { FortuneWheel } from "@/components/FortuneWheel";
import { LoginDialog } from "@/components/LoginDialog";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dravona Gold — Wanna Get Lucky?" },
      { name: "description", content: "Spin the Dravona Gold fortune wheel for signup bonuses and freeplay. Play Juwa, Milky Way, GameVault, Cash Machine, Orion Stars & Panda Master." },
      { property: "og:title", content: "Dravona Gold — Wanna Get Lucky?" },
      { property: "og:description", content: "Spin the fortune wheel for bonuses and play the hottest sweepstakes games." },
    ],
  }),
  component: Index,
});

const GAMES = [
  {
    name: "Juwa",
    playerUrl: "https://dl.juwa777.com/",
    adminUrl: "https://ht.juwa777.com/",
    image: juwaImg,
  },
  {
    name: "Milky Way",
    playerUrl: "https://milkywayapp.xyz/",
    adminUrl: "https://milkywayapp.xyz/",
    image: milkywayImg,
  },
  {
    name: "GameVault",
    playerUrl: "https://download.gamevault999.com/",
    adminUrl: "https://agent.gamevault999.com/",
    image: gamevaultImg,
  },
  {
    name: "Cash Machine",
    playerUrl: "http://www.cashmachine777.com/",
    adminUrl: "http://agentserver.cashmachine777.com:8003/admin/login",
    image: cashmachineImg,
  },
  {
    name: "Orion Stars",
    playerUrl: "http://orionstars.vip:8580/index.html",
    adminUrl: "https://orionstars.vip:8781/",
    image: orionstarsImg,
  },
  {
    name: "Panda Master",
    playerUrl: "https://pandamaster.vip:8888/index.html",
    adminUrl: "https://pandamaster.vip/default.aspx?637813679673319920",
    image: pandamasterImg,
  },
];

const PAYMENT_OPTIONS = [
  {
    name: "Cash App",
    logo: cashappLogo,
    qr: "/qr/cashapp.jpg",
    url: "https://cash.app/$DravonaGold",
    description: "Scan this QR code to send payment via Cash App.",
  },
  {
    name: "Chime",
    logo: chimeLogo,
    qr: "/qr/chime.png",
    url: "https://chime.com/",
    description: "Scan this QR code to send payment via Chime.",
  },
  {
    name: "PayPal",
    logo: paypalLogo,
    qr: "/qr/paypal.png",
    url: "https://paypal.me/DravonaGold",
    description: "Scan this QR code to send payment via PayPal.",
  },
];

export function Index() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [userDisplay, setUserDisplay] = useState<string | null>(null);
  const [hasSpun, setHasSpun] = useState(false);
  const [lastSpinAt, setLastSpinAt] = useState<Date | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [spinReady, setSpinReady] = useState(false);
  const [topWinners, setTopWinners] = useState<Wheeler[]>([]);
  const [topWinnersLoading, setTopWinnersLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<typeof PAYMENT_OPTIONS[number] | null>(null);
  const [verificationInfo, setVerificationInfo] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationRedirectInfo, setVerificationRedirectInfo] = useState<string | null>(null);
  const [verificationRedirectError, setVerificationRedirectError] = useState<string | null>(null);

  const actionCodeSettings = {
    url: "https://dravonagold.com/login",
    handleCodeInApp: false,
  };

  const loadUserSpinState = async (uid: string) => {
    const spinDoc = doc(db, "wheelSpins", uid);
    const snapshot = await getDoc(spinDoc);
    if (!snapshot.exists()) {
      setHasSpun(false);
      setLastSpinAt(null);
      setCountdownSeconds(null);
      setSpinReady(false);
      return;
    }

    const data = snapshot.data();
    const rawTimestamp = data?.lastSpinAt ?? data?.createdAt;
    let spinDate: Date | null = null;

    if (rawTimestamp instanceof Timestamp) {
      spinDate = rawTimestamp.toDate();
    } else if (rawTimestamp instanceof Date) {
      spinDate = rawTimestamp;
    } else if (typeof rawTimestamp === "string") {
      const parsed = new Date(rawTimestamp);
      if (!Number.isNaN(parsed.getTime())) {
        spinDate = parsed;
      }
    }

    if (!spinDate) {
      setHasSpun(false);
      setLastSpinAt(null);
      setCountdownSeconds(null);
      setSpinReady(false);
      return;
    }

    const expiry = spinDate.getTime() + 24 * 60 * 60 * 1000;
    const remainingMs = expiry - Date.now();
    if (remainingMs <= 0) {
      setHasSpun(false);
      setLastSpinAt(spinDate);
      setCountdownSeconds(null);
      setSpinReady(true);
    } else {
      setHasSpun(true);
      setLastSpinAt(spinDate);
      setCountdownSeconds(Math.ceil(remainingMs / 1000));
      setSpinReady(false);
    }
  };

  useEffect(() => {
    const loadTopWinners = async () => {
      setTopWinnersLoading(true);
      try {
        const topWinnersDoc = doc(db, "siteStats", "topWinners");
        const snapshot = await getDoc(topWinnersDoc);
        const now = Timestamp.now();

        if (snapshot.exists()) {
          const data = snapshot.data();
          const expiresAt = data?.expiresAt;
          const winners = data?.winners as Array<{ name: string; amount: number }> | undefined;

          if (
            expiresAt instanceof Timestamp &&
            expiresAt.toMillis() > now.toMillis() &&
            Array.isArray(winners) &&
            winners.length === 3 &&
            winners.every((winner) => typeof winner.name === "string" && typeof winner.amount === "number")
          ) {
            const sortedWinners = [...winners]
              .sort((a, b) => b.amount - a.amount)
              .map((winner, index) => ({ rank: index + 1, ...winner }));
            setTopWinners(sortedWinners);
            setTopWinnersLoading(false);
            return;
          }
        }

        const generatedWinners = generateTopWinners();
        const expiresAt = Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000));

        await setDoc(topWinnersDoc, {
          winners: generatedWinners.map(({ name, amount }) => ({ name, amount })),
          generatedAt: serverTimestamp(),
          expiresAt,
        });

        setTopWinners(generatedWinners);
      } catch (error) {
        console.error("Unable to load top winners:", error);
        const fallbackWinners = generateTopWinners();
        setTopWinners(fallbackWinners);
      } finally {
        setTopWinnersLoading(false);
      }
    };

    loadTopWinners();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsSignedIn(!!user);
      setIsVerified(!!user && user.emailVerified);
      setUserDisplay(user ? user.displayName || user.email || null : null);
      setVerificationInfo(null);
      setVerificationError(null);
      setHasSpun(false);
      setLastSpinAt(null);
      setCountdownSeconds(null);
      setSpinReady(false);
      if (user) {
        await loadUserSpinState(user.uid);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!lastSpinAt) {
      return;
    }

    const expiry = lastSpinAt.getTime() + 24 * 60 * 60 * 1000;

    const updateCountdown = () => {
      const remainingMs = expiry - Date.now();
      if (remainingMs <= 0) {
        setCountdownSeconds(null);
        setHasSpun(false);
        setSpinReady(true);
        setLastSpinAt(null);
        return;
      }

      setCountdownSeconds(Math.ceil(remainingMs / 1000));
      setSpinReady(false);
    };

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [lastSpinAt]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const oobCode = params.get("oobCode");

    if (mode !== "verifyEmail" || !oobCode) return;

    const verifyEmail = async () => {
      setVerificationRedirectInfo(null);
      setVerificationRedirectError(null);

      try {
        await applyActionCode(auth, oobCode);

        const user = auth.currentUser;
        if (user) {
          await reload(user);
          const verified = user.emailVerified;
          setIsVerified(verified);
          setVerificationRedirectInfo("Email verified successfully. Please log in to continue.");
          setLoginOpen(!verified);
        } else {
          setVerificationRedirectInfo("Email verified successfully. Please log in to continue.");
          setLoginOpen(true);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to verify email. Please try again.";
        setVerificationRedirectError(message);
        setLoginOpen(true);
      } finally {
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState(null, "", cleanUrl);
      }
    };

    verifyEmail();
  }, []);

  const refreshVerification = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await reload(user);
      setIsVerified(user.emailVerified);
      if (user.emailVerified) {
        setVerificationInfo("Your email is verified. You can now use the site.");
        setVerificationError(null);
        await loadUserSpinState(user.uid);
      }
    } catch (error) {
      console.error("Failed to refresh verification status:", error);
      setVerificationError("Unable to verify your email status. Please try again.");
    }
  };

  const handleSignIn = () => {
    setIsSignedIn(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsSignedIn(false);
      setIsVerified(false);
      setUserDisplay(null);
      setHasSpun(false);
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  const handlePaymentSelect = (payment: typeof PAYMENT_OPTIONS[number]) => {
    setSelectedPayment(payment);
    setPaymentModalOpen(true);
  };

  const handleResendVerification = async () => {
    const user = auth.currentUser;
    if (!user) {
      setVerificationError("Please sign in to resend your verification email.");
      setVerificationInfo(null);
      return;
    }

    setVerificationError(null);
    setVerificationInfo(null);

    try {
      await sendEmailVerification(user, actionCodeSettings);
      setVerificationInfo("A new verification email has been sent. Please check your inbox and spam folder.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to resend verification email. Please try again.";
      setVerificationError(message);
    }
  };

  const handleHeroSpinClick = () => {
    if (!isSignedIn) {
      setLoginOpen(true);
      return;
    }

    if (!isVerified) {
      refreshVerification();
      return;
    }

    document.getElementById("wheel")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSpinComplete = async (result: string) => {
    if (!auth.currentUser || result === "TRY AGAIN") return;

    try {
      const spinDoc = doc(db, "wheelSpins", auth.currentUser.uid);
      const now = new Date();
      await setDoc(spinDoc, {
        uid: auth.currentUser.uid,
        result,
        lastSpinAt: serverTimestamp(),
      });
      setHasSpun(true);
      setLastSpinAt(now);
      setCountdownSeconds(24 * 60 * 60);
      setSpinReady(false);
    } catch (error) {
      console.error("Failed to save spin state:", error);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-gold backdrop-blur-md bg-background/70">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-display font-bold text-gold-gradient tracking-wider">
            🌹 Dravona Gold
          </a>
          <nav className="hidden md:flex gap-8 text-sm uppercase tracking-wider text-muted-foreground">
            <a href="#wheel" className="hover:text-primary transition-colors">Fortune Wheel</a>
            <a href="#winners" className="hover:text-primary transition-colors">Winners</a>
            <a href="#games" className="hover:text-primary transition-colors">Games</a>
          </nav>
          <div className="flex items-center gap-4 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <span>{isSignedIn ? `Hi, ${userDisplay?.split("@")[0] ?? "Player"}` : "Guest"}</span>
            {isSignedIn && (
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold uppercase tracking-[0.2em] hover:bg-destructive/90 transition"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="" className="w-full h-full object-cover opacity-40" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-32 min-h-[70vh] md:min-h-[80vh]">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-primary mb-4">★ Premium Sweepstakes ★</p>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="text-gold-gradient">Wanna Get Lucky?</span>
            </h1>
            <p className="mt-6 text-xl md:text-2xl font-display text-foreground/90">
              Spin Our <span className="text-gold-gradient font-bold">Fortune Wheel</span>
            </p>
            <p className="mt-4 text-base text-muted-foreground max-w-lg">
              {isSignedIn
                ? !isVerified
                  ? "Please verify your email before using the site."
                  : "You have one spin available — good luck!"
                : "Score signup bonuses up to 100% and free play credits — then jump straight into your favorite games."}
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              <button onClick={handleHeroSpinClick} className="w-full sm:w-auto px-8 py-3 rounded-full bg-gold-gradient text-primary-foreground font-bold uppercase tracking-wider shadow-gold hover:scale-105 transition-transform">
                {!isSignedIn ? "Login to Spin" : !isVerified ? "Verify Email" : "Spin the Wheel"}
              </button>
              <a href="#games" className="w-full sm:w-auto px-8 py-3 rounded-full border-gold text-primary font-bold uppercase tracking-wider hover:bg-primary/10 transition-colors text-center">
                Browse Games
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Fortune Wheel */}
      <section id="wheel" className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Daily Spin</p>
          <h2 className="mt-2 text-4xl md:text-5xl text-gold-gradient">Try Your Luck</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            One spin = one shot at signup bonuses up to 100%, free play credits, and more.
          </p>
        </div>
        <FortuneWheel
          isSignedIn={isSignedIn}
          isVerified={isVerified}
          canSpin={!hasSpun}
          onRequestLogin={() => setLoginOpen(true)}
          onRequestVerificationCheck={refreshVerification}
          onResendVerification={handleResendVerification}
          verificationInfo={verificationInfo}
          verificationError={verificationError}
          countdownSeconds={countdownSeconds}
          spinReady={spinReady}
          onSpinComplete={handleSpinComplete}
        />
      </section>

      {/* Wheelers */}
      <section id="winners" className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Hall of Fame</p>
          <h2 className="mt-2 text-3xl md:text-4xl text-gold-gradient">Yesterday's Top 3 Winners</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {topWinnersLoading ? (
            <div className="col-span-3 rounded-2xl border-gold bg-card p-8 text-center text-muted-foreground">Loading top winners...</div>
          ) : (
            topWinners.map((w) => (
              <div
                key={w.rank}
                className="relative rounded-2xl border-gold bg-card p-6 flex items-center gap-4 hover:shadow-gold transition-shadow"
              >
                <div className="text-5xl font-display font-bold text-gold-gradient w-12 text-center">
                  {w.rank}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lg">{w.name}</p>
                  <p className="text-2xl font-bold text-primary">${w.amount.toFixed(0)}</p>
                </div>
                {w.rank === 1 && <div className="absolute -top-3 -right-3 text-3xl">👑</div>}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Games */}
      <section id="games" className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Game Library</p>
          <h2 className="mt-2 text-4xl md:text-5xl text-gold-gradient">Play Your Favorites</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {GAMES.map((g) => (
            <GameCard key={g.name} {...g} />
          ))}
        </div>
      </section>

      <footer className="border-t border-gold mt-16 py-10">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Accepted Payments</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {PAYMENT_OPTIONS.map((payment) => (
              <button
                key={payment.name}
                type="button"
                onClick={() => handlePaymentSelect(payment)}
                aria-label={`Open ${payment.name} QR modal`}
                className="flex items-center justify-center h-14 w-28 rounded-2xl border-gold bg-white px-4 hover:shadow-gold hover:-translate-y-0.5 transition-all"
              >
                <img src={payment.logo} alt={`${payment.name} logo`} loading="lazy" width={512} height={512} className="max-h-9 w-auto object-contain" />
              </button>
            ))}
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            © {new Date().getFullYear()} Dravona Gold. All rights reserved. Play responsibly. 18+
          </p>
        </div>
      </footer>

      <Dialog open={paymentModalOpen} onOpenChange={(open) => {
        setPaymentModalOpen(open);
        if (!open) {
          setSelectedPayment(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedPayment ? `${selectedPayment.name} QR Code` : "Payment QR Code"}</DialogTitle>
            <DialogDescription>
              {selectedPayment ? selectedPayment.description : "Select a payment option to view its QR code."}
            </DialogDescription>
          </DialogHeader>

          {selectedPayment ? (
            <div className="mt-6 flex flex-col items-center gap-4">
              <img
                src={selectedPayment.qr}
                alt={`${selectedPayment.name} QR code`}
                className="h-72 w-72 max-w-full rounded-3xl border border-muted-foreground/20 bg-white object-contain"
              />
              <a
                href={selectedPayment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-full bg-gold-gradient px-5 py-2 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-gold hover:scale-[1.01] transition-transform"
              >
                Open {selectedPayment.name}
              </a>
            </div>
          ) : null}

          <DialogFooter className="mt-6">
            <DialogClose className="inline-flex rounded-full border border-gold px-4 py-2 text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground hover:bg-muted/10 transition">
              Close
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSignIn={handleSignIn}
        initialInfo={verificationRedirectInfo}
        initialError={verificationRedirectError}
      />
    </div>
  );
}
