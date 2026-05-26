import { FormEvent, useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { auth } from "@/lib/firebase";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignIn?: () => void;
}

export function LoginDialog({ open, onOpenChange, onSignIn }: LoginDialogProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        onSignIn?.();
        onOpenChange(false);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential.user) {
          await sendEmailVerification(userCredential.user);
          setInfo("A verification email has been sent. Please verify your email before spinning the wheel.");
        }
      }
    } catch (authError: unknown) {
      const message = authError instanceof Error ? authError.message : "Unable to authenticate.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-gold bg-card">
        <DialogHeader className="text-center items-center">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">🌹 Dravon Gold</p>
          <DialogTitle className="text-3xl font-display text-gold-gradient">
            {mode === "login" ? "Welcome Back, High Roller" : "Join the Table"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {mode === "login"
              ? "Sign in to spin the wheel and claim your bonuses."
              : "Create an account and start your lucky streak tonight."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4 pt-2" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-primary font-bold">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              required
              placeholder="hello@dravongold.com"
              className="w-full px-4 py-3 rounded-xl bg-background border-gold text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-primary font-bold">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-background border-gold text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              disabled={loading}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {info && <p className="text-sm text-primary">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 rounded-full bg-gold-gradient text-primary-foreground font-bold uppercase tracking-wider shadow-gold hover:scale-[1.02] transition-transform disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (mode === "login" ? "Signing in..." : "Creating account...") : mode === "login" ? "Sign In & Spin" : "Create Account"}
          </button>
        </form>

        <div className="text-center text-sm text-muted-foreground pt-2 border-t border-gold/30">
          {mode === "login" ? (
            <>
              New here?{" "}
              <button
                onClick={() => setMode("signup")}
                className="text-gold-gradient font-bold uppercase tracking-wider hover:underline"
              >
                Sign Up Now →
              </button>
            </>
          ) : (
            <>
              Already a wheeler?{" "}
              <button
                onClick={() => setMode("login")}
                className="text-gold-gradient font-bold uppercase tracking-wider hover:underline"
              >
                ← Sign In
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
