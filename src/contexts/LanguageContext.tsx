import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'fr';

interface Translations {
  [key: string]: {
    en: string;
    fr: string;
  };
}

// Core application translations
const translations: Translations = {
  // App
  'app.name': { en: 'Expandify', fr: 'Expandify' },
  'app.tagline': { en: 'Grow Your Ministry Team', fr: 'Développez Votre Équipe Ministérielle' },
  
  // Navigation
  'nav.dashboard': { en: 'Dashboard', fr: 'Tableau de Bord' },
  'nav.people': { en: 'People', fr: 'Personnes' },
  'nav.ministries': { en: 'Ministries', fr: 'Ministères' },
  'nav.goals': { en: 'Goals', fr: 'Objectifs' },
  'nav.meetings': { en: 'Meetings', fr: 'Réunions' },
  'nav.development': { en: 'Development', fr: 'Développement' },
  'nav.courses': { en: 'Courses', fr: 'Formations' },
  'nav.feedback': { en: 'Feedback', fr: 'Feedback' },
  'nav.reviews': { en: 'Reviews', fr: 'Évaluations' },
  'nav.surveys': { en: 'Surveys', fr: 'Sondages' },
  'nav.admin': { en: 'Admin', fr: 'Administration' },
  'nav.settings': { en: 'Settings', fr: 'Paramètres' },
  'nav.logout': { en: 'Logout', fr: 'Déconnexion' },
  
  // Auth
  'auth.login': { en: 'Login', fr: 'Connexion' },
  'auth.signup': { en: 'Sign Up', fr: 'Inscription' },
  'auth.email': { en: 'Email', fr: 'Courriel' },
  'auth.password': { en: 'Password', fr: 'Mot de passe' },
  'auth.confirmPassword': { en: 'Confirm Password', fr: 'Confirmer le mot de passe' },
  'auth.forgotPassword': { en: 'Forgot password?', fr: 'Mot de passe oublié?' },
  'auth.noAccount': { en: "Don't have an account?", fr: "Vous n'avez pas de compte?" },
  'auth.hasAccount': { en: 'Already have an account?', fr: 'Vous avez déjà un compte?' },
  'auth.loginSuccess': { en: 'Logged in successfully', fr: 'Connexion réussie' },
  'auth.signupSuccess': { en: 'Account created successfully', fr: 'Compte créé avec succès' },
  'auth.logoutSuccess': { en: 'Logged out successfully', fr: 'Déconnexion réussie' },
  'auth.welcome': { en: 'Welcome back', fr: 'Bienvenue' },
  'auth.createAccount': { en: 'Create your account', fr: 'Créez votre compte' },
  
  // Dashboard
  'dashboard.welcome': { en: 'Welcome back', fr: 'Bienvenue' },
  'dashboard.overview': { en: 'Overview', fr: 'Vue d\'ensemble' },
  'dashboard.upcomingMeetings': { en: 'Upcoming Meetings', fr: 'Réunions à venir' },
  'dashboard.recentGoals': { en: 'Recent Goals', fr: 'Objectifs récents' },
  'dashboard.myTeam': { en: 'My Team', fr: 'Mon Équipe' },
  'dashboard.quickActions': { en: 'Quick Actions', fr: 'Actions rapides' },
  'dashboard.totalPeople': { en: 'Total People', fr: 'Total des personnes' },
  'dashboard.activeStaff': { en: 'Active Staff', fr: 'Personnel actif' },
  'dashboard.activeVolunteers': { en: 'Active Volunteers', fr: 'Bénévoles actifs' },
  'dashboard.goalsInProgress': { en: 'Goals In Progress', fr: 'Objectifs en cours' },
  
  // People
  'people.title': { en: 'People', fr: 'Personnes' },
  'people.subtitle': { en: 'Manage staff, volunteers, and congregants', fr: 'Gérer le personnel, les bénévoles et les fidèles' },
  'people.addPerson': { en: 'Add Person', fr: 'Ajouter une personne' },
  'people.search': { en: 'Search people...', fr: 'Rechercher des personnes...' },
  'people.staff': { en: 'Staff', fr: 'Personnel' },
  'people.volunteer': { en: 'Volunteer', fr: 'Bénévole' },
  'people.congregant': { en: 'Congregant', fr: 'Fidèle' },
  'people.active': { en: 'Active', fr: 'Actif' },
  'people.inactive': { en: 'Inactive', fr: 'Inactif' },
  'people.onLeave': { en: 'On Leave', fr: 'En congé' },
  
  // Goals
  'goals.title': { en: 'Goals', fr: 'Objectifs' },
  'goals.subtitle': { en: 'Track church, ministry, and individual goals', fr: 'Suivre les objectifs de l\'église, du ministère et individuels' },
  'goals.addGoal': { en: 'Add Goal', fr: 'Ajouter un objectif' },
  'goals.church': { en: 'Church', fr: 'Église' },
  'goals.ministry': { en: 'Ministry', fr: 'Ministère' },
  'goals.department': { en: 'Department', fr: 'Département' },
  'goals.individual': { en: 'Individual', fr: 'Individuel' },
  'goals.notStarted': { en: 'Not Started', fr: 'Non démarré' },
  'goals.inProgress': { en: 'In Progress', fr: 'En cours' },
  'goals.completed': { en: 'Completed', fr: 'Terminé' },
  'goals.onHold': { en: 'On Hold', fr: 'En attente' },
  'goals.cancelled': { en: 'Cancelled', fr: 'Annulé' },
  
  // Meetings
  'meetings.title': { en: 'Meetings', fr: 'Réunions' },
  'meetings.subtitle': { en: 'Schedule and manage meetings', fr: 'Planifier et gérer les réunions' },
  'meetings.addMeeting': { en: 'Schedule Meeting', fr: 'Planifier une réunion' },
  'meetings.oneOnOne': { en: 'One-on-One', fr: 'Tête-à-tête' },
  'meetings.team': { en: 'Team', fr: 'Équipe' },
  'meetings.board': { en: 'Board', fr: 'Conseil' },
  
  // Development
  'development.title': { en: 'Development Plans', fr: 'Plans de développement' },
  'development.subtitle': { en: 'Personal development and growth tracking', fr: 'Suivi du développement personnel et de la croissance' },
  'development.addPlan': { en: 'Create Plan', fr: 'Créer un plan' },
  
  // Courses
  'courses.title': { en: 'Courses', fr: 'Formations' },
  'courses.subtitle': { en: 'Training and course catalog', fr: 'Catalogue de formation et de cours' },
  'courses.addCourse': { en: 'Add Course', fr: 'Ajouter une formation' },
  
  // Feedback
  'feedback.title': { en: 'Feedback', fr: 'Feedback' },
  'feedback.subtitle': { en: 'Encouragement and coaching notes', fr: 'Notes d\'encouragement et de coaching' },
  'feedback.addFeedback': { en: 'Give Feedback', fr: 'Donner un feedback' },
  'feedback.encouragement': { en: 'Encouragement', fr: 'Encouragement' },
  'feedback.coaching': { en: 'Coaching', fr: 'Coaching' },
  'feedback.concern': { en: 'Concern', fr: 'Préoccupation' },
  
  // Reviews
  'reviews.title': { en: 'Performance Reviews', fr: 'Évaluations de performance' },
  'reviews.subtitle': { en: 'Annual and periodic reviews', fr: 'Évaluations annuelles et périodiques' },
  'reviews.addReview': { en: 'Start Review', fr: 'Commencer une évaluation' },
  
  // Surveys
  'surveys.title': { en: 'Pulse Surveys', fr: 'Sondages Pulse' },
  'surveys.subtitle': { en: 'Team health and engagement surveys', fr: 'Sondages sur la santé et l\'engagement de l\'équipe' },
  'surveys.addSurvey': { en: 'Create Survey', fr: 'Créer un sondage' },
  
  // Admin
  'admin.title': { en: 'Administration', fr: 'Administration' },
  'admin.subtitle': { en: 'System settings and user management', fr: 'Paramètres système et gestion des utilisateurs' },
  'admin.users': { en: 'Users', fr: 'Utilisateurs' },
  'admin.roles': { en: 'Roles', fr: 'Rôles' },
  'admin.ministries': { en: 'Ministries', fr: 'Ministères' },
  'admin.courses': { en: 'Courses', fr: 'Formations' },
  
  // Common
  'common.save': { en: 'Save', fr: 'Enregistrer' },
  'common.cancel': { en: 'Cancel', fr: 'Annuler' },
  'common.delete': { en: 'Delete', fr: 'Supprimer' },
  'common.edit': { en: 'Edit', fr: 'Modifier' },
  'common.view': { en: 'View', fr: 'Voir' },
  'common.add': { en: 'Add', fr: 'Ajouter' },
  'common.search': { en: 'Search', fr: 'Rechercher' },
  'common.filter': { en: 'Filter', fr: 'Filtrer' },
  'common.all': { en: 'All', fr: 'Tous' },
  'common.loading': { en: 'Loading...', fr: 'Chargement...' },
  'common.noResults': { en: 'No results found', fr: 'Aucun résultat trouvé' },
  'common.error': { en: 'An error occurred', fr: 'Une erreur s\'est produite' },
  'common.success': { en: 'Success', fr: 'Succès' },
  'common.confirm': { en: 'Confirm', fr: 'Confirmer' },
  'common.actions': { en: 'Actions', fr: 'Actions' },
  'common.status': { en: 'Status', fr: 'Statut' },
  'common.name': { en: 'Name', fr: 'Nom' },
  'common.email': { en: 'Email', fr: 'Courriel' },
  'common.phone': { en: 'Phone', fr: 'Téléphone' },
  'common.date': { en: 'Date', fr: 'Date' },
  'common.description': { en: 'Description', fr: 'Description' },
  'common.notes': { en: 'Notes', fr: 'Notes' },
  'common.progress': { en: 'Progress', fr: 'Progrès' },
  'common.dueDate': { en: 'Due Date', fr: 'Date d\'échéance' },
  'common.startDate': { en: 'Start Date', fr: 'Date de début' },
  'common.endDate': { en: 'End Date', fr: 'Date de fin' },
  'common.category': { en: 'Category', fr: 'Catégorie' },
  'common.type': { en: 'Type', fr: 'Type' },
  'common.year': { en: 'Year', fr: 'Année' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  getLocalizedField: (obj: object, field: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('expandify-language');
    return (saved === 'fr' ? 'fr' : 'en') as Language;
  });

  useEffect(() => {
    localStorage.setItem('expandify-language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }
    return translation[language] || translation.en || key;
  };

  // Get localized field from an object with _en and _fr suffixes
  const getLocalizedField = (obj: object, field: string): string => {
    const record = obj as Record<string, unknown>;
    const localizedKey = `${field}_${language}`;
    const fallbackKey = `${field}_en`;
    
    const value = record[localizedKey] as string | undefined;
    const fallback = record[fallbackKey] as string | undefined;
    
    return value || fallback || '';
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getLocalizedField }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
