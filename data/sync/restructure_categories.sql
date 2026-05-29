-- ============================================================
-- Restructuration complète des catégories produits
-- Arborescence: Ingenierie, TPE, Drone comme parents
-- ============================================================
BEGIN;

-- ============================================================
-- PHASE 1: Préparer les catégories parentes existantes
-- ============================================================

-- Ingenierie → devient parent (display_mode = children, segment = general)
UPDATE categories_produits
SET display_mode = 'children', segment = 'general'
WHERE id_categorie = 'ca83f466-fff0-45b3-95d8-a2b81c765169';

-- TPE → devient parent (display_mode = children)
UPDATE categories_produits
SET display_mode = 'children', segment = 'general'
WHERE id_categorie = 'b7b0a350-cb6e-4312-b01f-e31f3912b2aa';

-- Drone → devient parent (display_mode = children)
UPDATE categories_produits
SET display_mode = 'children', segment = 'general'
WHERE id_categorie = '8d0dcaa6-0730-4aa2-ab3a-843569a4e3a3';

-- Incendie → devient sous-parent d'Ingenierie
UPDATE categories_produits
SET display_mode = 'children',
    segment = 'general',
    parent_id = 'ca83f466-fff0-45b3-95d8-a2b81c765169'
WHERE id_categorie = '2683926a-7140-477b-b099-2e725eea8418';

-- Energie → devient sous-parent d'Ingenierie
UPDATE categories_produits
SET display_mode = 'children',
    segment = 'general',
    parent_id = 'ca83f466-fff0-45b3-95d8-a2b81c765169'
WHERE id_categorie = 'af08a91c-8d18-4042-818d-4be3c2848e20';

-- Reseau informatique → devient sous-parent d'Ingenierie
UPDATE categories_produits
SET display_mode = 'children',
    segment = 'general',
    parent_id = 'ca83f466-fff0-45b3-95d8-a2b81c765169'
WHERE id_categorie = '4c356ca8-7306-421d-98a9-6d07d6596a0b';

-- Telecommunications → devient sous-parent d'Ingenierie
UPDATE categories_produits
SET display_mode = 'children',
    segment = 'general',
    parent_id = 'ca83f466-fff0-45b3-95d8-a2b81c765169'
WHERE id_categorie = 'be0cb16a-9d23-4099-bf60-b03e6ccf3000';

-- ============================================================
-- PHASE 2: Créer les catégories de niveau 2 sous Ingenierie
-- ============================================================

-- 2a. SECURITE INFORMATIQUE & BASE DE DONNEES
-- Renommer la catégorie existante "Securite informatique et base de donnees"
UPDATE categories_produits
SET nom = 'SECURITE INFORMATIQUE & BASE DE DONNEES',
    slug = 'securite-informatique-base-de-donnees',
    display_mode = 'children',
    segment = 'general',
    parent_id = 'ca83f466-fff0-45b3-95d8-a2b81c765169',
    icone = 'fa-shield-halved'
WHERE id_categorie = 'bef391ef-8f33-4c63-a201-a513dfbc1165';

