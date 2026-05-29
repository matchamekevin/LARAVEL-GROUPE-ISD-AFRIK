-- Restore 12 produits from insert_produits_actuels.sql
-- with proper UUIDs for current schema
BEGIN;

-- 1. Delete generic TPE static dummy products
DELETE FROM ligne_commandes WHERE id_produit IN (SELECT id_produit FROM produits WHERE id_categorie = 'b7b0a350-cb6e-4312-b01f-e31f3912b2aa' AND titre LIKE 'TPE Produit%');
DELETE FROM paiements WHERE id_produit IN (SELECT id_produit FROM produits WHERE id_categorie = 'b7b0a350-cb6e-4312-b01f-e31f3912b2aa' AND titre LIKE 'TPE Produit%');
DELETE FROM produits WHERE id_categorie = 'b7b0a350-cb6e-4312-b01f-e31f3912b2aa' AND titre LIKE 'TPE Produit%';

-- 2. Insert 12 products
-- TPE products → TPE category
INSERT INTO produits (id_produit, titre, slug, reference, description_courte, prix, prix_promo, statut, stock, stock_alerte, marque, modele, garantie, poids, est_en_vedette, est_nouveau, id_categorie, id_pays, id_utilisateur, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  'TPE PAX A920',
  'tpe-pax-a920',
  'TPE-PAX-A920-003',
  'TPE Android tout-en-un avec ecran tactile 5 pouces.',
  310000.00, NULL,
  'actif', 18, 4,
  'PAX', 'A920', '12 mois', 0.55,
  false, true,
  'b7b0a350-cb6e-4312-b01f-e31f3912b2aa',
  (SELECT id_pays FROM pays LIMIT 1),
  (SELECT id_utilisateur FROM utilisateurs WHERE role = 'superadmin' ORDER BY created_at ASC LIMIT 1),
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'TPE Verifone VX680',
  'tpe-verifone-vx680',
  'TPE-VER-VX680-002',
  'TPE robuste avec imprimante integree et autonomie longue.',
  295000.00, 279000.00,
  'actif', 12, 3,
  'Verifone', 'VX680', '12 mois', 0.42,
  false, true,
  'b7b0a350-cb6e-4312-b01f-e31f3912b2aa',
  (SELECT id_pays FROM pays LIMIT 1),
  (SELECT id_utilisateur FROM utilisateurs WHERE role = 'superadmin' ORDER BY created_at ASC LIMIT 1),
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'TPE Ingenico Move/5000',
  'tpe-ingenico-move5000',
  'TPE-ING-MOVE5000-001',
  'Terminal de paiement mobile 4G et sans contact.',
  325000.00, 299000.00,
  'actif', 15, 3,
  'Ingenico', 'Move/5000', '12 mois', 0.45,
  true, true,
  'b7b0a350-cb6e-4312-b01f-e31f3912b2aa',
  (SELECT id_pays FROM pays LIMIT 1),
  (SELECT id_utilisateur FROM utilisateurs WHERE role = 'superadmin' ORDER BY created_at ASC LIMIT 1),
  NOW(), NOW()
);

-- Systèmes de contrôle → Ingenierie (general)
INSERT INTO produits (id_produit, titre, slug, reference, description_courte, prix, prix_promo, statut, stock, stock_alerte, marque, modele, garantie, poids, est_en_vedette, est_nouveau, id_categorie, id_pays, id_utilisateur, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  'Systèmes de contrôle Produit 1',
  'systemes-de-controle-produit-1',
  'GEH9UMCH',
  'Systèmes de contrôle Produit 1 - disponibilité immédiate',
  658815.00, NULL,
  'disponible', 29, 5,
  'DJI', 'Série 250', '2 an(s)', 4.00,
  true, true,
  'ca83f466-fff0-45b3-95d8-a2b81c765169',
  (SELECT id_pays FROM pays LIMIT 1),
  (SELECT id_utilisateur FROM utilisateurs WHERE role = 'superadmin' ORDER BY created_at ASC LIMIT 1),
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'Systèmes de contrôle Produit 4',
  'systemes-de-controle-produit-4',
  'UZ70CKCR',
  'Systèmes de contrôle Produit 4 - disponibilité immédiate',
  198976.00, 110808.00,
  'disponible', 34, 5,
  'Epson', 'Série 117', '3 an(s)', 3.00,
  false, false,
  'ca83f466-fff0-45b3-95d8-a2b81c765169',
  (SELECT id_pays FROM pays LIMIT 1),
  (SELECT id_utilisateur FROM utilisateurs WHERE role = 'superadmin' ORDER BY created_at ASC LIMIT 1),
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'Systèmes de contrôle Produit 5',
  'systemes-de-controle-produit-5',
  'UC2V2ZFM',
  'Systèmes de contrôle Produit 5 - disponibilité immédiate',
  826582.00, NULL,
  'disponible', 46, 5,
  'Samsung', 'Série 772', '1 an(s)', 10.00,
  false, false,
  'ca83f466-fff0-45b3-95d8-a2b81c765169',
  (SELECT id_pays FROM pays LIMIT 1),
  (SELECT id_utilisateur FROM utilisateurs WHERE role = 'superadmin' ORDER BY created_at ASC LIMIT 1),
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'Systèmes de contrôle Produit 2',
  'systemes-de-controle-produit-2',
  'W7DWNVKK',
  'Systèmes de contrôle Produit 2 - disponibilité immédiate',
  946665.00, 260636.00,
  'disponible', 7, 5,
  'DJI', 'Série 757', '3 an(s)', 5.00,
  false, true,
  'ca83f466-fff0-45b3-95d8-a2b81c765169',
  (SELECT id_pays FROM pays LIMIT 1),
  (SELECT id_utilisateur FROM utilisateurs WHERE role = 'superadmin' ORDER BY created_at ASC LIMIT 1),
  NOW(), NOW()
);

