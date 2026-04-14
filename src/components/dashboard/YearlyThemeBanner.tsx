import { useState } from 'react';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export function YearlyThemeBanner() {
  const { data: settings, isLoading } = useOrganizationSettings();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) return null;

  const themeName = language === 'fr'
    ? settings?.yearly_theme_fr || settings?.yearly_theme_en
    : settings?.yearly_theme_en;

  const vision = language === 'fr'
    ? settings?.yearly_vision_fr || settings?.yearly_vision_en
    : settings?.yearly_vision_en;

  if (!themeName) return null;

  return (
    <Card className="relative overflow-hidden border-border bg-muted/20">
      <div className="absolute inset-0 bg-gradient-to-r from-muted/30 to-transparent pointer-events-none" />
      <div className="relative p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          {/* Year badge */}
          {settings?.theme_year && (
            <Badge variant="outline" className="self-start border-border text-muted-foreground text-xs">
              {settings.theme_year} Theme
            </Badge>
          )}

          {/* Theme name */}
          <h2 className="text-2xl md:text-3xl font-bold tracking-wide text-foreground uppercase">
            {themeName}
          </h2>

          {/* Scripture */}
          {settings?.theme_scripture && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground italic">
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              {settings.theme_scripture}
            </span>
          )}
        </div>

        {/* Collapsible vision */}
        {vision && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-3">
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')} />
              {isOpen ? 'Hide vision' : 'View vision'}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-border pl-3">
                {vision}
              </p>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </Card>
  );
}
