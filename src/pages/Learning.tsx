import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { GraduationCap, Route, TrendingUp } from 'lucide-react';

// Sub-tab content — imported from existing pages (refactored as inline content)
import CourseCatalogTab from '@/components/learning/CourseCatalogTab';
import PathwaysTab from '@/components/learning/PathwaysTab';
import MyProgressTab from '@/components/learning/MyProgressTab';

export default function Learning() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('catalog');

  return (
    <MainLayout title={t('nav.learning') || 'Learning'} subtitle="Courses, pathways, and your progress">
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title={t('nav.learning') || 'Learning'}
          subtitle="Courses, pathways, and your progress"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex">
            <TabsTrigger value="catalog" className="gap-1.5 touch-target">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">{t('courses.title') || 'Courses'}</span>
              <span className="sm:hidden">Courses</span>
            </TabsTrigger>
            <TabsTrigger value="pathways" className="gap-1.5 touch-target">
              <Route className="h-4 w-4" />
              <span className="hidden sm:inline">{t('pathways.title') || 'Pathways'}</span>
              <span className="sm:hidden">Paths</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-1.5 touch-target">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">{t('myLearning.title') || 'My Progress'}</span>
              <span className="sm:hidden">Progress</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="mt-6">
            <CourseCatalogTab />
          </TabsContent>

          <TabsContent value="pathways" className="mt-6">
            <PathwaysTab />
          </TabsContent>

          <TabsContent value="progress" className="mt-6">
            <MyProgressTab />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