-- 2b. ARCHIVAGE NUMERIQUE (existant, devient enfant d'Ingenierie)
UPDATE categories_produits
SET display_mode = 'children',
    segment = 'general',
    parent_id = 'ca83f466-fff0-45b3-95d8-a2b81c765169',
    icone = 'fa-folder-open'
WHERE id_categorie = '9bd4e639-9f15-45e2-afec-b3046968e5cd';

-- 2c. MATERIEL ET CONSOMMABLES INFORMATIQUES
-- Renommer "Materiel informatique" → "MATERIEL ET CONSOMMABLES INFORMATIQUES"
UPDATE categories_produits
SET nom = 'MATERIEL ET CONSOMMABLES INFORMATIQUES',
    slug = 'materiel-consommables-informatiques',
    display_mode = 'children',
    segment = 'general',
    parent_id = 'ca83f466-fff0-45b3-95d8-a2b81c765169',
    icone = 'fa-computer'
WHERE id_categorie = '19f9cec1-6ad6-4997-a347-0c660332ce8a';

-- 2d. ENERGIE (déjà fait: parent_id défini ci-dessus + display_mode = children)
UPDATE categories_produits
SET icone = 'fa-bolt'
WHERE id_categorie = 'af08a91c-8d18-4042-818d-4be3c2848e20';

-- 2e. TELECOMMUNICATION (renommer de "Telecommunications")
UPDATE categories_produits
SET nom = 'TÉLÉCOMMUNICATION',
    slug = 'telecommunication',
    icone = 'fa-phone'
WHERE id_categorie = 'be0cb16a-9d23-4099-bf60-b03e6ccf3000';

-- 2f. INTELLIGENCE ARTIFICIELLE (NOUVELLE)
INSERT INTO categories_produits (id_categorie, nom, slug, description, icone, ordre, actif, display_mode, segment, parent_id, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'INTELLIGENCE ARTIFICIELLE',
    'ia-general',
    'Solutions et produits d''intelligence artificielle',
    'fa-brain',
    0, true, 'children', 'general',
    'ca83f466-fff0-45b3-95d8-a2b81c765169',
    NOW(), NOW()
);

-- 2g. CONTROLE D'ACCES (NOUVELLE)
INSERT INTO categories_produits (id_categorie, nom, slug, description, icone, ordre, actif, display_mode, segment, parent_id, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'CONTRÔLE D''ACCÈS',
    'controle-acces-general',
    'Systèmes et équipements de contrôle d''accès',
    'fa-door-open',
    0, true, 'children', 'general',
    'ca83f466-fff0-45b3-95d8-a2b81c765169',
    NOW(), NOW()
);

-- 2h. INCENDIE (déjà fait)

-- ============================================================
-- PHASE 3: Déplacer les catégories existantes sous leurs parents
-- ============================================================

-- === Sous RESEAU INFORMATIQUE ===
UPDATE categories_produits SET parent_id = '4c356ca8-7306-421d-98a9-6d07d6596a0b' WHERE id_categorie = '7513b548-c971-49ea-9287-7f03006f764b'; -- Switch manage
UPDATE categories_produits SET parent_id = '4c356ca8-7306-421d-98a9-6d07d6596a0b' WHERE id_categorie = '84bad3fa-0369-4443-a783-0babc3d34291'; -- Routeur entreprise
UPDATE categories_produits SET parent_id = '4c356ca8-7306-421d-98a9-6d07d6596a0b' WHERE id_categorie = '7ad81420-e912-4812-b4be-f97211c1702b'; -- Routeur 4G/5G
UPDATE categories_produits SET parent_id = '4c356ca8-7306-421d-98a9-6d07d6596a0b' WHERE id_categorie = '662f9820-68f1-4d07-b730-c178785b6f1c'; -- Point d'acces Wi-Fi
UPDATE categories_produits SET parent_id = '4c356ca8-7306-421d-98a9-6d07d6596a0b' WHERE id_categorie = 'ebf4313a-021d-49d9-be3e-961e9fff0c06'; -- Baie NAS

-- === Sous ENERGIE ===
UPDATE categories_produits SET parent_id = 'af08a91c-8d18-4042-818d-4be3c2848e20' WHERE id_categorie = '5bbaabc3-30a2-4e7f-8ac9-eb2ae66fd9ed'; -- Onduleur
UPDATE categories_produits SET parent_id = 'af08a91c-8d18-4042-818d-4be3c2848e20' WHERE id_categorie = '4d74ae95-a49c-4405-9593-689634c63ecb'; -- Groupe electrique
UPDATE categories_produits SET parent_id = 'af08a91c-8d18-4042-818d-4be3c2848e20' WHERE id_categorie = 'd07af962-cff0-43b2-a8a6-c004b2b65dff'; -- Panneau solaire
UPDATE categories_produits SET parent_id = 'af08a91c-8d18-4042-818d-4be3c2848e20' WHERE id_categorie = 'b7b40311-fbac-459e-8721-2e16e9de8e9a'; -- Regulateur / convertisseur

-- === Sous TELECOMMUNICATION ===
UPDATE categories_produits SET parent_id = 'be0cb16a-9d23-4099-bf60-b03e6ccf3000' WHERE id_categorie = '5e0306aa-f804-4d49-ba1f-c48fd28abd3f'; -- Autocom
UPDATE categories_produits SET parent_id = 'be0cb16a-9d23-4099-bf60-b03e6ccf3000' WHERE id_categorie = '52ec0a95-e236-4f93-aa10-ab1e50afb118'; -- Passerelle VoIP
UPDATE categories_produits SET parent_id = 'be0cb16a-9d23-4099-bf60-b03e6ccf3000' WHERE id_categorie = 'ef12b27f-0742-47c5-8931-197847a9c8f5'; -- Telephone IP

-- === Sous SECURITE INFORMATIQUE & BASE DE DONNEES ===
UPDATE categories_produits SET parent_id = 'bef391ef-8f33-4c63-a201-a513dfbc1165' WHERE id_categorie = '896e1ea3-309f-4157-b1ce-df5bf4ae8917'; -- Pare-feu reseau
UPDATE categories_produits SET parent_id = 'bef391ef-8f33-4c63-a201-a513dfbc1165' WHERE id_categorie = '439f66d6-1782-4579-89fe-462245c1523e'; -- Pare-feu applicatif et BDD
UPDATE categories_produits SET parent_id = 'bef391ef-8f33-4c63-a201-a513dfbc1165' WHERE id_categorie = '18098a62-9fd4-43e9-9222-3b283e9abc47'; -- SIEM / SOC
UPDATE categories_produits SET parent_id = 'bef391ef-8f33-4c63-a201-a513dfbc1165' WHERE id_categorie = '4d8aa96d-ab90-45be-948d-9e788f2fdfc0'; -- Antivirus / EDR
UPDATE categories_produits SET parent_id = 'bef391ef-8f33-4c63-a201-a513dfbc1165' WHERE id_categorie = '76264781-64bd-41d3-a740-9f3bc30d55ed'; -- Sauvegarde base de donnees
UPDATE categories_produits SET parent_id = 'bef391ef-8f33-4c63-a201-a513dfbc1165' WHERE id_categorie = 'e51724fa-f9bf-4263-bb25-b007e9ea9c53'; -- Serveur de sauvegarde
UPDATE categories_produits SET parent_id = 'bef391ef-8f33-4c63-a201-a513dfbc1165' WHERE id_categorie = '68c77b6e-9f2f-401f-a1d8-81613bdb61a1'; -- Serveur rack

-- === Sous ARCHIVAGE NUMERIQUE ===
UPDATE categories_produits SET parent_id = '9bd4e639-9f15-45e2-afec-b3046968e5cd' WHERE id_categorie = 'dee3d4e2-2d8b-48b2-bcff-a9ae5483b120'; -- Ordinateur de bureau
UPDATE categories_produits SET parent_id = '9bd4e639-9f15-45e2-afec-b3046968e5cd' WHERE id_categorie = '63e41ddc-cbd4-425e-9f85-73ed15381433'; -- Imprimante professionnelle
UPDATE categories_produits SET parent_id = '9bd4e639-9f15-45e2-afec-b3046968e5cd' WHERE id_categorie = '399e50be-df58-4add-9ecd-39ca1830e6ac'; -- Scanner documentaire
UPDATE categories_produits SET parent_id = '9bd4e639-9f15-45e2-afec-b3046968e5cd' WHERE id_categorie = '52b233d6-a2ed-4a7c-9e8b-7a2707e0df37'; -- Logiciel GED

-- === Sous INCENDIE ===
UPDATE categories_produits SET parent_id = '2683926a-7140-477b-b099-2e725eea8418' WHERE id_categorie = '63bb5479-b61c-4228-8484-b9351ed38ce2'; -- Extincteur
UPDATE categories_produits SET parent_id = '2683926a-7140-477b-b099-2e725eea8418' WHERE id_categorie = '59986727-b934-4012-9460-b39e26a07928'; -- R.I.A
UPDATE categories_produits SET parent_id = '2683926a-7140-477b-b099-2e725eea8418' WHERE id_categorie = '0aa9ee2f-eede-433f-889c-5cbd5d9f4054'; -- Detecteur de fumee
UPDATE categories_produits SET parent_id = '2683926a-7140-477b-b099-2e725eea8418' WHERE id_categorie = '31ccfffe-f5da-4bb1-a564-ea5b2473a71e'; -- Detecteur d'humidite
UPDATE categories_produits SET parent_id = '2683926a-7140-477b-b099-2e725eea8418' WHERE id_categorie = '0e320a51-9cd3-4f48-bdab-bb804ea974a4'; -- Sirene

-- === Sous MATERIEL ET CONSOMMABLES INFORMATIQUES ===
UPDATE categories_produits SET parent_id = '19f9cec1-6ad6-4997-a347-0c660332ce8a' WHERE id_categorie = 'a3ba43ec-1262-45bb-8aae-b7bce1ae8b8f'; -- Ordinateur portable

-- ============================================================
-- PHASE 4: Renommer certaines catégories selon le plan
-- ============================================================

UPDATE categories_produits SET nom = 'Détecteur de fumée'      WHERE id_categorie = '0aa9ee2f-eede-433f-889c-5cbd5d9f4054';
UPDATE categories_produits SET nom = 'Détecteur d''humidité'   WHERE id_categorie = '31ccfffe-f5da-4bb1-a564-ea5b2473a71e';
UPDATE categories_produits SET nom = 'Sirène'                  WHERE id_categorie = '0e320a51-9cd3-4f48-bdab-bb804ea974a4';
UPDATE categories_produits SET nom = 'Groupe Électrogène'     WHERE id_categorie = '4d74ae95-a49c-4405-9593-689634c63ecb';
UPDATE categories_produits SET nom = 'R.I.A.'                  WHERE id_categorie = '59986727-b934-4012-9460-b39e26a07928';
UPDATE categories_produits SET nom = 'Pare-feu réseau'         WHERE id_categorie = '896e1ea3-309f-4157-b1ce-df5bf4ae8917';
UPDATE categories_produits SET nom = 'Pare-feu applicatif et BDD' WHERE id_categorie = '439f66d6-1782-4579-89fe-462245c1523e';
UPDATE categories_produits SET nom = 'Sauvegarde base de données' WHERE id_categorie = '76264781-64bd-41d3-a740-9f3bc30d55ed';
UPDATE categories_produits SET nom = 'Répéteurs Wi-Fi'         WHERE id_categorie = '662f9820-68f1-4d07-b730-c178785b6f1c';

-- ============================================================
-- PHASE 5: Créer les nouvelles sous-catégories (feuilles)
-- ============================================================

-- === 5a. Sous SECURITE INFORMATIQUE & BASE DE DONNEES ===
-- Produits de securite / infrastructure
INSERT INTO categories_produits (id_categorie, nom, slug, description, icone, ordre, actif, display_mode, segment, parent_id, created_at, updated_at)
VALUES
(gen_random_uuid(), 'Ordinateurs portables',       'ordinateurs-portables-securite',       'Ordinateurs portables sécurisés',           'fa-laptop',        0, true, 'products', 'general', 'bef391ef-8f33-4c63-a201-a513dfbc1165', NOW(), NOW()),
(gen_random_uuid(), 'Serveurs de sécurité',        'serveurs-securite',                     'Serveurs dédiés à la sécurité',             'fa-server',        0, true, 'products', 'general', 'bef391ef-8f33-4c63-a201-a513dfbc1165', NOW(), NOW()),
(gen_random_uuid(), 'Routeurs sécurisés',          'routeurs-securises',                    'Routeurs avec fonctions de sécurité',       'fa-router',        0, true, 'products', 'general', 'bef391ef-8f33-4c63-a201-a513dfbc1165', NOW(), NOW()),
(gen_random_uuid(), 'Switchs managés sécurité',    'switchs-manages-securite',              'Switchs avec fonctionnalités de sécurité',  'fa-network-wired', 0, true, 'products', 'general', 'bef391ef-8f33-4c63-a201-a513dfbc1165', NOW(), NOW()),
(gen_random_uuid(), 'Câbles RJ45',                 'cables-rj45-securite',                  'Câbles réseau RJ45',                        'fa-plug',          0, true, 'products', 'general', 'bef391ef-8f33-4c63-a201-a513dfbc1165', NOW(), NOW()),
(gen_random_uuid(), 'Fibre optique',               'fibre-optique-securite',                'Câbles et équipements fibre optique',       'fa-circle-nodes',  0, true, 'products', 'general', 'bef391ef-8f33-4c63-a201-a513dfbc1165', NOW(), NOW());

-- === 5b. Sous ARCHIVAGE NUMERIQUE ===
INSERT INTO categories_produits (id_categorie, nom, slug, description, icone, ordre, actif, display_mode, segment, parent_id, created_at, updated_at)
VALUES
(gen_random_uuid(), 'Ordinateurs de bureau',       'ordinateurs-bureau-archivage',          'Ordinateurs de bureau pour archivage',      'fa-display',          0, true, 'products', 'general', '9bd4e639-9f15-45e2-afec-b3046968e5cd', NOW(), NOW()),
(gen_random_uuid(), 'Imprimantes multifonctions',  'imprimantes-multifonctions',            'Imprimantes multifonctions professionnelles','fa-print',           0, true, 'products', 'general', '9bd4e639-9f15-45e2-afec-b3046968e5cd', NOW(), NOW()),
(gen_random_uuid(), 'Photocopieuses',              'photocopieuses',                        'Photocopieuses professionnelles',           'fa-copy',            0, true, 'products', 'general', '9bd4e639-9f15-45e2-afec-b3046968e5cd', NOW(), NOW()),
(gen_random_uuid(), 'Relieuses',                   'relieuses',                             'Relieuses professionnelles',                'fa-book',            0, true, 'products', 'general', '9bd4e639-9f15-45e2-afec-b3046968e5cd', NOW(), NOW()),
(gen_random_uuid(), 'Destructeurs de documents',   'destructeurs-documents',                'Destructeurs de documents professionnels',  'fa-shredder',        0, true, 'products', 'general', '9bd4e639-9f15-45e2-afec-b3046968e5cd', NOW(), NOW()),
(gen_random_uuid(), 'Scanners à plat',             'scanners-plat',                         'Scanners à plat professionnels',            'fa-scanner',         0, true, 'products', 'general', '9bd4e639-9f15-45e2-afec-b3046968e5cd', NOW(), NOW()),
(gen_random_uuid(), 'Scanners haute vitesse',      'scanners-haute-vitesse',                'Scanners haute vitesse professionnels',     'fa-scanner-fast',    0, true, 'products', 'general', '9bd4e639-9f15-45e2-afec-b3046968e5cd', NOW(), NOW()),
(gen_random_uuid(), 'Scanners recto-verso',        'scanners-recto-verso',                  'Scanners documents recto-verso',            'fa-scanner',         0, true, 'products', 'general', '9bd4e639-9f15-45e2-afec-b3046968e5cd', NOW(), NOW()),
(gen_random_uuid(), 'Scanners de livres',          'scanners-livres',                       'Scanners de livres professionnels',         'fa-book-open',       0, true, 'products', 'general', '9bd4e639-9f15-45e2-afec-b3046968e5cd', NOW(), NOW()),
(gen_random_uuid(), 'Scanners portables',          'scanners-portables',                    'Scanners portables',                        'fa-hand',            0, true, 'products', 'general', '9bd4e639-9f15-45e2-afec-b3046968e5cd', NOW(), NOW()),
(gen_random_uuid(), 'Appareils photo numériques',  'appareils-photo-numeriques',            'Appareils photo haute résolution',          'fa-camera',          0, true, 'products', 'general', '9bd4e639-9f15-45e2-afec-b3046968e5cd', NOW(), NOW()),
(gen_random_uuid(), 'Disques durs externes',       'disques-durs-externes',                 'Disques durs externes de stockage',         'fa-hard-drive',      0, true, 'products', 'general', '9bd4e639-9f15-45e2-afec-b3046968e5cd', NOW(), NOW()),
(gen_random_uuid(), 'Câbles Ethernet',             'cables-ethernet',                       'Câbles Ethernet pour archivage',            'fa-plug',            0, true, 'products', 'general', '9bd4e639-9f15-45e2-afec-b3046968e5cd', NOW(), NOW());

-- === 5c. Sous MATERIEL ET CONSOMMABLES INFORMATIQUES ===
INSERT INTO categories_produits (id_categorie, nom, slug, description, icone, ordre, actif, display_mode, segment, parent_id, created_at, updated_at)
VALUES
(gen_random_uuid(), 'Vidéoprojecteurs',            'videoprojecteurs',                      'Vidéoprojecteurs professionnels',           'fa-projector',   0, true, 'products', 'general', '19f9cec1-6ad6-4997-a347-0c660332ce8a', NOW(), NOW()),
(gen_random_uuid(), 'Claviers',                    'claviers',                              'Claviers professionnels',                   'fa-keyboard',    0, true, 'products', 'general', '19f9cec1-6ad6-4997-a347-0c660332ce8a', NOW(), NOW()),
(gen_random_uuid(), 'Souris',                      'souris',                                'Souris professionnelles',                   'fa-computer-mouse', 0, true, 'products', 'general', '19f9cec1-6ad6-4997-a347-0c660332ce8a', NOW(), NOW()),
(gen_random_uuid(), 'Casques audio',               'casques-audio',                         'Casques audio professionnels',              'fa-headphones',  0, true, 'products', 'general', '19f9cec1-6ad6-4997-a347-0c660332ce8a', NOW(), NOW()),
(gen_random_uuid(), 'Imprimantes laser',           'imprimantes-laser',                     'Imprimantes laser professionnelles',        'fa-print',       0, true, 'products', 'general', '19f9cec1-6ad6-4997-a347-0c660332ce8a', NOW(), NOW()),
(gen_random_uuid(), 'Haut-parleurs',               'haut-parleurs',                         'Haut-parleurs professionnels',              'fa-speaker',     0, true, 'products', 'general', '19f9cec1-6ad6-4997-a347-0c660332ce8a', NOW(), NOW()),
(gen_random_uuid(), 'Traceurs',                    'traceurs',                              'Traceurs professionnels',                   'fa-pen-ruler',   0, true, 'products', 'general', '19f9cec1-6ad6-4997-a347-0c660332ce8a', NOW(), NOW());

-- === 5d. Sous TPE ===
INSERT INTO categories_produits (id_categorie, nom, slug, description, icone, ordre, actif, display_mode, segment, parent_id, created_at, updated_at)
VALUES
(gen_random_uuid(), '🏪 TPE fixe (filaire)',       'tpe-fixe',                             'Terminaux de paiement fixes filaires',      'fa-plug',        0, true, 'products', 'general', 'b7b0a350-cb6e-4312-b01f-e31f3912b2aa', NOW(), NOW()),
(gen_random_uuid(), '📶 TPE portable',              'tpe-portable',                         'Terminaux de paiement portables',           'fa-wifi',        0, true, 'products', 'general', 'b7b0a350-cb6e-4312-b01f-e31f3912b2aa', NOW(), NOW()),
(gen_random_uuid(), '📱 TPE mobile (GPRS/4G)',       'tpe-mobile',                          'Terminaux de paiement mobiles',             'fa-mobile-screen', 0, true, 'products', 'general', 'b7b0a350-cb6e-4312-b01f-e31f3912b2aa', NOW(), NOW()),
(gen_random_uuid(), '🧠 Smart TPE (Android)',       'tpe-smart-android',                    'Terminaux de paiement intelligents Android','fa-microchip',   0, true, 'products', 'general', 'b7b0a350-cb6e-4312-b01f-e31f3912b2aa', NOW(), NOW()),
(gen_random_uuid(), '🌐 TPE virtuel (e-TPE)',       'tpe-virtuel',                          'Terminaux de paiement virtuels',            'fa-cloud',       0, true, 'products', 'general', 'b7b0a350-cb6e-4312-b01f-e31f3912b2aa', NOW(), NOW());

-- === 5e. Sous Drone ===
INSERT INTO categories_produits (id_categorie, nom, slug, description, icone, ordre, actif, display_mode, segment, parent_id, created_at, updated_at)
VALUES
(gen_random_uuid(), '🧭 Drones de loisir (grand public)',   'drones-loisir',                'Drones grand public pour le loisir',         'fa-gamepad',    0, true, 'products', 'general', '8d0dcaa6-0730-4aa2-ab3a-843569a4e3a3', NOW(), NOW()),
(gen_random_uuid(), '🎥 Drones de photographie et vidéo',   'drones-photographie-video',    'Drones pour prises de vue professionnelles', 'fa-camera',     0, true, 'products', 'general', '8d0dcaa6-0730-4aa2-ab3a-843569a4e3a3', NOW(), NOW()),
(gen_random_uuid(), '🏭 Drones industriels',                 'drones-industriels',           'Drones pour usage industriel',               'fa-industry',   0, true, 'products', 'general', '8d0dcaa6-0730-4aa2-ab3a-843569a4e3a3', NOW(), NOW());

-- === 5f. Sous CONTROLE D'ACCES (récupérer l'UUID créé) ===
DO $$
DECLARE
    controle_acces_id uuid;
