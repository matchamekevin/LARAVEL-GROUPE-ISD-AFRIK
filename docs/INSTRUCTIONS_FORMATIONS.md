# Seeding Formations - Instructions

## Exécution du Seeder

Pour remplir la base de données avec 15 formations de démonstration (gestion, sécurité, digital), exécutez la commande suivante :

```bash
php artisan db:seed --class=FormationSeeder
```

Ou, pour exécuter tous les seeders (incluant formations) :

```bash
php artisan db:seed
```

## Formations Créées

Le seeder `FormationSeeder` crée 15 formations réalistes dans les catégories suivantes:

### Gestion Commerciale & Comptabilité (4)
- Gestion Commerciale et Stock - Niveau 1 (40h, 50,000 FCFA)
- Comptabilité Générale - Essentials (35h, 45,000 FCFA)
- Ressources Humaines & Paie (45h, 60,000 FCFA)
- Microsoft Excel Avancé (30h, 35,000 FCFA)

### Sécurité Électronique (3)
- Videosurveillance & Contrôle d'Accès (50h, 75,000 FCFA)
- Drones Civils - Initiation & Pilotage (25h, 65,000 FCFA)
- Extincteurs & Sécurité Incendie (16h, 30,000 FCFA)

### Transformation Digitale (4)
- Transformation Digitale des PME (48h, 80,000 FCFA)
- Solutions Cloud & Cybersécurité (42h, 70,000 FCFA)
- Web & Mobile - Initiation (60h, 85,000 FCFA)
- Marketing Digital & SEO (40h, 55,000 FCFA)

### Soft Skills & Métier (4)
- Gestion de Projet Agile/Scrum (35h, 65,000 FCFA)
- Communication Professionnelle & Leadership (30h, 40,000 FCFA)
- Anglais Professionnel - Business English (50h, 55,000 FCFA)

---

## Catégories Cibles

- **particulier** : Formations ouvertes aux particuliers
- **etudiant** : Formations pour étudiants et jeunes professionnels
- **entreprise** : Formations pour entreprises et groupes

---

## Données Includes

Chaque formation inclut :
- ✅ Titre et description détaillée
- ✅ Durée (en heures)
- ✅ Prix (en FCFA)
- ✅ Date de début (programmée)
- ✅ Places disponibles
- ✅ Liste des bénéfices (JSON array)
- ✅ Pays cible (Afrique de l'Ouest)

---

## Notes

- Les données sont basées sur les besoins de ISD AFRIK
- Les prix et durées sont réalistes
- Les dates de début sont calculées par rapport à la date du jour
- Tous les bénéfices sont des résultats d'apprentissage concrets
