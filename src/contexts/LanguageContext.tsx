import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

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
  'app.name': { en: 'Xpandify', fr: 'Xpandify' },
  'app.tagline': { en: 'Grow Your Ministry Team', fr: 'Développez Votre Équipe Ministérielle' },
  
  // Navigation
  'nav.dashboard': { en: 'Dashboard', fr: 'Tableau de Bord' },
  'nav.team': { en: 'My Team', fr: 'Mon Équipe' },
  'nav.people': { en: 'People', fr: 'Personnes' },
  'nav.ministries': { en: 'Ministries', fr: 'Ministères' },
  'nav.goals': { en: 'Goals', fr: 'Objectifs' },
  'nav.meetings': { en: 'Meetings', fr: 'Réunions' },
  'nav.development': { en: 'Development', fr: 'Développement' },
  'nav.courses': { en: 'Courses', fr: 'Formations' },
  'nav.learning': { en: 'Learning', fr: 'Apprentissage' },
  'nav.feedback': { en: 'Feedback', fr: 'Feedback' },
  'nav.reviews': { en: 'Reviews', fr: 'Évaluations' },
  'nav.surveys': { en: 'Surveys', fr: 'Sondages' },
  'nav.analytics': { en: 'Analytics', fr: 'Analytique' },
  'nav.admin': { en: 'Admin', fr: 'Administration' },
  'nav.settings': { en: 'Settings', fr: 'Paramètres' },
  'nav.logout': { en: 'Logout', fr: 'Déconnexion' },
  'nav.calendar': { en: 'Calendar', fr: 'Calendrier' },
  'nav.eventsCalendar': { en: 'Events', fr: 'Événements' },
  'nav.quarters': { en: 'Quarters', fr: 'Trimestres' },
  'nav.programs': { en: 'Programs', fr: 'Programmes' },
  'nav.pathways': { en: 'Pathways', fr: 'Parcours' },
  'nav.myLearning': { en: 'My Learning', fr: 'Mon Apprentissage' },
  'nav.mentorship': { en: 'Mentorship', fr: 'Mentorat' },
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
  'auth.forgotPasswordTitle': { en: 'Reset your password', fr: 'Réinitialiser votre mot de passe' },
  'auth.forgotPasswordDescription': { en: 'Enter your email to receive a reset link', fr: 'Entrez votre courriel pour recevoir un lien' },
  'auth.sendResetLink': { en: 'Send Reset Link', fr: 'Envoyer le lien' },
  'auth.resetLinkSent': { en: 'Check your email for a reset link', fr: 'Vérifiez votre courriel' },
  'auth.newPassword': { en: 'New Password', fr: 'Nouveau mot de passe' },
  'auth.confirmNewPassword': { en: 'Confirm New Password', fr: 'Confirmer le nouveau mot de passe' },
  'auth.resetPassword': { en: 'Reset Password', fr: 'Réinitialiser' },
  'auth.resetSuccess': { en: 'Password updated successfully', fr: 'Mot de passe mis à jour' },
  'auth.backToLogin': { en: 'Back to login', fr: 'Retour à la connexion' },
  'auth.passwordsMismatch': { en: 'Passwords do not match', fr: 'Les mots de passe ne correspondent pas' },
  
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
  'people.title': { en: 'Job Title', fr: 'Titre du poste' },
  'people.campus': { en: 'Campus', fr: 'Campus' },
  'people.selectCampus': { en: 'Select campus', fr: 'Sélectionner le campus' },
  'people.ministryAssignments': { en: 'Ministry Assignments', fr: 'Affectations ministérielles' },
  'people.noMinistriesAvailable': { en: 'No ministries available', fr: 'Aucun ministère disponible' },
  'people.ministriesSelected': { en: 'ministries selected', fr: 'ministères sélectionnés' },
  'people.ministriesUpdated': { en: 'Ministry assignments updated', fr: 'Affectations ministérielles mises à jour' },

  // Person Profile
  'personProfile.loading': { en: 'Loading...', fr: 'Chargement...' },
  'personProfile.notFound': { en: 'Not Found', fr: 'Non trouvé' },
  'personProfile.personNotFound': { en: 'Person not found', fr: 'Personne non trouvée' },
  'personProfile.backToPeople': { en: 'Back to People', fr: 'Retour aux personnes' },
  'personProfile.contactInfo': { en: 'Contact Information', fr: 'Coordonnées' },
  'personProfile.startDate': { en: 'Start Date', fr: 'Date de début' },
  'personProfile.supervisor': { en: 'Supervisor', fr: 'Superviseur' },
  'personProfile.ministries': { en: 'Ministries', fr: 'Ministères' },
  'personProfile.noMinistries': { en: 'No ministry assignments', fr: 'Aucune affectation ministérielle' },
  'personProfile.development': { en: 'Development', fr: 'Développement' },
  'personProfile.developmentDescription': { en: 'Calling, strengths, and growth areas', fr: 'Appel, forces et domaines de croissance' },
  'personProfile.calling': { en: 'Calling', fr: 'Appel' },
  'personProfile.strengths': { en: 'Strengths', fr: 'Forces' },
  'personProfile.growthAreas': { en: 'Growth Areas', fr: 'Domaines de croissance' },
  'personProfile.noDevelopmentInfo': { en: 'No development information available', fr: 'Aucune information de développement disponible' },
  'personProfile.goals': { en: 'Goals', fr: 'Objectifs' },
  'personProfile.meetings': { en: 'Meetings', fr: 'Réunions' },
  'personProfile.courses': { en: 'Courses', fr: 'Formations' },
  'personProfile.feedback': { en: 'Feedback', fr: 'Feedback' },

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
  'courses.editCourse': { en: 'Edit Course', fr: 'Modifier la formation' },
  'courses.search': { en: 'Search courses...', fr: 'Rechercher des formations...' },
  'courses.code': { en: 'Course Code', fr: 'Code du cours' },
  'courses.duration': { en: 'Duration (hours)', fr: 'Durée (heures)' },
  'courses.titleEn': { en: 'Title (English)', fr: 'Titre (anglais)' },
  'courses.titleFr': { en: 'Title (French)', fr: 'Titre (français)' },
  'courses.descriptionEn': { en: 'Description (English)', fr: 'Description (anglais)' },
  'courses.descriptionFr': { en: 'Description (French)', fr: 'Description (français)' },
  'courses.deliveryType': { en: 'Delivery Type', fr: 'Type de livraison' },
  'courses.inPerson': { en: 'In Person', fr: 'En personne' },
  'courses.online': { en: 'Online', fr: 'En ligne' },
  'courses.hybrid': { en: 'Hybrid', fr: 'Hybride' },
  'courses.readingPlan': { en: 'Reading Plan', fr: 'Plan de lecture' },
  'courses.theology': { en: 'Theology', fr: 'Théologie' },
  'courses.leadership': { en: 'Leadership', fr: 'Leadership' },
  'courses.ministrySkills': { en: 'Ministry Skills', fr: 'Compétences ministérielles' },
  'courses.pastoralSkills': { en: 'Pastoral Skills', fr: 'Compétences pastorales' },
  'courses.character': { en: 'Character', fr: 'Caractère' },
  'courses.isActive': { en: 'Active', fr: 'Actif' },
  'courses.inactive': { en: 'Inactive', fr: 'Inactif' },
  'courses.noCourses': { en: 'No courses found', fr: 'Aucune formation trouvée' },
  'courses.noDescription': { en: 'No description', fr: 'Aucune description' },
  'courses.deleteConfirm': { en: 'Delete Course?', fr: 'Supprimer la formation?' },
  'courses.deleteWarning': { en: 'This action cannot be undone.', fr: 'Cette action est irréversible.' },
  'courses.addCourseDescription': { en: 'Create a new training course', fr: 'Créer une nouvelle formation' },
  'courses.editCourseDescription': { en: 'Update course details', fr: 'Mettre à jour les détails du cours' },
  'common.other': { en: 'Other', fr: 'Autre' },
  'common.more': { en: 'More', fr: 'Plus' },
  
  // Pathways
  'pathways.title': { en: 'Learning Pathways', fr: 'Parcours d\'apprentissage' },
  'pathways.subtitle': { en: 'Multi-course learning tracks for discipleship', fr: 'Parcours de formation multi-cours pour le discipulat' },
  'pathways.addPathway': { en: 'Add Pathway', fr: 'Ajouter un parcours' },
  'pathways.noPathways': { en: 'No pathways yet', fr: 'Aucun parcours pour l\'instant' },
  'pathways.noPathwaysDesc': { en: 'Create learning pathways to guide disciples through structured courses.', fr: 'Créez des parcours d\'apprentissage pour guider les disciples à travers des cours structurés.' },
  'pathways.editPathway': { en: 'Edit Pathway', fr: 'Modifier le parcours' },
  'pathways.deleteConfirm': { en: 'Delete Pathway', fr: 'Supprimer le parcours' },
  'pathways.deleteWarning': { en: 'This will remove the pathway and all course associations.', fr: 'Cela supprimera le parcours et toutes les associations de cours.' },
  
  // My Learning
  'myLearning.title': { en: 'My Learning', fr: 'Mon Apprentissage' },
  'myLearning.subtitle': { en: 'Track your course progress and learning journey', fr: 'Suivez votre progression et votre parcours d\'apprentissage' },
  'myLearning.inProgress': { en: 'In Progress', fr: 'En cours' },
  'myLearning.completed': { en: 'Completed', fr: 'Terminé' },
  'myLearning.available': { en: 'Available Courses', fr: 'Cours disponibles' },
  'myLearning.noCourses': { en: 'No courses yet', fr: 'Aucun cours pour l\'instant' },
  'myLearning.noCoursesDesc': { en: 'Start your learning journey by enrolling in a course.', fr: 'Commencez votre parcours d\'apprentissage en vous inscrivant à un cours.' },
  
  // Mentorship
  'mentorship.title': { en: 'Mentorship', fr: 'Mentorat' },
  'mentorship.subtitle': { en: 'Mentor-mentee relationships and check-ins', fr: 'Relations mentor-mentoré et suivis' },
  'mentorship.addMentorship': { en: 'New Mentorship', fr: 'Nouveau mentorat' },
  'mentorship.noMentorships': { en: 'No mentorship relationships', fr: 'Aucune relation de mentorat' },
  'mentorship.noMentorshipsDesc': { en: 'Create mentorship connections to support growth and development.', fr: 'Créez des connexions de mentorat pour soutenir la croissance et le développement.' },
  
  // Feedback
  'feedback.title': { en: 'Feedback', fr: 'Feedback' },
  'feedback.subtitle': { en: 'Encouragement and coaching notes', fr: 'Notes d\'encouragement et de coaching' },
  'feedback.addFeedback': { en: 'Give Feedback', fr: 'Donner un feedback' },
  'feedback.encouragement': { en: 'Encouragement', fr: 'Encouragement' },
  'feedback.coaching': { en: 'Coaching', fr: 'Coaching' },
  'feedback.concern': { en: 'Concern', fr: 'Préoccupation' },
  'feedback.recipient': { en: 'Recipient', fr: 'Destinataire' },
  'feedback.selectPerson': { en: 'Select a person', fr: 'Sélectionner une personne' },
  'feedback.titleEn': { en: 'Title (English)', fr: 'Titre (anglais)' },
  'feedback.titleFr': { en: 'Title (French)', fr: 'Titre (français)' },
  'feedback.contentEn': { en: 'Content (English)', fr: 'Contenu (anglais)' },
  'feedback.contentFr': { en: 'Content (French)', fr: 'Contenu (français)' },
  'feedback.visibleToPerson': { en: 'Visible to person', fr: 'Visible par la personne' },
  'feedback.visibleToPersonDescription': { en: 'The person can see this feedback', fr: 'La personne peut voir ce feedback' },
  'feedback.from': { en: 'From', fr: 'De' },
  'feedback.unknownPerson': { en: 'Unknown', fr: 'Inconnu' },
  'feedback.noContent': { en: 'No content', fr: 'Aucun contenu' },
  'feedback.noFeedback': { en: 'No feedback found', fr: 'Aucun feedback trouvé' },
  'feedback.deleteConfirm': { en: 'Delete Feedback?', fr: 'Supprimer le feedback?' },
  'feedback.deleteWarning': { en: 'This action cannot be undone.', fr: 'Cette action est irréversible.' },
  'feedback.addFeedbackDescription': { en: 'Share feedback with a team member', fr: 'Partager un feedback avec un membre de l\'équipe' },
  
  // Reviews
  'reviews.title': { en: 'Performance Reviews', fr: 'Évaluations de performance' },
  'reviews.subtitle': { en: 'Annual and periodic reviews', fr: 'Évaluations annuelles et périodiques' },
  'reviews.addReview': { en: 'Start Review', fr: 'Commencer une évaluation' },
  'reviews.editReview': { en: 'Edit Review', fr: 'Modifier l\'évaluation' },
  'reviews.person': { en: 'Person', fr: 'Personne' },
  'reviews.selectPerson': { en: 'Select a person', fr: 'Sélectionner une personne' },
  'reviews.periodLabel': { en: 'Period Label', fr: 'Libellé de la période' },
  'reviews.ratings': { en: 'Ratings (1-5)', fr: 'Évaluations (1-5)' },
  'reviews.overallRating': { en: 'Overall', fr: 'Général' },
  'reviews.spiritualHealth': { en: 'Spiritual Health', fr: 'Santé spirituelle' },
  'reviews.ministryEffectiveness': { en: 'Ministry Effectiveness', fr: 'Efficacité ministérielle' },
  'reviews.character': { en: 'Character', fr: 'Caractère' },
  'reviews.skills': { en: 'Skills', fr: 'Compétences' },
  'reviews.summaryEn': { en: 'Summary (English)', fr: 'Résumé (anglais)' },
  'reviews.summaryFr': { en: 'Summary (French)', fr: 'Résumé (français)' },
  'reviews.draft': { en: 'Draft', fr: 'Brouillon' },
  'reviews.finalized': { en: 'Finalized', fr: 'Finalisé' },
  'reviews.finalize': { en: 'Finalize', fr: 'Finaliser' },
  'reviews.unknownPerson': { en: 'Unknown', fr: 'Inconnu' },
  'reviews.noPeriod': { en: 'No period specified', fr: 'Aucune période spécifiée' },
  'reviews.reviewedBy': { en: 'Reviewed by', fr: 'Évalué par' },
  'reviews.noReviews': { en: 'No reviews found', fr: 'Aucune évaluation trouvée' },
  'reviews.deleteConfirm': { en: 'Delete Review?', fr: 'Supprimer l\'évaluation?' },
  'reviews.deleteWarning': { en: 'This action cannot be undone.', fr: 'Cette action est irréversible.' },
  'reviews.addReviewDescription': { en: 'Create a new performance review', fr: 'Créer une nouvelle évaluation' },
  'reviews.editReviewDescription': { en: 'Update review details', fr: 'Mettre à jour l\'évaluation' },
  
  // Surveys
  'surveys.title': { en: 'Pulse Surveys', fr: 'Sondages Pulse' },
  'surveys.subtitle': { en: 'Team health and engagement surveys', fr: 'Sondages sur la santé et l\'engagement de l\'équipe' },
  'surveys.addSurvey': { en: 'Create Survey', fr: 'Créer un sondage' },
  'surveys.editSurvey': { en: 'Edit Survey', fr: 'Modifier le sondage' },
  'surveys.search': { en: 'Search surveys...', fr: 'Rechercher des sondages...' },
  'surveys.surveyTitle': { en: 'Survey Title', fr: 'Titre du sondage' },
  'surveys.titlePlaceholder': { en: 'How are you feeling this week?', fr: 'Comment vous sentez-vous cette semaine?' },
  'surveys.targetGroup': { en: 'Target Group', fr: 'Groupe cible' },
  'surveys.allStaff': { en: 'All Staff', fr: 'Tout le personnel' },
  'surveys.allVolunteers': { en: 'All Volunteers', fr: 'Tous les bénévoles' },
  'surveys.custom': { en: 'Custom', fr: 'Personnalisé' },
  'surveys.isActive': { en: 'Active', fr: 'Actif' },
  'surveys.active': { en: 'Active', fr: 'Actif' },
  'surveys.inactive': { en: 'Inactive', fr: 'Inactif' },
  'surveys.responses': { en: 'responses', fr: 'réponses' },
  'surveys.created': { en: 'Created', fr: 'Créé' },
  'surveys.noSurveys': { en: 'No surveys found', fr: 'Aucun sondage trouvé' },
  'surveys.noDescription': { en: 'No description', fr: 'Aucune description' },
  'surveys.deleteConfirm': { en: 'Delete Survey?', fr: 'Supprimer le sondage?' },
  'surveys.deleteWarning': { en: 'This will delete all responses. This action cannot be undone.', fr: 'Cela supprimera toutes les réponses. Cette action est irréversible.' },
  'surveys.addSurveyDescription': { en: 'Create a new pulse survey', fr: 'Créer un nouveau sondage' },
  'surveys.editSurveyDescription': { en: 'Update survey details', fr: 'Mettre à jour le sondage' },
  'surveys.visibleToRoles': { en: 'Visible to Roles', fr: 'Visible par les rôles' },
  'surveys.visibleToRolesHint': { en: 'Leave empty to make visible to all authenticated users', fr: 'Laisser vide pour rendre visible à tous les utilisateurs authentifiés' },
  'surveys.allUsers': { en: 'All Users', fr: 'Tous les utilisateurs' },
  'surveys.roleRestricted': { en: 'Role Restricted', fr: 'Restreint par rôle' },
  
  // Role names for display
  'roles.super_admin': { en: 'Super Admin', fr: 'Super Admin' },
  'roles.admin': { en: 'Admin', fr: 'Admin' },
  'roles.pastor_supervisor': { en: 'Supervisor', fr: 'Superviseur' },
  'roles.staff': { en: 'Staff', fr: 'Personnel' },
  'roles.volunteer': { en: 'Volunteer', fr: 'Bénévole' },
  
  // Profile
  'profile.title': { en: 'My Profile', fr: 'Mon Profil' },
  'profile.subtitle': { en: 'Manage your personal information and preferences', fr: 'Gérez vos informations personnelles et préférences' },
  'profile.personalInfo': { en: 'Personal Information', fr: 'Informations personnelles' },
  'profile.personalInfoDescription': { en: 'Update your personal details', fr: 'Mettre à jour vos informations personnelles' },
  'profile.firstName': { en: 'First Name', fr: 'Prénom' },
  'profile.lastName': { en: 'Last Name', fr: 'Nom de famille' },
  'profile.preferredName': { en: 'Preferred Name', fr: 'Nom préféré' },
  'profile.preferredNamePlaceholder': { en: 'How you prefer to be called', fr: 'Comment vous préférez être appelé' },
  'profile.calling': { en: 'Calling / Ministry Vision', fr: 'Appel / Vision ministérielle' },
  'profile.callingPlaceholder': { en: 'Describe your sense of calling...', fr: 'Décrivez votre sens de l\'appel...' },
  'profile.strengths': { en: 'Strengths', fr: 'Forces' },
  'profile.strengthsPlaceholder': { en: 'Your key strengths...', fr: 'Vos principales forces...' },
  'profile.growthAreas': { en: 'Growth Areas', fr: 'Domaines de croissance' },
  'profile.growthAreasPlaceholder': { en: 'Areas you want to grow in...', fr: 'Domaines dans lesquels vous souhaitez grandir...' },
  'profile.language': { en: 'Language', fr: 'Langue' },
  'profile.languageDescription': { en: 'Choose your preferred language', fr: 'Choisissez votre langue préférée' },
  'profile.yourRoles': { en: 'Your Roles', fr: 'Vos Rôles' },
  'profile.rolesDescription': { en: 'Roles assigned to you in the system', fr: 'Rôles qui vous sont attribués dans le système' },
  'profile.noRoles': { en: 'No roles', fr: 'Aucun rôle' },
  'profile.noRolesDescription': { en: 'You have no roles assigned yet', fr: 'Vous n\'avez pas encore de rôles attribués' },
  'profile.noPersonLinked': { en: 'Your account is not linked to a person record', fr: 'Votre compte n\'est pas lié à un dossier de personne' },
  'profile.contactAdmin': { en: 'Contact an administrator to link your account', fr: 'Contactez un administrateur pour lier votre compte' },
  'profile.saved': { en: 'Profile saved', fr: 'Profil enregistré' },
  'profile.savedDescription': { en: 'Your changes have been saved', fr: 'Vos modifications ont été enregistrées' },
  'profile.error': { en: 'Error', fr: 'Erreur' },
  'profile.role.super_admin': { en: 'Full system access and configuration', fr: 'Accès complet au système et configuration' },
  'profile.role.admin': { en: 'Manage users, roles, and settings', fr: 'Gérer les utilisateurs, rôles et paramètres' },
  'profile.role.pastor_supervisor': { en: 'Supervise team members and ministries', fr: 'Superviser les membres de l\'équipe et les ministères' },
  'profile.role.staff': { en: 'Staff member access', fr: 'Accès membre du personnel' },
  'profile.role.volunteer': { en: 'Volunteer access', fr: 'Accès bénévole' },
  'profile.changePassword': { en: 'Change Password', fr: 'Changer le mot de passe' },
  'profile.changePasswordDescription': { en: 'Update your account password', fr: 'Mettre à jour le mot de passe de votre compte' },
  'profile.newPassword': { en: 'New Password', fr: 'Nouveau mot de passe' },
  'profile.confirmPassword': { en: 'Confirm Password', fr: 'Confirmer le mot de passe' },
  'profile.updatePassword': { en: 'Update Password', fr: 'Mettre à jour le mot de passe' },
  'profile.passwordUpdated': { en: 'Password updated successfully', fr: 'Mot de passe mis à jour avec succès' },
  'profile.passwordTooShort': { en: 'Password must be at least 6 characters', fr: 'Le mot de passe doit contenir au moins 6 caractères' },
  'profile.passwordsMismatch': { en: 'Passwords do not match', fr: 'Les mots de passe ne correspondent pas' },
  
  // Admin
  'admin.title': { en: 'Administration', fr: 'Administration' },
  'admin.subtitle': { en: 'System settings and user management', fr: 'Paramètres système et gestion des utilisateurs' },
  'admin.users': { en: 'Users', fr: 'Utilisateurs' },
  'admin.roles': { en: 'Roles', fr: 'Rôles' },
  'admin.ministries': { en: 'Ministries', fr: 'Ministères' },
  'admin.courses': { en: 'Courses', fr: 'Formations' },
  'admin.user': { en: 'User', fr: 'Utilisateur' },
  'admin.joined': { en: 'Joined', fr: 'Inscrit' },
  'admin.status': { en: 'Status', fr: 'Statut' },
  'admin.manageRoles': { en: 'Manage Roles', fr: 'Gérer les rôles' },
  'admin.manageRolesFor': { en: 'Manage roles for', fr: 'Gérer les rôles pour' },
  'admin.noRolesAssigned': { en: 'No roles assigned', fr: 'Aucun rôle attribué' },
  'admin.noRoles': { en: 'No roles', fr: 'Aucun rôle' },
  'admin.linkPerson': { en: 'Link Person', fr: 'Lier une personne' },
  'admin.linkPersonTo': { en: 'Link a person record to', fr: 'Lier un dossier de personne à' },
  'admin.notLinked': { en: 'Not linked to a person', fr: 'Non lié à une personne' },
  'admin.noPeopleAvailable': { en: 'No people available to link', fr: 'Aucune personne disponible à lier' },
  'admin.activeUsers': { en: 'Active Users', fr: 'Utilisateurs actifs' },
  'admin.systemRoles': { en: 'System Roles', fr: 'Rôles système' },
  'admin.unlinkedUsers': { en: 'Unlinked Users', fr: 'Utilisateurs non liés' },
  'admin.userManagement': { en: 'User Management', fr: 'Gestion des utilisateurs' },
  'admin.roleManagement': { en: 'Role Management', fr: 'Gestion des rôles' },
  'admin.systemSettings': { en: 'System Settings', fr: 'Paramètres système' },
  'admin.searchUsers': { en: 'Search users...', fr: 'Rechercher des utilisateurs...' },
  'admin.noUsersFound': { en: 'No users found', fr: 'Aucun utilisateur trouvé' },
  'admin.rolesDescription': { en: 'System roles define what users can access and manage', fr: 'Les rôles système définissent ce que les utilisateurs peuvent accéder et gérer' },
  'admin.noDescription': { en: 'No description', fr: 'Aucune description' },
  'admin.usersWithRole': { en: 'users', fr: 'utilisateurs' },
  'admin.settingsDescription': { en: 'Configure system-wide settings', fr: 'Configurer les paramètres système' },
  'admin.defaultLanguage': { en: 'Default Language', fr: 'Langue par défaut' },
  'admin.defaultLanguageDescription': { en: 'Default language for new users', fr: 'Langue par défaut pour les nouveaux utilisateurs' },
  'admin.emailConfirmation': { en: 'Email Confirmation', fr: 'Confirmation par courriel' },
  'admin.emailConfirmationDescription': { en: 'Require email confirmation for new signups', fr: 'Exiger la confirmation par courriel pour les nouvelles inscriptions' },
  'admin.signupEnabled': { en: 'Signup Enabled', fr: 'Inscription activée' },
  'admin.signupEnabledDescription': { en: 'Allow new users to create accounts', fr: 'Permettre aux nouveaux utilisateurs de créer des comptes' },
  
  // Settings
  'settings.title': { en: 'Settings', fr: 'Paramètres' },
  'settings.basicInfo': { en: 'Basic Information', fr: 'Informations de base' },
  'settings.campuses': { en: 'Campuses', fr: 'Campus' },
  'settings.email': { en: 'Email Preferences', fr: 'Préférences de courriel' },
  'settings.branding': { en: 'Branding', fr: 'Image de marque' },
  'admin.enabled': { en: 'Enabled', fr: 'Activé' },
  'admin.disabled': { en: 'Disabled', fr: 'Désactivé' },
  
  // Notifications
  'notifications.title': { en: 'Notifications', fr: 'Notifications' },
  'notifications.empty': { en: 'No notifications', fr: 'Aucune notification' },
  'notifications.markAllRead': { en: 'Mark all read', fr: 'Tout marquer comme lu' },
  'notifications.clearAll': { en: 'Clear all', fr: 'Tout effacer' },
  'notifications.courseDeadline': { en: 'Course Deadline', fr: 'Échéance de formation' },
  'notifications.newAssignment': { en: 'New Assignment', fr: 'Nouvelle affectation' },
  'notifications.meetingReminder': { en: 'Meeting Reminder', fr: 'Rappel de réunion' },
  
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
  'common.close': { en: 'Close', fr: 'Fermer' },
  'common.none': { en: 'None', fr: 'Aucun' },
  'common.saving': { en: 'Saving...', fr: 'Enregistrement...' },
  'common.back': { en: 'Back', fr: 'Retour' },
  'common.confirmDelete': { en: 'Confirm Delete', fr: 'Confirmer la suppression' },
  
  // Calendar & Events
  'calendar.quarters': { en: 'Quarters', fr: 'Trimestres' },
  'calendar.quartersDescription': { en: 'Manage quarterly themes and planning', fr: 'Gérer les thèmes et la planification trimestriels' },
  'calendar.addQuarter': { en: 'Add Quarter', fr: 'Ajouter un trimestre' },
  'calendar.editQuarter': { en: 'Edit Quarter', fr: 'Modifier le trimestre' },
  'calendar.year': { en: 'Year', fr: 'Année' },
  'calendar.quarterNumber': { en: 'Quarter', fr: 'Trimestre' },
  'calendar.startDate': { en: 'Start Date', fr: 'Date de début' },
  'calendar.endDate': { en: 'End Date', fr: 'Date de fin' },
  'calendar.themeEnglish': { en: 'Theme (English)', fr: 'Thème (anglais)' },
  'calendar.themeFrench': { en: 'Theme (French)', fr: 'Thème (français)' },
  'calendar.descriptionEnglish': { en: 'Description (English)', fr: 'Description (anglais)' },
  'calendar.descriptionFrench': { en: 'Description (French)', fr: 'Description (français)' },
  'calendar.noQuarters': { en: 'No quarters found', fr: 'Aucun trimestre trouvé' },
  'calendar.noQuartersDescription': { en: 'Create your first quarter to start planning', fr: 'Créez votre premier trimestre pour commencer la planification' },
  'calendar.quarterNotFound': { en: 'Quarter not found', fr: 'Trimestre non trouvé' },
  'calendar.deleteQuarterWarning': { en: 'This will permanently delete this quarter and cannot be undone.', fr: 'Cela supprimera définitivement ce trimestre et ne peut pas être annulé.' },
  
  'calendar.programs': { en: 'Programs', fr: 'Programmes' },
  'calendar.programsDescription': { en: 'Manage major event series and programs', fr: 'Gérer les grandes séries d\'événements et programmes' },
  'calendar.addProgram': { en: 'Add Program', fr: 'Ajouter un programme' },
  'calendar.editProgram': { en: 'Edit Program', fr: 'Modifier le programme' },
  'calendar.programCode': { en: 'Code', fr: 'Code' },
  'calendar.primaryLanguage': { en: 'Primary Language', fr: 'Langue principale' },
  'calendar.nameEnglish': { en: 'Name (English)', fr: 'Nom (anglais)' },
  'calendar.nameFrench': { en: 'Name (French)', fr: 'Nom (français)' },
  'calendar.quarter': { en: 'Quarter', fr: 'Trimestre' },
  'calendar.selectQuarter': { en: 'Select quarter', fr: 'Sélectionner le trimestre' },
  'calendar.ministry': { en: 'Ministry', fr: 'Ministère' },
  'calendar.selectMinistry': { en: 'Select ministry', fr: 'Sélectionner le ministère' },
  'calendar.noPrograms': { en: 'No programs found', fr: 'Aucun programme trouvé' },
  'calendar.noProgramsDescription': { en: 'Create your first program to organize events', fr: 'Créez votre premier programme pour organiser des événements' },
  'calendar.allQuarters': { en: 'All Quarters', fr: 'Tous les trimestres' },
  'calendar.managePrograms': { en: 'Manage Programs', fr: 'Gérer les programmes' },
  'calendar.noProgramsInQuarter': { en: 'No programs in this quarter', fr: 'Aucun programme dans ce trimestre' },
  'calendar.deleteProgramWarning': { en: 'This will permanently delete this program.', fr: 'Cela supprimera définitivement ce programme.' },
  
  'calendar.events': { en: 'Events', fr: 'Événements' },
  'calendar.eventsCalendar': { en: 'Events Calendar', fr: 'Calendrier des événements' },
  'calendar.eventsCalendarDescription': { en: 'View and manage all events', fr: 'Voir et gérer tous les événements' },
  'calendar.addEvent': { en: 'Add Event', fr: 'Ajouter un événement' },
  'calendar.newEvent': { en: 'New Event', fr: 'Nouvel événement' },
  'calendar.editEvent': { en: 'Edit Event', fr: 'Modifier l\'événement' },
  'calendar.createEventDescription': { en: 'Create a new event', fr: 'Créer un nouvel événement' },
  'calendar.eventNotFound': { en: 'Event not found', fr: 'Événement non trouvé' },
  'calendar.deleteEventWarning': { en: 'This will permanently delete this event.', fr: 'Cela supprimera définitivement cet événement.' },
  'calendar.noEventsInQuarter': { en: 'No events in this quarter', fr: 'Aucun événement dans ce trimestre' },
  'calendar.noEvents': { en: 'No events found', fr: 'Aucun événement trouvé' },
  'calendar.noEventsDescription': { en: 'No events match your current filters.', fr: 'Aucun événement ne correspond à vos filtres actuels.' },
  
  'calendar.allMinistries': { en: 'All Ministries', fr: 'Tous les ministères' },
  'calendar.allPrograms': { en: 'All Programs', fr: 'Tous les programmes' },
  'calendar.allCategories': { en: 'All Categories', fr: 'Toutes les catégories' },
  'calendar.allLanguages': { en: 'All Languages', fr: 'Toutes les langues' },
  'calendar.allStatus': { en: 'All Status', fr: 'Tous les statuts' },
  'calendar.today': { en: 'Today', fr: 'Aujourd\'hui' },
  
  'calendar.planned': { en: 'Planned', fr: 'Planifié' },
  'calendar.confirmed': { en: 'Confirmed', fr: 'Confirmé' },
  'calendar.completed': { en: 'Completed', fr: 'Terminé' },
  'calendar.canceled': { en: 'Canceled', fr: 'Annulé' },
  
  'calendar.details': { en: 'Details', fr: 'Détails' },
  'calendar.allDay': { en: 'All Day', fr: 'Toute la journée' },
  'calendar.progress': { en: 'Progress', fr: 'Progrès' },
  'calendar.markComplete': { en: 'Mark Complete', fr: 'Marquer comme terminé' },
  'calendar.internalNotes': { en: 'Internal Notes', fr: 'Notes internes' },
  'calendar.internalNotesPlaceholder': { en: 'Notes visible only to admins and ministry leaders', fr: 'Notes visibles uniquement par les administrateurs et responsables de ministère' },
  
  'calendar.teamAssignments': { en: 'Team Assignments', fr: 'Affectations d\'équipe' },
  'calendar.addAssignment': { en: 'Add Assignment', fr: 'Ajouter une affectation' },
  'calendar.noAssignments': { en: 'No team assignments yet', fr: 'Aucune affectation d\'équipe' },
  'calendar.person': { en: 'Person', fr: 'Personne' },
  'calendar.selectPerson': { en: 'Select person', fr: 'Sélectionner la personne' },
  'calendar.role': { en: 'Role', fr: 'Rôle' },
  'calendar.selectRole': { en: 'Select role', fr: 'Sélectionner le rôle' },
  'calendar.fromCountry': { en: 'From Country', fr: 'Pays d\'origine' },
  'calendar.notes': { en: 'Notes', fr: 'Notes' },
  
  'calendar.relatedGoals': { en: 'Related Goals', fr: 'Objectifs liés' },
  'calendar.linkGoal': { en: 'Link Goal', fr: 'Lier un objectif' },
  'calendar.link': { en: 'Link', fr: 'Lier' },
  'calendar.noLinkedGoals': { en: 'No linked goals', fr: 'Aucun objectif lié' },
  'calendar.noAvailableGoals': { en: 'No available goals to link', fr: 'Aucun objectif disponible à lier' },
  
  'calendar.relatedCourse': { en: 'Related Course', fr: 'Formation liée' },
  'calendar.selectCourse': { en: 'Select course', fr: 'Sélectionner la formation' },
  
  'calendar.basicInfo': { en: 'Basic Information', fr: 'Informations de base' },
  'calendar.organization': { en: 'Organization', fr: 'Organisation' },
  'calendar.descriptions': { en: 'Descriptions', fr: 'Descriptions' },
  'calendar.titleEnglish': { en: 'Title (English)', fr: 'Titre (anglais)' },
  'calendar.titleFrench': { en: 'Title (French)', fr: 'Titre (français)' },
  'calendar.date': { en: 'Date', fr: 'Date' },
  'calendar.language': { en: 'Language', fr: 'Langue' },
  'calendar.bilingual': { en: 'Bilingual', fr: 'Bilingue' },
  'calendar.startTime': { en: 'Start Time', fr: 'Heure de début' },
  'calendar.endTime': { en: 'End Time', fr: 'Heure de fin' },
  'calendar.location': { en: 'Location', fr: 'Lieu' },
  'calendar.status': { en: 'Status', fr: 'Statut' },
  'calendar.completionPercentage': { en: 'Completion %', fr: '% achèvement' },
  'calendar.recurrence': { en: 'Recurrence', fr: 'Récurrence' },
  'calendar.endsNextDay': { en: '↪ Ends next day', fr: '↪ Se termine le lendemain' },
  'calendar.postponed': { en: 'Postponed', fr: 'Reporté' },
  
  // Recurrence system
  'calendar.frequency': { en: 'Frequency', fr: 'Fréquence' },
  'calendar.daily': { en: 'Daily', fr: 'Quotidien' },
  'calendar.weekly': { en: 'Weekly', fr: 'Hebdomadaire' },
  'calendar.monthly': { en: 'Monthly', fr: 'Mensuel' },
  'calendar.yearly': { en: 'Yearly', fr: 'Annuel' },
  'calendar.repeatEvery': { en: 'Repeat every', fr: 'Répéter tous les' },
  'calendar.days': { en: 'day(s)', fr: 'jour(s)' },
  'calendar.weeks': { en: 'week(s)', fr: 'semaine(s)' },
  'calendar.months': { en: 'month(s)', fr: 'mois' },
  'calendar.years': { en: 'year(s)', fr: 'an(s)' },
  'calendar.onDays': { en: 'On days', fr: 'Les jours' },
  'calendar.monthlyOn': { en: 'Monthly on', fr: 'Mensuel le' },
  'calendar.dayOfMonth': { en: 'Day of month', fr: 'Jour du mois' },
  'calendar.nthWeekday': { en: 'Nth weekday', fr: 'Nième jour de la semaine' },
  'calendar.onDay': { en: 'On day', fr: 'Le jour' },
  'calendar.endCondition': { en: 'Ends', fr: 'Se termine' },
  'calendar.never': { en: 'Never', fr: 'Jamais' },
  'calendar.afterOccurrences': { en: 'After N occurrences', fr: 'Après N occurrences' },
  'calendar.untilDate': { en: 'Until date', fr: 'Jusqu\'à la date' },
  'calendar.occurrences': { en: 'Occurrences', fr: 'Occurrences' },
  'calendar.pickDate': { en: 'Pick a date', fr: 'Choisir une date' },
  'calendar.editRecurringEvent': { en: 'Edit Recurring Event', fr: 'Modifier l\'événement récurrent' },
  'calendar.deleteRecurringEvent': { en: 'Delete Recurring Event', fr: 'Supprimer l\'événement récurrent' },
  'calendar.editScopeDescription': { en: 'How would you like to apply this change?', fr: 'Comment souhaitez-vous appliquer cette modification ?' },
  'calendar.deleteScopeDescription': { en: 'Which events would you like to delete?', fr: 'Quels événements souhaitez-vous supprimer ?' },
  'calendar.thisEventOnly': { en: 'This event only', fr: 'Cet événement uniquement' },
  'calendar.thisAndFuture': { en: 'This and all future events', fr: 'Cet événement et tous les suivants' },
  'calendar.allInSeries': { en: 'All events in the series', fr: 'Tous les événements de la série' },
  'calendar.recurring': { en: 'Recurring', fr: 'Récurrent' },
  'calendar.partOfSeries': { en: 'Part of series', fr: 'Fait partie d\'une série' },
  'calendar.program': { en: 'Program', fr: 'Programme' },
  'calendar.selectProgram': { en: 'Select program', fr: 'Sélectionner le programme' },
  'calendar.category': { en: 'Activity Category', fr: 'Catégorie d\'activité' },
  'calendar.selectCategory': { en: 'Select category', fr: 'Sélectionner la catégorie' },
  'calendar.saveAndNew': { en: 'Save & Add Another', fr: 'Enregistrer et ajouter' },
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
    const saved = localStorage.getItem('xpandify-language');
    return (saved === 'fr' ? 'fr' : 'en') as Language;
  });

  useEffect(() => {
    localStorage.setItem('xpandify-language', language);
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