BEGIN
    SELECT id_categorie INTO controle_acces_id FROM categories_produits WHERE slug = 'controle-acces-general';

    INSERT INTO categories_produits (id_categorie, nom, slug, description, icone, ordre, actif, display_mode, segment, parent_id, created_at, updated_at)
    VALUES
    (gen_random_uuid(), 'Lecteur à badge',          'lecteur-badge',                       'Lecteurs de contrôle d''accès par badge',    'fa-id-card',    0, true, 'products', 'general', controle_acces_id, NOW(), NOW()),
    (gen_random_uuid(), 'Lecteur à empreinte',      'lecteur-empreinte',                   'Lecteurs biométriques à empreinte',         'fa-fingerprint',0, true, 'products', 'general', controle_acces_id, NOW(), NOW()),
    (gen_random_uuid(), 'Lecteur à code',           'lecteur-code',                        'Lecteurs à code pin',                       'fa-keypad',     0, true, 'products', 'general', controle_acces_id, NOW(), NOW()),
    (gen_random_uuid(), 'Lecteur à la rétine',      'lecteur-retine',                      'Lecteurs biométriques à reconnaissance rétinienne', 'fa-eye', 0, true, 'products', 'general', controle_acces_id, NOW(), NOW()),
    (gen_random_uuid(), 'Autres lecteurs',          'lecteurs-acces-autre',                'Autres types de lecteurs d''accès',         'fa-lock',       0, true, 'products', 'general', controle_acces_id, NOW(), NOW());
