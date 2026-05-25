-- ============================================================
-- Insertion des images de formations et catégories
-- Source : public/uploads/formations/ et public/uploads/categories/
-- ============================================================

BEGIN;

DELETE FROM images WHERE imageable_type IN ('FORMATION', 'CATEGORY');

-- ============================================================
-- 1. Images des catégories (étudiant, particulier, entreprise)
-- ============================================================
INSERT INTO images (id_image, url, path, alt, imageable_type, imageable_id, created_at, updated_at)
VALUES
    (gen_random_uuid(), '/uploads/categories/gestion-projets.webp',    'uploads/categories/gestion-projets.webp',    'Formations pour étudiants - Préparez votre avenir professionnel',    'CATEGORY', NULL, now(), now()),
    (gen_random_uuid(), '/uploads/categories/leadership-rh.webp',      'uploads/categories/leadership-rh.webp',      'Formations pour particuliers - Développez vos compétences',          'CATEGORY', NULL, now(), now()),
    (gen_random_uuid(), '/uploads/categories/gestion-entreprise.webp', 'uploads/categories/gestion-entreprise.webp', 'Formations pour entreprises - Boostez vos équipes',                  'CATEGORY', NULL, now(), now());

-- ============================================================
-- 2. Images des formations
-- ============================================================
INSERT INTO images (id_image, url, path, alt, imageable_type, imageable_id, created_at, updated_at)
SELECT gen_random_uuid(), v.url, v.path, v.alt, 'FORMATION', f.id_formation, now(), now()
FROM (VALUES
    ('/uploads/formations/assistant-direction.webp',          'uploads/formations/assistant-direction.webp',          'Nouveaux enjeux de la fonction secrétaire/assistant'),
    ('/uploads/formations/big-data.webp',                    'uploads/formations/big-data.webp',                    'Concevoir et piloter un projet Big Data'),
    ('/uploads/formations/coaching-commercial.webp',          'uploads/formations/coaching-commercial.webp',          'Accompagnement commercial & coaching'),
    ('/uploads/formations/community-management.webp',         'uploads/formations/community-management.webp',         'ISDA Community Management'),
    ('/uploads/formations/comptabilite-gestion-projets.webp', 'uploads/formations/comptabilite-gestion-projets.webp', 'Organisation comptable et gestion de projets'),
    ('/uploads/formations/dev-application-api.webp',          'uploads/formations/dev-application-api.webp',          'Développement d''une application avancée avec API'),
    ('/uploads/formations/dev-application-debutant.webp',     'uploads/formations/dev-application-debutant.webp',     'Développement d''une application simple (Débutant)'),
    ('/uploads/formations/excel-avance.webp',                 'uploads/formations/excel-avance.webp',                 'Excel avancé niveau 1 & 2 (Septembre 2026)'),
    ('/uploads/formations/excel-pro.webp',                    'uploads/formations/excel-pro.webp',                    'Excel avancé niveau 1 & 2 (Mai 2026)'),
    ('/uploads/formations/gestion-entreprise.webp',           'uploads/formations/gestion-entreprise.webp',           'Organisation comptable et gestion des entreprises'),
    ('/uploads/formations/gestion-projets.webp',              'uploads/formations/gestion-projets.webp',              'Gestion des projets'),
    ('/uploads/formations/gpec.webp',                         'uploads/formations/gpec.webp',                         'Gestion prévisionnelle des emplois et compétences'),
    ('/uploads/formations/ia-organisation-commerciale.webp',  'uploads/formations/ia-organisation-commerciale.webp',  'Transformation de l''organisation commerciale par l''IA'),
    ('/uploads/formations/ia-performance-avance.webp',        'uploads/formations/ia-performance-avance.webp',        'Booster la performance commerciale avec l''IA (Décembre 2026)'),
    ('/uploads/formations/ia-performance-commerciale.webp',   'uploads/formations/ia-performance-commerciale.webp',   'Booster la performance commerciale avec l''IA (Janvier 2026)'),
    ('/uploads/formations/leadership-rh.webp',                'uploads/formations/leadership-rh.webp',                'Leadership & RH : Management d''équipe, résolution des conflits & motivation (Janvier 2026)'),
    ('/uploads/formations/leadership-rh-avance.webp',         'uploads/formations/leadership-rh-avance.webp',         'Leadership & RH : Management d''équipe, résolution des conflits & motivation (Décembre 2026)'),
    ('/uploads/formations/management-ia.webp',                'uploads/formations/management-ia.webp',                'Pratiques managériales avec IA (Août 2026)'),
    ('/uploads/formations/management-ia-avance.webp',         'uploads/formations/management-ia-avance.webp',         'Pratiques managériales avec IA (Décembre 2026)'),
    ('/uploads/formations/modernisation-rh.webp',             'uploads/formations/modernisation-rh.webp',             'Modernisation de la gestion des ressources humaines (Avril 2026)'),
    ('/uploads/formations/motivation-equipe-commerciale.webp','uploads/formations/motivation-equipe-commerciale.webp','Gestion commerciale : motivation de l''équipe'),
    ('/uploads/formations/motivation-equipes.webp',           'uploads/formations/motivation-equipes.webp',           'Motivation d''équipes'),
    ('/uploads/formations/negociation-vente.webp',            'uploads/formations/negociation-vente.webp',            'Techniques de vente & négociation commerciale'),
    ('/uploads/formations/paie-rh-logiciel.webp',             'uploads/formations/paie-rh-logiciel.webp',             'Gestion de la paie et des ressources humaines avec logiciel'),
    ('/uploads/formations/paie-rh.webp',                      'uploads/formations/paie-rh.webp',                      'Organisation de la paie et RH avec logiciel'),
    ('/uploads/formations/relance-commerciale.webp',          'uploads/formations/relance-commerciale.webp',          'Relance commerciale et recherche de nouveaux marchés (Janvier 2026)'),
    ('/uploads/formations/relance-hotellerie.webp',           'uploads/formations/relance-hotellerie.webp',           'Relance commerciale adaptée aux complexes hôteliers'),
    ('/uploads/formations/relance-marche.webp',               'uploads/formations/relance-marche.webp',               'Relance commerciale et recherche de nouveaux marchés (Novembre 2026)'),
    ('/uploads/formations/reseaux-sociaux-entreprise.webp',   'uploads/formations/reseaux-sociaux-entreprise.webp',   'Gestion & maîtrise des réseaux sociaux'),
    ('/uploads/formations/rh-ia.webp',                        'uploads/formations/rh-ia.webp',                        'Pratiques RH avec IA'),
    ('/uploads/formations/rh_modernisation.webp',             'uploads/formations/rh_modernisation.webp',             'Modernisation de la gestion des ressources humaines (Juillet 2026)'),
    ('/uploads/formations/secretariat-moderne.webp',          'uploads/formations/secretariat-moderne.webp',          'Management moderne & optimisation de la fonction secrétaire/assistant'),
    ('/uploads/formations/seo-referencement.webp',            'uploads/formations/seo-referencement.webp',            'Optimisation pour les moteurs de recherche (SEO)'),
    ('/uploads/formations/syscohada-avance.webp',             'uploads/formations/syscohada-avance.webp',             'Organisation administrative et comptable selon SYSCOHADA révisé (Septembre 2026)'),
    ('/uploads/formations/syscohada-comptabilite.webp',       'uploads/formations/syscohada-comptabilite.webp',       'Organisation administrative et comptable selon SYSCOHADA révisé (Mars 2026)'),
    ('/uploads/formations/telemarketing.webp',                'uploads/formations/telemarketing.webp',                'Formation en télémarketing'),
    ('/uploads/formations/ventes-ia.webp',                    'uploads/formations/ventes-ia.webp',                    'Augmenter les ventes grâce à l''IA'),
    ('/uploads/formations/ventes_ia.webp',                    'uploads/formations/ventes_ia.webp',                    'Augmenter ses ventes grâce à l''IA (Octobre 2026)'),
    ('/uploads/formations/ventes-ia-avance.webp',             'uploads/formations/ventes-ia-avance.webp',             'Augmenter ses ventes grâce à l''IA (Décembre 2026)')
) AS v(url, path, alt)
JOIN formations f ON f.id_formation = (
    SELECT id_formation FROM formations
    WHERE categorie = 'entreprise'
    AND titre ILIKE '%' || v.alt || '%'
    LIMIT 1
);