-- Cartographie → Ingenierie (general)
INSERT INTO produits (id_produit, titre, slug, reference, description_courte, prix, prix_promo, statut, stock, stock_alerte, marque, modele, garantie, poids, est_en_vedette, est_nouveau, id_categorie, id_pays, id_utilisateur, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  'Cartographie Produit 4',
  'cartographie-produit-4',
  'QCDCL3E0',
  'Cartographie Produit 4 - disponibilité immédiate',
  1070381.00, 210064.00,
  'disponible', 27, 5,
  'Epson', 'Série 952', '2 an(s)', 3.00,
  false, false,
  'ca83f466-fff0-45b3-95d8-a2b81c765169',
  (SELECT id_pays FROM pays LIMIT 1),
  (SELECT id_utilisateur FROM utilisateurs WHERE role = 'superadmin' ORDER BY created_at ASC LIMIT 1),
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'Cartographie Produit 2',
  'cartographie-produit-2',
  '44IK2G65',
  'Cartographie Produit 2 - disponibilité immédiate',
  242899.00, NULL,
  'disponible', 23, 5,
  'DJI', 'Série 195', '1 an(s)', 9.00,
  false, false,
  'ca83f466-fff0-45b3-95d8-a2b81c765169',
  (SELECT id_pays FROM pays LIMIT 1),
  (SELECT id_utilisateur FROM utilisateurs WHERE role = 'superadmin' ORDER BY created_at ASC LIMIT 1),
  NOW(), NOW()
);

-- Fourniture de drone & formation → Drone (general)
INSERT INTO produits (id_produit, titre, slug, reference, description_courte, prix, prix_promo, statut, stock, stock_alerte, marque, modele, garantie, poids, est_en_vedette, est_nouveau, id_categorie, id_pays, id_utilisateur, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  'Fourniture de drone & formation Produit 2',
  'fourniture-de-drone-formation-produit-2',
  'TSTYSSVC',
  'Fourniture de drone & formation Produit 2 - disponibilité immédiate',
  1183141.00, 708292.00,
  'disponible', 12, 5,
  'Epson', 'Série 919', '3 an(s)', 8.00,
  false, true,
  '8d0dcaa6-0730-4aa2-ab3a-843569a4e3a3',
  (SELECT id_pays FROM pays LIMIT 1),
  (SELECT id_utilisateur FROM utilisateurs WHERE role = 'superadmin' ORDER BY created_at ASC LIMIT 1),
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'Fourniture de drone & formation Produit 1',
  'fourniture-de-drone-formation-produit-1',
  'FER30WGN',
  'Fourniture de drone & formation Produit 1 - disponibilité immédiate',
  198315.00, NULL,
  'disponible', 7, 5,
  'Asus', 'Série 104', '1 an(s)', 11.00,
  true, true,
  '8d0dcaa6-0730-4aa2-ab3a-843569a4e3a3',
  (SELECT id_pays FROM pays LIMIT 1),
  (SELECT id_utilisateur FROM utilisateurs WHERE role = 'superadmin' ORDER BY created_at ASC LIMIT 1),
  NOW(), NOW()
);

-- Topographie → Drone (general)
INSERT INTO produits (id_produit, titre, slug, reference, description_courte, prix, prix_promo, statut, stock, stock_alerte, marque, modele, garantie, poids, est_en_vedette, est_nouveau, id_categorie, id_pays, id_utilisateur, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  'Topographie Produit 1',
  'topographie-produit-1',
  '5PI2GOOO',
  'Topographie Produit 1 - disponibilité immédiate',
  274672.00, 121368.00,
  'disponible', 20, 5,
  'DJI', 'Série 721', '3 an(s)', 3.00,
  true, true,
  '8d0dcaa6-0730-4aa2-ab3a-843569a4e3a3',
  (SELECT id_pays FROM pays LIMIT 1),
  (SELECT id_utilisateur FROM utilisateurs WHERE role = 'superadmin' ORDER BY created_at ASC LIMIT 1),
  NOW(), NOW()
);

COMMIT;