END $$;

-- === 5g. Sous INCENDIE → Extincteur a des sous-types ===
UPDATE categories_produits SET display_mode = 'children' WHERE id_categorie = '63bb5479-b61c-4228-8484-b9351ed38ce2'; -- Extincteur devient parent

INSERT INTO categories_produits (id_categorie, nom, slug, description, icone, ordre, actif, display_mode, segment, parent_id, created_at, updated_at)
VALUES
(gen_random_uuid(), 'Extincteur CO2',   'extincteur-co2',   'Extincteurs au dioxyde de carbone', 'fa-fire-extinguisher', 0, true, 'products', 'general', '63bb5479-b61c-4228-8484-b9351ed38ce2', NOW(), NOW()),
(gen_random_uuid(), 'Extincteur Eau',   'extincteur-eau',   'Extincteurs à eau',                 'fa-fire-extinguisher', 0, true, 'products', 'general', '63bb5479-b61c-4228-8484-b9351ed38ce2', NOW(), NOW()),
(gen_random_uuid(), 'Extincteur Poudre','extincteur-poudre', 'Extincteurs à poudre',              'fa-fire-extinguisher', 0, true, 'products', 'general', '63bb5479-b61c-4228-8484-b9351ed38ce2', NOW(), NOW());

-- ============================================================
-- PHASE 6: Déplacer les produits vers les nouvelles feuilles
-- ============================================================

