import { useLanguage } from '@/contexts/LanguageContext';

export const teamColors: Record<string, { bg: string; label_en: string; label_fr: string }> = {
  EN: { bg: 'bg-blue-500', label_en: 'English Team', label_fr: 'Équipe anglaise' },
  FR: { bg: 'bg-emerald-500', label_en: 'French Team', label_fr: 'Équipe française' },
  Bilingual: { bg: 'bg-amber-500', label_en: 'Both Teams', label_fr: 'Les deux équipes' },
};

export function getTeamColorClass(language?: string | null): string {
  return teamColors[language || 'Bilingual']?.bg || 'bg-primary';
}

export default function TeamColorLegend() {
  const { language } = useLanguage();

  return (
    <div className="flex flex-wrap gap-4">
      {Object.entries(teamColors).map(([key, val]) => (
        <div key={key} className="flex items-center gap-2 text-sm">
          <div className={`w-3 h-3 rounded-full ${val.bg}`} />
          <span>{language === 'fr' ? val.label_fr : val.label_en}</span>
        </div>
      ))}
    </div>
  );
}
