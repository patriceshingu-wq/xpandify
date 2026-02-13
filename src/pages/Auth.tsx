import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Globe, Loader2, ArrowLeft } from 'lucide-react';
import logo from '@/assets/logo.png';
import { z } from 'zod';

type AuthMode = 'login' | 'signup' | 'forgot';

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'forgot') {
      const emailValid = z.string().email().safeParse(email);
      if (!emailValid.success) {
        toast({ title: t('common.error'), description: 'Invalid email address', variant: 'destructive' });
        return;
      }
      setIsLoading(true);
      const { error } = await resetPassword(email);
      setIsLoading(false);
      if (error) {
        toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
      } else {
        toast({ title: t('common.success'), description: t('auth.resetLinkSent') });
        setMode('login');
      }
      return;
    }

    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({
        title: t('common.error'),
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = mode === 'login' ? await signIn(email, password) : await signUp(email, password);
    setIsLoading(false);

    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: t('common.success'),
        description: mode === 'login' ? t('auth.loginSuccess') : t('auth.signupSuccess'),
      });
      navigate('/dashboard');
    }
  };

  const getTitle = () => {
    if (mode === 'forgot') return t('auth.forgotPasswordTitle');
    return mode === 'login' ? t('auth.welcome') : t('auth.createAccount');
  };

  const getDescription = () => {
    if (mode === 'forgot') return t('auth.forgotPasswordDescription');
    return mode === 'login' ? t('auth.login') : t('auth.signup');
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
          className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
        >
          <Globe className="h-5 w-5" />
        </Button>
      </div>

      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <img src={logo} alt="Xpandify logo" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-serif font-bold text-primary-foreground">Xpandify</h1>
          <p className="text-primary-foreground/70 mt-2">{t('app.tagline')}</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="font-serif">{getTitle()}</CardTitle>
            <CardDescription>{getDescription()}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@church.org"
                  required
                />
              </div>

              {mode !== 'forgot' && (
                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              )}

              {mode === 'login' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-sm text-accent hover:underline font-medium"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'forgot'
                  ? t('auth.sendResetLink')
                  : mode === 'login'
                    ? t('auth.login')
                    : t('auth.signup')}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              {mode === 'forgot' ? (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-accent hover:underline font-medium inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  {t('auth.backToLogin')}
                </button>
              ) : (
                <>
                  <span className="text-muted-foreground">
                    {mode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}
                  </span>{' '}
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-accent hover:underline font-medium"
                  >
                    {mode === 'login' ? t('auth.signup') : t('auth.login')}
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