-- Déplacer Ordinateur portable → Ordinateurs portables (sous Sécurité info)
UPDATE produits SET id_categorie = (
    SELECT id_categorie FROM categories_produits WHERE slug = 'ordinateurs-portables-securite'
) WHERE id_categorie = 'a3ba43ec-1262-45bb-8aae-b7bce1ae8b8f';

-- Déplacer Serveur de sauvegarde + Serveur rack → Serveurs de sécurité
UPDATE produits SET id_categorie = (
    SELECT id_categorie FROM categories_produits WHERE slug = 'serveurs-securite'
) WHERE id_categorie IN ('e51724fa-f9bf-4263-bb25-b007e9ea9c53', '68c77b6e-9f2f-401f-a1d8-81613bdb61a1');

-- Déplacer Routeur entreprise + Routeur 4G/5G → Routeurs sécurisés
UPDATE produits SET id_categorie = (
    SELECT id_categorie FROM categories_produits WHERE slug = 'routeurs-securises'
) WHERE id_categorie IN ('84bad3fa-0369-4443-a783-0babc3d34291', '7ad81420-e912-4812-b4be-f97211c1702b');

-- Déplacer Switch manage → Switchs managés sécurité
UPDATE produits SET id_categorie = (
    SELECT id_categorie FROM categories_produits WHERE slug = 'switchs-manages-securite'
) WHERE id_categorie = '7513b548-c971-49ea-9287-7f03006f764b';

