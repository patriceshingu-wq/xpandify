import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Globe, Loader2 } from 'lucide-react';
import logo from '@/assets/logo.png';
import { z } from 'zod';

const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase automatically handles the token from the URL hash
    // and establishes a session via onAuthStateChange.
    // We just need to wait for the PASSWORD_RECOVERY event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsReady(true);
      }
    });

    // Also check if we already have a session (user clicked link and session is set)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = passwordSchema.safeParse({ password, confirmPassword });
    if (!validation.success) {
      toast({
        title: t('common.error'),
        description: validation.error.errors[0].message === 'Passwords do not match'
          ? t('auth.passwordsMismatch')
          : validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('common.success'), description: t('auth.resetSuccess') });
      navigate('/dashboard');
    }
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
          <h1 className="text-3xl font-serif font-bold text-white">Xpandify</h1>
          <p className="text-primary-foreground/70 mt-2">{t('app.tagline')}</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="font-serif">{t('auth.resetPassword')}</CardTitle>
            <CardDescription>
              {isReady ? t('auth.forgotPasswordTitle') : t('auth.forgotPasswordDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isReady ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Verifying reset link...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.newPassword')}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('auth.confirmNewPassword')}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('auth.resetPassword')}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center text-sm">
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="text-accent hover:underline font-medium"
              >
                {t('auth.backToLogin')}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
