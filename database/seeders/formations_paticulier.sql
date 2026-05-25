-- Supprimer toutes les formations "Module" existantes pour repartir propre
DELETE FROM formations 
WHERE titre LIKE 'Module%' 
AND categorie = 'particulier';

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

    (gen_random_uuid(),
    $$Module Logiciel : Comptabilité, États Financiers, Immobilisations$$,
    $$Formation sur l'utilisation d'un logiciel pour la comptabilité, les états financiers et la gestion des immobilisations.$$,
    48,
    65000.00,
    $$particulier$$,
    '2026-02-01'::date,
    25,
    $$["Maîtriser un logiciel comptable","Produire des états financiers","Gérer les immobilisations"]$$::text,
    now(),
    now()),

    (gen_random_uuid(),
    $$Module Microsoft Avancé : Excel & PowerPoint$$,
    $$Formation avancée sur Microsoft Excel et PowerPoint.$$,
    48,
    50000.00,
    $$particulier$$,
    '2026-03-08'::date,
    25,
    $$["Fonctions avancées Excel","Tableaux croisés dynamiques","Présentations PowerPoint professionnelles"]$$::text,
    now(),
    now()),

    (gen_random_uuid(),
    $$Module Logiciel : Hôtellerie & Restauration$$,
    $$Formation sur les logiciels de gestion hôtelière et restauration.$$,
    48,
    200000.00,
    $$particulier$$,
    '2026-02-22'::date,
    25,
    $$["Gestion des réservations","Gestion des stocks","Rapports d'analyse"]$$::text,
    now(),
    now()),

    (gen_random_uuid(),
    $$Module Logiciel : Paie & Ressources Humaines$$,
    $$Formation sur les logiciels RH et paie.$$,
    48,
    100000.00,
    $$particulier$$,
    '2026-03-01'::date,
    25,
    $$["Gestion de la paie","Bulletins de salaire","Gestion RH"]$$::text,
    now(),
    now()),

    (gen_random_uuid(),
    $$Module Logiciel : Gestion Commerciale & Stock$$,
    $$Formation sur la gestion commerciale et des stocks.$$,
    48,
    50000.00,
    $$particulier$$,
    '2026-02-08'::date,
    25,
    $$["Gestion des ventes","Gestion des stocks","Suivi commercial"]$$::text,
    now(),
    now()),

    (gen_random_uuid(),
    $$Module Infographie : Photoshop, InDesign, Illustrator$$,
    $$Formation sur les outils Adobe de création graphique.$$,
    120,
    100000.00,
    $$particulier$$,
    '2026-03-15'::date,
    25,
    $$["Photoshop","Illustrator","InDesign"]$$::text,
    now(),
    now()),

    (gen_random_uuid(),
    $$Module Multimédia$$,
    $$Formation multimédia audio, vidéo et contenus interactifs.$$,
    120,
    200000.00,
    $$particulier$$,
    '2026-03-22'::date,
    25,
    $$["Montage vidéo","Audio","Création multimédia"]$$::text,
    now(),
    now()),

    (gen_random_uuid(),
    $$Module Sécurité : Formation en Vidéo Surveillance$$,
    $$Formation sur les systèmes de vidéo surveillance.$$,
    120,
    200000.00,
    $$particulier$$,
    '2026-04-05'::date,
    25,
    $$["Installation caméras","Configuration sécurité","Maintenance"]$$::text,
    now(),
    now()),

    (gen_random_uuid(),
    $$Module Web : Conception de Site WordPress$$,
    $$Formation WordPress pour création de sites web.$$,
    120,
    100000.00,
    $$particulier$$,
    '2026-03-29'::date,
    25,
    $$["Création WordPress","Plugins","SEO"]$$::text,
    now(),
    now()),

    (gen_random_uuid(),
    $$Module SYSCOHADA Révisé$$,
    $$Formation sur le SYSCOHADA révisé.$$,
    48,
    250000.00,
    $$particulier$$,
    '2026-03-01'::date,
    25,
    $$["SYSCOHADA","États financiers","Organisation comptable"]$$::text,
    now(),
    now())

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