-- Déplacer Ordinateur de bureau → Ordinateurs de bureau (sous Archivage)
UPDATE produits SET id_categorie = (
    SELECT id_categorie FROM categories_produits WHERE slug = 'ordinateurs-bureau-archivage'
) WHERE id_categorie = 'dee3d4e2-2d8b-48b2-bcff-a9ae5483b120';

-- Déplacer les produits Incendie génériques → Extincteur CO2 (par défaut)
UPDATE produits SET id_categorie = (
    SELECT id_categorie FROM categories_produits WHERE slug = 'extincteur-co2'
) WHERE id_categorie = '63bb5479-b61c-4228-8484-b9351ed38ce2';

-- Déplacer Panneau solaire → sous Energie
-- Les produits Panneau solaire restent dans la catégorie Panneau solaire
-- qui est maintenant enfant d'Energie (déjà fait en Phase 3)

-- Déplacer les 3 TPE réels dans les sous-catégories TPE
-- TPE PAX A920 → Smart TPE (Android)
UPDATE produits SET id_categorie = (
    SELECT id_categorie FROM categories_produits WHERE slug = 'tpe-smart-android'
) WHERE titre = 'TPE PAX A920';
-- TPE Verifone VX680 → TPE portable
UPDATE produits SET id_categorie = (
    SELECT id_categorie FROM categories_produits WHERE slug = 'tpe-portable'
) WHERE titre = 'TPE Verifone VX680';
-- TPE Ingenico Move/5000 → TPE mobile (GPRS/4G)
UPDATE produits SET id_categorie = (
    SELECT id_categorie FROM categories_produits WHERE slug = 'tpe-mobile'
) WHERE titre = 'TPE Ingenico Move/5000';

