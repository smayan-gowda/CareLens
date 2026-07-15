import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, LogIn, UserPlus, Mail, Lock, User } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function LoginPage() {
  const { signIn, signInEmail, signUpEmail, loading, user } = useAuthStore();
  const navigate = useNavigate();
  
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
      toast.success('Signed in successfully');
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
      toast.success('Account created successfully');
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-black/5 dark:border-white/5 shadow-[0_4px_40px_rgb(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden bg-card">
        <CardHeader className="text-center pb-6 pt-12 px-8">
          <div className="mx-auto h-16 w-16 bg-muted rounded-2xl flex items-center justify-center text-foreground mb-6 shadow-sm border border-black/5 dark:border-white/5">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-medium tracking-tight text-foreground">CareLens</CardTitle>
          <CardDescription className="text-base font-light mt-2 text-muted-foreground">
            Securely access your home safety dashboard.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-10 pb-10">
          <Tabs defaultValue="signin" className="w-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-8 h-12 rounded-2xl bg-muted p-1">
              <TabsTrigger value="signin" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="w-full m-0 p-0">
              <form onSubmit={handleEmailLogin} className="space-y-5 w-full">
                <div className="space-y-2 w-full">
                  <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                  <div className="relative w-full">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
                    <Input 
                      type="email" 
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-12 h-14 bg-muted/50 border-transparent focus:border-border rounded-2xl w-full text-base shadow-none"
                    />
                  </div>
                </div>
                <div className="space-y-2 w-full">
                  <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground ml-1">Password</Label>
                  <div className="relative w-full">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
                    <Input 
                      type="password" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-12 h-14 bg-muted/50 border-transparent focus:border-border rounded-2xl w-full text-base shadow-none"
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={loading || isSubmitting}
                  className="w-full h-14 rounded-2xl font-medium mt-4 bg-foreground text-background shadow-md transition-all active:scale-[0.98] text-base"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="w-full m-0 p-0">
              <form onSubmit={handleEmailSignUp} className="space-y-5 w-full">
                <div className="space-y-2 w-full">
                  <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                  <div className="relative w-full">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
                    <Input 
                      type="text" 
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="pl-12 h-14 bg-muted/50 border-transparent focus:border-border rounded-2xl w-full text-base shadow-none"
                    />
                  </div>
                </div>
                <div className="space-y-2 w-full">
                  <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                  <div className="relative w-full">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
                    <Input 
                      type="email" 
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-12 h-14 bg-muted/50 border-transparent focus:border-border rounded-2xl w-full text-base shadow-none"
                    />
                  </div>
                </div>
                <div className="space-y-2 w-full">
                  <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground ml-1">Password</Label>
                  <div className="relative w-full">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
                    <Input 
                      type="password" 
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="pl-12 h-14 bg-muted/50 border-transparent focus:border-border rounded-2xl w-full text-base shadow-none"
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={loading || isSubmitting}
                  className="w-full h-14 rounded-2xl font-medium mt-4 bg-foreground text-background shadow-md transition-all active:scale-[0.98] text-base"
                >
                  {isSubmitting ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-black/5 dark:border-white/5"></span>
            </div>
            <div className="relative flex justify-center text-xs font-medium text-muted-foreground uppercase tracking-widest">
              <span className="bg-card px-4">Or continue with</span>
            </div>
          </div>

          <Button 
            variant="outline"
            onClick={handleGoogleLogin} 
            disabled={loading || isSubmitting}
            className="w-full h-14 font-medium rounded-2xl gap-3 border border-border bg-card text-foreground hover:bg-muted/50 shadow-sm transition-all active:scale-[0.98] text-base"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
        </CardContent>
        
        <CardFooter className="pb-10 pt-4 px-8">
          <p className="text-center text-[10px] text-muted-foreground/70 w-full leading-relaxed px-4">
            By continuing, you agree to our <a href="#" className="underline hover:text-primary">Terms</a> and <a href="#" className="underline hover:text-primary">Privacy Policy</a>.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