-- Modules double catégorie : ETUDIANT + PARTICULIER
INSERT INTO images (id_image, url, path, alt, imageable_type, imageable_id, created_at, updated_at)
SELECT gen_random_uuid(), v.url, v.path, v.alt, 'FORMATION', f.id_formation, now(), now()
FROM (VALUES
    ('/uploads/formations/hotellerie-restauration.webp',      'uploads/formations/hotellerie-restauration.webp',      'Module Logiciel : Hôtellerie & Restauration',        'etudiant'),
    ('/uploads/formations/paie-ressources-humaines.webp',     'uploads/formations/paie-ressources-humaines.webp',     'Module Logiciel : Paie & Ressources Humaines',       'etudiant'),
    ('/uploads/formations/gestion-commerciale-stock.webp',    'uploads/formations/gestion-commerciale-stock.webp',    'Module Logiciel : Gestion Commerciale & Stock',      'etudiant'),
    ('/uploads/formations/infographie.webp',                  'uploads/formations/infographie.webp',                  'Module Infographie : Photoshop, InDesign, Illustrator', 'etudiant'),
    ('/uploads/formations/multimedia.webp',                   'uploads/formations/multimedia.webp',                   'Module Multimédia',                                   'etudiant'),
    ('/uploads/formations/video-surveillance.webp',           'uploads/formations/video-surveillance.webp',           'Module Sécurité : Formation en Vidéo Surveillance',  'etudiant'),
    ('/uploads/formations/syscohada-revise.webp',             'uploads/formations/syscohada-revise.webp',             'Module SYSCOHADA Révisé',                            'etudiant'),
    ('/uploads/formations/comptabilite-immobilisations.webp', 'uploads/formations/comptabilite-immobilisations.webp', 'Module Logiciel : Comptabilité, États Financiers, Immobilisations', 'etudiant'),
    ('/uploads/formations/microsoft-avance.webp',             'uploads/formations/microsoft-avance.webp',             'Module Microsoft Avancé : Excel & PowerPoint',       'etudiant'),
    ('/uploads/formations/conception-site-web.webp',          'uploads/formations/conception-site-web.webp',          'Module Web : Conception de Site WordPress',          'etudiant'),
    ('/uploads/formations/hotellerie-restauration.webp',      'uploads/formations/hotellerie-restauration.webp',      'Module Logiciel : Hôtellerie & Restauration',        'particulier'),
    ('/uploads/formations/paie-ressources-humaines.webp',     'uploads/formations/paie-ressources-humaines.webp',     'Module Logiciel : Paie & Ressources Humaines',       'particulier'),
    ('/uploads/formations/gestion-commerciale-stock.webp',    'uploads/formations/gestion-commerciale-stock.webp',    'Module Logiciel : Gestion Commerciale & Stock',      'particulier'),
    ('/uploads/formations/infographie.webp',                  'uploads/formations/infographie.webp',                  'Module Infographie : Photoshop, InDesign, Illustrator', 'particulier'),
    ('/uploads/formations/multimedia.webp',                   'uploads/formations/multimedia.webp',                   'Module Multimédia',                                   'particulier'),
    ('/uploads/formations/video-surveillance.webp',           'uploads/formations/video-surveillance.webp',           'Module Sécurité : Formation en Vidéo Surveillance',  'particulier'),
    ('/uploads/formations/syscohada-revise.webp',             'uploads/formations/syscohada-revise.webp',             'Module SYSCOHADA Révisé',                            'particulier'),
    ('/uploads/formations/comptabilite-immobilisations.webp', 'uploads/formations/comptabilite-immobilisations.webp', 'Module Logiciel : Comptabilité, États Financiers, Immobilisations', 'particulier'),
    ('/uploads/formations/power point.webp',                  'uploads/formations/power point.webp',                  'Module Microsoft Avancé : Excel & PowerPoint',       'particulier'),
    ('/uploads/formations/web-wordpress.webp',                'uploads/formations/web-wordpress.webp',                'Module Web : Conception de Site WordPress',          'particulier')
) AS v(url, path, alt, categorie)
JOIN formations f ON f.id_formation = (
    SELECT id_formation FROM formations
    WHERE titre = v.alt AND categorie = v.categorie
    LIMIT 1
);

COMMIT;
