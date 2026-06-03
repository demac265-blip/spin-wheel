import { FormEvent, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { auth } from "@/lib/firebase";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignIn?: () => void;
  initialInfo?: string | null;
  initialError?: string | null;
}

export function LoginDialog({ open, onOpenChange, onSignIn, initialInfo = null, initialError = null }: LoginDialogProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const actionCodeSettings = {
    url: "https://dravonagold.com/login",
    handleCodeInApp: false,
  };

  useEffect(() => {
    if (initialInfo) {
      setInfo(initialInfo);
      setError(null);
    }

    if (initialError) {
      setError(initialError);
      setInfo(null);
    }
  }, [initialInfo, initialError]);

  const getFriendlyAuthMessage = (authError: unknown, fallback: string) => {
    if (
      typeof authError === "object" &&
      authError !== null &&
      "code" in authError &&
      typeof (authError as any).code === "string"
    ) {
      switch ((authError as any).code) {
        case "auth/user-not-found":
          return "No account found for that email address.";
        case "auth/wrong-password":
          return "Incorrect password. Please try again.";
        case "auth/invalid-email":
          return "Please enter a valid email address.";
        case "auth/email-already-in-use":
          return "This email is already in use. Please use a different email or sign in.";
        case "auth/too-many-requests":
          return "Too many attempts. Please wait a moment and try again.";
        case "auth/network-request-failed":
          return "Network error. Please check your connection and try again.";
        case "auth/user-disabled":
          return "This account has been disabled. Contact support for help.";
        default:
          return authError instanceof Error ? authError.message : fallback;
      }
    }

    if (authError instanceof Error && authError.message) {
      return authError.message;
    }

    return fallback;
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      setInfo(null);
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setInfo("Password reset email sent. Please check your inbox and spam folder.");
    } catch (authError: unknown) {
      const message = getFriendlyAuthMessage(
        authError,
        "Unable to reset password. Please check your email address and try again."
      );
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const user = auth.currentUser;

    if (!user) {
      setError("Please log in first to resend your verification email.");
      setInfo(null);
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      await sendEmailVerification(user, actionCodeSettings);
      setInfo("Verification email sent. Please check your inbox and spam folder.");
    } catch (authError: unknown) {
      const message = getFriendlyAuthMessage(
        authError,
        "Unable to resend verification email. Please try again later."
      );
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      if (mode === "login") {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        if (userCredential.user.emailVerified) {
          onSignIn?.();
          onOpenChange(false);
        } else {
          setError("Please verify your email before using the site.");
          setInfo(null);
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential.user) {
          await sendEmailVerification(userCredential.user, actionCodeSettings);
          setError(null);
          setInfo("Verification email sent. Please check your inbox and spam folder.");
        }
      }
    } catch (authError: unknown) {
      const message = getFriendlyAuthMessage(
        authError,
        mode === "login"
          ? "Unable to sign in. Please check your email and password and try again."
          : "Unable to create account. Please check your information and try again."
      );
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialInfo) {
      setInfo(initialInfo);
      setError(null);
    }

    if (initialError) {
      setError(initialError);
      setInfo(null);
    }
  }, [initialInfo, initialError]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-gold bg-card">
        <DialogHeader className="text-center items-center">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">🌹 Dravona Gold</p>
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
              placeholder="hello@dravonagold.com"
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

          {mode === "login" ? (
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={loading}
                className="text-xs uppercase tracking-[0.2em] text-gold-gradient font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                Forgot password?
              </button>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={loading}
                className="text-xs uppercase tracking-[0.2em] text-gold-gradient font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                Resend verification email
              </button>
            </div>
          ) : null}
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
