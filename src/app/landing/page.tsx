'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import {
  Dumbbell,
  Sparkles,
  Activity,
  Heart,
  Shield,
  Target,
  Flame,
  Eye,
  EyeOff,
  Loader2,
  Sun,
  Moon,
} from 'lucide-react';

function useHasMounted() {
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useHasMounted();
  if (!mounted) return <div className="w-8 h-8" />;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}

const features = [
  { icon: Activity, label: 'AI Pose Detection', color: 'text-emerald-500' },
  { icon: Target, label: 'Real-time Rep Counting', color: 'text-sky-500' },
  { icon: Heart, label: 'Form Quality Scoring', color: 'text-red-500' },
  { icon: Flame, label: 'Workout Streaks', color: 'text-orange-500' },
  { icon: Shield, label: 'Private & Secure', color: 'text-violet-500' },
  { icon: Dumbbell, label: 'Multiple Exercises', color: 'text-amber-500' },
];

const testimonials = [
  { name: 'Alex K.', text: 'This app completely changed my home workout routine. The AI tracking is incredibly accurate!' },
  { name: 'Sarah M.', text: 'Finally a rep counter that actually works. No more guessing if I hit my targets.' },
  { name: 'Mike T.', text: 'The form scoring helps me avoid injuries. Great tool for beginners and pros alike.' },
];

export default function LandingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const mounted = useHasMounted();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || 'Failed to create account');
          setLoading(false);
          return;
        }
        toast.success('Account created! Please sign in.');
        setMode('login');
        setPassword('');
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Invalid email or password');
      } else {
        router.push('/');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [mode, email, password, name, router]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">FitRep – AI Tracker</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
        {/* Left: Branding */}
        <div className="flex-1 flex flex-col justify-center p-8 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="w-8 h-8 text-emerald-500" />
              </motion.div>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                AI-Powered Fitness
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Track Your Reps
              <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
                Like Never Before
              </span>
            </h2>

            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed mb-8">
              Position yourself in front of the camera and let our AI count your reps in real-time with instant form feedback.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              {features.map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground bg-white dark:bg-gray-900 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-800 shadow-sm">
                  <Icon className={`w-4 h-4 ${color}`} />
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl">
              {testimonials.map(({ name, text }) => (
                <div key={name} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                  <p className="text-xs text-muted-foreground mb-2 leading-relaxed">&ldquo;{text}&rdquo;</p>
                  <p className="text-xs font-semibold text-foreground">{name}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right: Auth Form */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-md"
          >
            <Card className="shadow-xl border-gray-200/80 dark:border-gray-800/80">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-center">
                  {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </CardTitle>
                <CardDescription className="text-center">
                  {mode === 'login'
                    ? 'Sign in to continue tracking your workouts'
                    : 'Start your fitness journey with AI tracking'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'signup' && (
                    <div className="space-y-1.5">
                      <label htmlFor="name" className="text-sm font-medium text-foreground">Name</label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required={mode === 'signup'}
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-semibold shadow-lg shadow-emerald-600/25"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                  </Button>
                </form>

                <Separator className="my-6" />

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                    <Button
                      variant="link"
                      className="text-emerald-600 dark:text-emerald-400 font-semibold ml-1 p-0 h-auto"
                      onClick={() => {
                        setMode(mode === 'login' ? 'signup' : 'login');
                        setPassword('');
                      }}
                    >
                      {mode === 'login' ? 'Sign up' : 'Sign in'}
                    </Button>
                  </p>
                </div>
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground text-center mt-4">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}