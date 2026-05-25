-- Supprimer toutes les formations "Module" existantes pour repartir propre
DELETE FROM formations 
WHERE titre LIKE 'Module%' AND categorie = 'etudiant';

-- Réinsérer uniquement les 10 modules visibles sur les images
WITH pays_cible AS (
    SELECT id_pays
    FROM pays
    ORDER BY id_pays
    LIMIT 1
)
INSERT INTO formations (
    id_formation,
    titre,
    description,
    duree,
    prix,
    categorie,
    date_debut,
    places_disponibles,
    benefices,
    id_pays,
    created_at,
    updated_at
)
SELECT
    v.id_formation,
    v.titre,
    v.description,
    v.duree,
    v.prix,
    v.categorie,
    v.date_debut,
    v.places_disponibles,
    v.benefices,
    pc.id_pays,
    v.created_at,
    v.updated_at
FROM (
    VALUES
    (gen_random_uuid(), $$Module Logiciel : Comptabilité, États Financiers, Immobilisations$$, $$Formation sur l'utilisation d'un logiciel pour la comptabilité, les états financiers et la gestion des immobilisations. Prérequis: connaissances de base en comptabilité. Public: comptables, gestionnaires financiers, auditeurs, responsables administratifs et chefs d'entreprise. Certification: attestation de participation remise par ISD Groupe.$$, 48, 65000.00, $$etudiant$$, '2026-02-01'::date, 25, $$["Maîtriser l'utilisation d'un logiciel comptable","Produire et analyser les états financiers","Gérer efficacement les immobilisations","Assurer la conformité légale et réglementaire","Optimiser la performance comptable et financière"]$$::text, now(), now()),

    (gen_random_uuid(), $$Module Microsoft Avancé : Excel & PowerPoint$$, $$Formation avancée sur Microsoft Excel et PowerPoint pour optimiser l'analyse des données et la présentation visuelle. Prérequis: maîtrise des bases d'Excel et PowerPoint. Public: analystes, comptables, managers, étudiants et toute personne utilisant Excel et PowerPoint de manière professionnelle. Certification: attestation de participation remise par ISD Groupe.$$, 48, 50000.00, $$etudiant$$, '2026-03-08'::date, 25, $$["Maîtriser les fonctions avancées d'Excel","Utiliser les tableaux croisés dynamiques et macros","Créer des présentations PowerPoint professionnelles","Optimiser l'analyse et la communication des données","Gagner en efficacité et productivité"]$$::text, now(), now()),

    (gen_random_uuid(), $$Module Logiciel : Hôtellerie & Restauration$$, $$Formation sur l'utilisation d'un logiciel de gestion pour l'hôtellerie et la restauration afin d'optimiser les opérations et la satisfaction client. Prérequis: connaissances de base en gestion ou comptabilité. Public: responsables hôteliers, restaurateurs, gestionnaires de stock et comptables. Certification: attestation de participation remise par ISD Groupe.$$, 48, 200000.00, $$etudiant$$, '2026-02-22'::date, 25, $$["Maîtriser la gestion des réservations et facturations","Optimiser la gestion des stocks et approvisionnements","Améliorer la relation client et la fidélisation","Produire des rapports de suivi et d'analyse","Gagner en efficacité et rentabilité"]$$::text, now(), now()),

    (gen_random_uuid(), $$Module Logiciel : Paie & Ressources Humaines$$, $$Formation sur l'utilisation d'un logiciel de gestion de la paie et des ressources humaines pour optimiser les processus RH. Prérequis: connaissances de base en gestion ou comptabilité. Public: responsables RH, gestionnaires de paie, comptables et chefs d'entreprise. Certification: attestation de participation remise par ISD Groupe.$$, 48, 100000.00, $$etudiant$$, '2026-03-01'::date, 25, $$["Maîtriser l'utilisation d'un logiciel de paie","Gérer efficacement les bulletins de salaire","Assurer la conformité légale et réglementaire","Produire des rapports RH et d'analyse","Optimiser la gestion des ressources humaines"]$$::text, now(), now()),

    (gen_random_uuid(), $$Module Logiciel : Gestion Commerciale & Stock$$, $$Formation sur l'utilisation d'un logiciel de gestion commerciale et de stock pour optimiser les ventes et la logistique. Prérequis: connaissances de base en gestion ou comptabilité. Public: commerciaux, gestionnaires de stock, responsables logistiques, comptables et chefs d'entreprise. Certification: attestation de participation remise par ISD Groupe.$$, 48, 50000.00, $$etudiant$$, '2026-02-08'::date, 25, $$["Maîtriser l'utilisation d'un logiciel de gestion commerciale","Gérer efficacement les stocks et les ventes","Produire des rapports de suivi et d'analyse","Optimiser la logistique et la performance commerciale","Assurer la conformité et la traçabilité des opérations"]$$::text, now(), now()),

    (gen_random_uuid(), $$Module Infographie : Photoshop, InDesign, Illustrator$$, $$Formation sur l'utilisation des logiciels Photoshop, InDesign et Illustrator pour créer des visuels professionnels. Prérequis: connaissances de base en informatique. Public: graphistes débutants, créateurs de contenu, responsables communication et étudiants. Certification: attestation de participation remise par ISD Groupe.$$, 120, 100000.00, $$etudiant$$, '2026-03-15'::date, 25, $$["Maîtriser les bases de Photoshop, InDesign et Illustrator","Créer des visuels graphiques et maquettes","Optimiser la communication visuelle","Développer des compétences en design et infographie","Produire des supports professionnels adaptés"]$$::text, now(), now()),

    (gen_random_uuid(), $$Module Multimédia$$, $$Formation sur les outils multimédias pour créer et gérer des contenus audio, vidéo et interactifs. Prérequis: connaissances de base en informatique. Public: créateurs de contenu, responsables communication, étudiants et toute personne souhaitant développer des compétences multimédias. Certification: attestation de participation remise par ISD Groupe.$$, 120, 200000.00, $$etudiant$$, '2026-03-22'::date, 25, $$["Comprendre les bases du multimédia","Créer et éditer des contenus audio et vidéo","Utiliser des outils interactifs pour la communication","Optimiser la diffusion des contenus","Développer des compétences créatives et techniques"]$$::text, now(), now()),

    (gen_random_uuid(), $$Module Sécurité : Formation en Vidéo Surveillance$$, $$Formation sur l'installation et la gestion de systèmes de vidéo surveillance pour renforcer la sécurité. Prérequis: connaissances de base en informatique ou électronique. Public: techniciens, responsables sécurité, gestionnaires d'infrastructures et étudiants. Certification: attestation de participation remise par ISD Groupe.$$, 120, 200000.00, $$etudiant$$, '2026-04-05'::date, 25, $$["Comprendre les principes de la vidéo surveillance","Installer et configurer des systèmes de sécurité","Assurer la maintenance et le suivi","Optimiser la protection des biens et personnes","Développer des compétences techniques en sécurité"]$$::text, now(), now()),

    (gen_random_uuid(), $$Module Web : Conception de Site WordPress$$, $$Formation sur la conception et la gestion de sites web avec WordPress. Prérequis: connaissances de base en informatique. Public: entrepreneurs, responsables communication, créateurs de contenu et étudiants. Certification: attestation de participation remise par ISD Groupe.$$, 120, 100000.00, $$etudiant$$, '2026-03-29'::date, 25, $$["Maîtriser la création de sites WordPress","Personnaliser thèmes et plugins","Optimiser la gestion de contenu","Améliorer la visibilité et le référencement","Développer des compétences en gestion web"]$$::text, now(), now()),

    (gen_random_uuid(), $$Module SYSCOHADA Révisé$$, $$Formation sur l'application du SYSCOHADA révisé pour une organisation comptable conforme et efficace. Prérequis: connaissances de base en comptabilité. Public: comptables, gestionnaires financiers, auditeurs et responsables administratifs. Certification: attestation de participation remise par ISD Groupe.$$, 48, 250000.00, $$etudiant$$, '2026-03-01'::date, 25, $$["Comprendre les principes du SYSCOHADA révisé","Mettre en place une organisation comptable conforme","Produire et analyser les états financiers","Assurer la conformité légale et réglementaire","Optimiser la performance comptable et financière"]$$::text, now(), now())

) AS v(
    id_formation,
    titre,
    description,
    duree,
    prix,
    categorie,
    date_debut,
    places_disponibles,
    benefices,
    created_at,
    updated_at
)
CROSS JOIN pays_cible pc
ON CONFLICT (titre, categorie) DO UPDATE SET
    description = EXCLUDED.description,
    duree = EXCLUDED.duree,
    prix = EXCLUDED.prix,
    date_debut = EXCLUDED.date_debut,
    places_disponibles = EXCLUDED.places_disponibles,
    benefices = EXCLUDED.benefices,
    id_pays = EXCLUDED.id_pays,
    updated_at = NOW();