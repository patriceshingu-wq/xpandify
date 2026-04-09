import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Sparkles, User, Camera, Globe, Rocket, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
}

type Step = 'welcome' | 'profile' | 'language' | 'done';
const STEPS: Step[] = ['welcome', 'profile', 'language', 'done'];

export function OnboardingWizard({ open, onComplete }: OnboardingWizardProps) {
  const { person, session } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { uploadPhoto, isUploading } = useProfilePhoto();

  const [step, setStep] = useState<Step>('welcome');
  const [preferredName, setPreferredName] = useState(person?.preferred_name || '');
  const [language, setLanguage] = useState((person as any)?.primary_language || 'en');
  const [photoUrl, setPhotoUrl] = useState((person as any)?.photo_url || '');
  const [isSaving, setIsSaving] = useState(false);

  const currentIndex = STEPS.indexOf(step);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !person?.id) return;
    const url = await uploadPhoto(person.id, file);
    if (url) setPhotoUrl(url);
  };

  const handleComplete = async () => {
    if (!person?.id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('people')
        .update({
          preferred_name: preferredName || null,
          primary_language: language,
          onboarding_completed: true,
        })
        .eq('id', person.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['people'] });
      toast.success(t('common.success'));
      onComplete();
    } catch (err) {
      console.error('[OnboardingWizard] Error:', err);
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const initials = `${person?.first_name?.[0] || ''}${person?.last_name?.[0] || ''}`;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {step === 'welcome' && '✨ Welcome to Xpandify!'}
            {step === 'profile' && 'Set Up Your Profile'}
            {step === 'language' && 'Language Preference'}
            {step === 'done' && "You're All Set!"}
          </DialogTitle>
          <DialogDescription>
            {step === 'welcome' && `Hi ${person?.first_name}! Let's get you set up in just a few steps.`}
            {step === 'profile' && 'Add a photo and preferred name so your team recognizes you.'}
            {step === 'language' && 'Choose your preferred language for the interface.'}
            {step === 'done' && 'Your profile is ready. Time to explore!'}
          </DialogDescription>
        </DialogHeader>

        <Progress value={progress} className="h-1.5 mb-4" />

        <div className="space-y-6 py-2">
          {step === 'welcome' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Xpandify helps your team stay aligned through goals, meetings, feedback, and development tracking.
                </p>
              </div>
            </div>
          )}

          {step === 'profile' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={photoUrl} />
                    <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                    <Camera className="h-4 w-4" />
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>
                {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              <div className="space-y-2">
                <Label>What should we call you?</Label>
                <Input
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  placeholder={person?.first_name || 'Preferred name'}
                />
                <p className="text-xs text-muted-foreground">
                  This is how your name appears across the app.
                </p>
              </div>
            </div>
          )}

          {step === 'language' && (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                <Globe className="h-8 w-8 text-accent-foreground" />
              </div>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                  <SelectItem value="fr">🇫🇷 Français</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
                <Rocket className="h-10 w-10 text-success" />
              </div>
              <p className="text-sm text-muted-foreground">
                Check your dashboard for upcoming meetings, goals, and team updates.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-2">
          {currentIndex > 0 ? (
            <Button variant="ghost" onClick={() => setStep(STEPS[currentIndex - 1])}>
              Back
            </Button>
          ) : (
            <div />
          )}
          {step === 'done' ? (
            <Button onClick={handleComplete} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Get Started
            </Button>
          ) : (
            <Button onClick={() => setStep(STEPS[currentIndex + 1])}>
              {step === 'welcome' ? "Let's Go" : 'Next'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
