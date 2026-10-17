import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, User, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { LensMark } from '@/components/brand/LensMark';

const HERO_IMAGE = "https://images.unsplash.com/photo-1649230955954-108845001397?q=80&w=2400&auto=format&fit=crop";
const EASE = [0.16, 1, 0.3, 1] as const;

export function LoginPage() {
  const { signIn, signInEmail, signUpEmail, loading, user } = useAuthStore();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    try {
      await signIn();
      toast.success('Signed in successfully');
    } catch (error: any) {
      console.error(error);
      const msg = error.message || '';
      if (msg.includes('auth/operation-not-allowed')) {
        toast.error('Google Sign-in is not enabled in Firebase Console.');
      } else {
        toast.error(error.message || 'Failed to sign in');
      }
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signInEmail(email, password);
      toast.success('Welcome back');
    } catch (error: any) {
      const msg = error.message || '';
      if (msg.includes('auth/operation-not-allowed')) {
        toast.error(
          <div className="flex flex-col gap-1">
            <span className="font-bold">Email/Password Not Enabled</span>
            <span className="text-xs">You must enable Email/Password auth in the Firebase Console under Authentication &gt; Sign-in method.</span>
          </div>
        );
      } else {
        toast.error(error.message || 'Invalid email or password');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    setIsSubmitting(true);
    try {
      await signUpEmail(email, password, name);
      // A fresh account gets the guided welcome journey; returning users
      // (handled in handleEmailLogin above) go straight to their dashboard.
      navigate('/welcome');
    } catch (error: any) {
      const msg = error.message || '';
      if (msg.includes('auth/operation-not-allowed')) {
        toast.error(
          <div className="flex flex-col gap-1">
            <span className="font-bold">Email/Password Not Enabled</span>
            <span className="text-xs">You must enable Email/Password auth in the Firebase Console.</span>
          </div>
        );
      } else {
        toast.error(error.message || 'Failed to create account');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-neutral-950">
      {/* Immersive photography — warm, architectural, more than half the screen on desktop */}
      <div className="hidden lg:block lg:w-[58%] relative overflow-hidden">
        <motion.img
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.6, ease: EASE }}
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />
        <div className="relative z-10 h-full flex flex-col justify-between p-12">
          <div className="flex items-center gap-2.5 text-white">
            <LensMark className="w-5 h-5 text-brand" />
            <span className="text-sm font-semibold tracking-tight">CARELENS</span>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1, ease: EASE }}
            className="narrative text-white text-4xl xl:text-5xl max-w-md leading-[1.15] text-balance"
          >
            The places you love, looked after a little more closely.
          </motion.p>
        </div>
      </div>

      {/* Form — quiet, blended, no boxed card */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-12 py-16 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-12 text-foreground">
            <LensMark className="w-5 h-5 text-brand" />
            <span className="text-sm font-semibold tracking-tight">CARELENS</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <span className="field-tag text-muted-foreground block mb-4">
                {mode === 'signin' ? 'Welcome back' : 'Get started'}
              </span>
              <h1 className="narrative text-4xl md:text-5xl mb-3 text-balance">
                {mode === 'signin' ? 'Welcome back.' : 'Begin protecting your home.'}
              </h1>
              <p className="text-muted-foreground mb-10">
                {mode === 'signin'
                  ? 'Continue protecting the places that matter most.'
                  : "It takes a minute — we'll walk you through it."}
              </p>

              {mode === 'signin' ? (
                <form onSubmit={handleEmailLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="field-tag text-muted-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-8 pr-0 h-12 border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-brand bg-transparent"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="field-tag text-muted-foreground">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-8 pr-0 h-12 border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-brand bg-transparent"
                      />
                    </div>
                  </div>
                  <Button type="submit" variant="brand" size="lg" className="w-full mt-2" disabled={loading || isSubmitting}>
                    {isSubmitting ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleEmailSignUp} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="field-tag text-muted-foreground">Full name</Label>
                    <div className="relative">
                      <User className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                      <Input
                        type="text"
                        placeholder="Jordan Rivera"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="pl-8 pr-0 h-12 border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-brand bg-transparent"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="field-tag text-muted-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-8 pr-0 h-12 border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-brand bg-transparent"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="field-tag text-muted-foreground">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                      <Input
                        type="password"
                        placeholder="Min. 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="pl-8 pr-0 h-12 border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-brand bg-transparent"
                      />
                    </div>
                  </div>
                  <Button type="submit" variant="brand" size="lg" className="w-full mt-2" disabled={loading || isSubmitting}>
                    {isSubmitting ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 field-tag text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={loading || isSubmitting}
            className="w-full h-12 gap-3"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>

          <button
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors mt-8"
          >
            {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
            <span className="text-brand font-medium">{mode === 'signin' ? 'Create one' : 'Sign in'}</span>
          </button>

          <div className="flex items-center gap-2 mt-10 text-xs text-muted-foreground/70">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
            <p>Your photos stay private. Only you control your data.</p>
          </div>

          <p className="text-center text-[11px] text-muted-foreground/60 mt-6 leading-relaxed">
            By continuing, you agree to our <a href="#" className="underline hover:text-foreground">Terms</a> and <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