-- Déplacer les produits Drone génériques → Drones de photographie (par défaut)
UPDATE produits SET id_categorie = (
    SELECT id_categorie FROM categories_produits WHERE slug = 'drones-photographie-video'
) WHERE id_categorie = '8d0dcaa6-0730-4aa2-ab3a-843569a4e3a3'
  AND titre LIKE '%Produit%';

-- Fourniture de drone & formation, Topographie → Drones industriels
UPDATE produits SET id_categorie = (
    SELECT id_categorie FROM categories_produits WHERE slug = 'drones-industriels'
) WHERE titre IN ('Fourniture de drone & formation Produit 1',
                  'Fourniture de drone & formation Produit 2',
                  'Topographie Produit 1');

-- Cartographie, Systèmes de contrôle → Ingenierie (restent où ils sont maintenant = Ingenierie général)
-- Ils sont déjà dans Ingenierie, mais Ingenierie est maintenant parent
-- Il faut les déplacer vers une sous-catégorie appropriée
-- Cartographie → sous Ingenierie direct (nouvelle feuille)
-- Systèmes de contrôle → sous Ingenierie direct
INSERT INTO categories_produits (id_categorie, nom, slug, description, icone, ordre, actif, display_mode, segment, parent_id, created_at, updated_at)
VALUES
(gen_random_uuid(), 'Systèmes de contrôle', 'systemes-controle-ingenierie', 'Systèmes de contrôle techniques', 'fa-sliders', 0, true, 'products', 'general', 'ca83f466-fff0-45b3-95d8-a2b81c765169', NOW(), NOW()),
(gen_random_uuid(), 'Cartographie', 'cartographie-ingenierie', 'Solutions de cartographie', 'fa-map', 0, true, 'products', 'general', 'ca83f466-fff0-45b3-95d8-a2b81c765169', NOW(), NOW());

UPDATE produits SET id_categorie = (SELECT id_categorie FROM categories_produits WHERE slug = 'systemes-controle-ingenierie')
WHERE titre IN ('Systèmes de contrôle Produit 1','Systèmes de contrôle Produit 2','Systèmes de contrôle Produit 4','Systèmes de contrôle Produit 5');

UPDATE produits SET id_categorie = (SELECT id_categorie FROM categories_produits WHERE slug = 'cartographie-ingenierie')
WHERE titre IN ('Cartographie Produit 2','Cartographie Produit 4');

-- Déplacer les produits des catégories absorbées (maintenant vides)
-- Les catégories vides seront supprimées en Phase 7

-- ============================================================
-- PHASE 7: Supprimer les catégories devenues vides (après déplacement)
-- ============================================================

DELETE FROM categories_produits WHERE id_categorie = 'a3ba43ec-1262-45bb-8aae-b7bce1ae8b8f'; -- Ordinateur portable (remplacé)
DELETE FROM categories_produits WHERE id_categorie = 'dee3d4e2-2d8b-48b2-bcff-a9ae5483b120'; -- Ordinateur de bureau (remplacé)
DELETE FROM categories_produits WHERE id_categorie = 'e51724fa-f9bf-4263-bb25-b007e9ea9c53'; -- Serveur de sauvegarde (absorbé)
DELETE FROM categories_produits WHERE id_categorie = '68c77b6e-9f2f-401f-a1d8-81613bdb61a1'; -- Serveur rack (absorbé)
DELETE FROM categories_produits WHERE id_categorie = '84bad3fa-0369-4443-a783-0babc3d34291'; -- Routeur entreprise (absorbé)
DELETE FROM categories_produits WHERE id_categorie = '7ad81420-e912-4812-b4be-f97211c1702b'; -- Routeur 4G/5G (absorbé)
DELETE FROM categories_produits WHERE id_categorie = '7513b548-c971-49ea-9287-7f03006f764b'; -- Switch manage (absorbé)

-- ============================================================
-- PHASE 8: Mettre à jour les segments et display_mode
-- ============================================================

-- S'assurer que toutes les nouvelles catégories générales ont le bon segment
UPDATE categories_produits
SET segment = 'general'
WHERE parent_id = 'ca83f466-fff0-45b3-95d8-a2b81c765169'
  AND (segment IS NULL OR segment = '');

-- Toutes les catégories enfants d'Ingenierie qui n'ont pas de display_mode explicite
-- doivent être en mode 'products' si elles sont des feuilles
UPDATE categories_produits
SET display_mode = 'products'
WHERE parent_id IS NOT NULL
  AND display_mode IS NULL;

-- ============================================================
COMMIT;
