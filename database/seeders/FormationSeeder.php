<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Formation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FormationSeeder extends Seeder
{
    /**
     * Seed the formations table with realistic training data.
     * Focused on management, security, and digital transformation.
     */
    public function run(): void
    {
        // Récupérer un pays défaut (Bénin - ISD AFRIK est basé là-bas)
        // La table `pays` utilise la colonne `code_pays` (et non `code`).
        $paysId = DB::table('pays')
            ->whereIn('code_pays', ['BJ', 'TG', 'NE', 'CI', 'BF'])
            ->value('id_pays') ?? 1;

        $formations = [
            // ─────────────────────────────────────────────────────────────────
            // FORMATIONS DE GESTION COMMERCIALE ET STOCK (Particuliers/Etudiant)
            // ─────────────────────────────────────────────────────────────────

            [
                'titre' => 'Gestion Commerciale et Stock - Niveau 1',
                'description' => 'Apprenez les bases de la gestion commerciale, de la trésorerie et du suivi des stocks. Formation idéale pour les PME et entrepreneurs.',
                'duree' => 40, // heures
                'prix' => 50000, // FCFA
                'categorie' => 'particulier',
                'date_debut' => now()->addDays(7),
                'places_disponibles' => 25,
                'benefices' => json_encode([
                    'Maîtriser les outils de gestion commerciale',
                    'Optimiser la gestion des stocks',
                    'Réduire les coûts opérationnels',
                    'Améliorer la rentabilité'
                ]),
                'id_pays' => $paysId,
            ],

            [
                'titre' => 'Comptabilité Générale - Essentials',
                'description' => 'Formation pratique en comptabilité générale couvrant les principes SYSCOHADA. Parfait pour débuter ou rafraîchir vos connaissances.',
                'duree' => 35,
                'prix' => 45000,
                'categorie' => 'particulier',
                'date_debut' => now()->addDays(14),
                'places_disponibles' => 20,
                'benefices' => json_encode([
                    'Comprendre les états financiers',
                    'Faire la clôture comptable',
                    'Respecter les normes SYSCOHADA',
                    'Gérer les déclarations fiscales'
                ]),
                'id_pays' => $paysId,
            ],

            [
                'titre' => 'Ressources Humaines & Paie',
                'description' => 'Gestion complète des RH, recrutement, paie et conformité légale. Essentiel pour les responsables RH.',
                'duree' => 45,
                'prix' => 60000,
                'categorie' => 'etudiant',
                'date_debut' => now()->addDays(21),
                'places_disponibles' => 18,
                'benefices' => json_encode([
                    'Recruter et onboarder efficacement',
                    'Gérer la paie et les cotisations',
                    'Respecter la législation du travail',
                    'Développer la culture d\'entreprise'
                ]),
                'id_pays' => $paysId,
            ],

            [
                'titre' => 'Microsoft Excel Avancé',
                'description' => 'Maîtrisez Excel pour l\'analyse de données, les tableaux de bord et l\'automatisation. Formule, graphiques, macros.',
                'duree' => 30,
                'prix' => 35000,
                'categorie' => 'particulier',
                'date_debut' => now()->addDays(5),
                'places_disponibles' => 30,
                'benefices' => json_encode([
                    'Créer des formules complexes',
                    'Construire des tableaux de bord',
                    'Automatiser avec les macros',
                    'Analyser les données rapidement'
                ]),
                'id_pays' => $paysId,
            ],

            // ─────────────────────────────────────────────────────────────────
            // FORMATIONS SÉCURITÉ ÉLECTRONIQUE & DRONES
            // ─────────────────────────────────────────────────────────────────

            [
                'titre' => 'Videosurveillance & Contrôle d\'Accès',
                'description' => 'Installation, configuration et maintenance des systèmes de sécurité électronique. Certifications Hikvision et Dahua.',
                'duree' => 50,
                'prix' => 75000,
                'categorie' => 'etudiant',
                'date_debut' => now()->addDays(10),
                'places_disponibles' => 15,
                'benefices' => json_encode([
                    'Installer les caméras IP/analogique',
                    'Configurer les NVR/DVR',
                    'Mettre en place le contrôle d\'accès',
                    'Assurer la maintenance préventive',
                    'Certification Hikvision'
                ]),
                'id_pays' => $paysId,
            ],

            [
                'titre' => 'Drones Civils - Initiation & Pilotage',
                'description' => 'Apprentissage du pilotage de drones civils (DJI Phantom, Mavic). Respect des normes aéronautiques.',
                'duree' => 25,
                'prix' => 65000,
                'categorie' => 'particulier',
                'date_debut' => now()->addDays(12),
                'places_disponibles' => 12,
                'benefices' => json_encode([
                    'Maîtriser le pilotage basique & avancé',
                    'Respecter la réglementation aérienne',
                    'Utiliser les modes de vol intelligents',
                    'Réaliser des inspections aériennes',
                    'Obtenir la certification'
                ]),
                'id_pays' => $paysId,
            ],

            [
                'titre' => 'Extincteurs & Sécurité Incendie',
                'description' => 'Formation à la sécurité incendie, maniement d\'extincteurs et prévention. Certification BNAC.',
                'duree' => 16,
                'prix' => 30000,
                'categorie' => 'etudiant',
                'date_debut' => now()->addDays(8),
                'places_disponibles' => 40,
                'benefices' => json_encode([
                    'Maîtriser les extincteurs',
                    'Identifier les risques incendie',
                    'Évacuer rapidement',
                    'Certification BNAC valide 2 ans'
                ]),
                'id_pays' => $paysId,
            ],

            // ─────────────────────────────────────────────────────────────────
            // FORMATIONS TRANSFORMATION DIGITALE
            // ─────────────────────────────────────────────────────────────────

            [
                'titre' => 'Transformation Digitale des PME',
                'description' => 'Accompagnement complet pour digitaliser votre entreprise. Stratégie digitale, outils et processus.',
                'duree' => 48,
                'prix' => 80000,
                'categorie' => 'entreprise',
                'date_debut' => now()->addDays(20),
                'places_disponibles' => 15,
                'benefices' => json_encode([
                    'Définir une stratégie digitale',
                    'Automatiser les processus',
                    'Améliorer la relation client',
                    'Réduire les coûts IT',
                    'Augmenter la compétitivité'
                ]),
                'id_pays' => $paysId,
            ],

            [
                'titre' => 'Solutions Cloud & Cybersécurité',
                'description' => 'Migration vers le cloud, sécurité des données et conformité RGPD. Protégez votre infrastructure IT.',
                'duree' => 42,
                'prix' => 70000,
                'categorie' => 'entreprise',
                'date_debut' => now()->addDays(25),
                'places_disponibles' => 12,
                'benefices' => json_encode([
                    'Choisir la bonne solution cloud',
                    'Sécuriser les données',
                    'Respecter le RGPD',
                    'Gérer les accès utilisateur',
                    'Audit et compliance'
                ]),
                'id_pays' => $paysId,
            ],

            [
                'titre' => 'Web & Mobile - Initiation',
                'description' => 'Introduction au développement web et mobile. HTML5, CSS3, JavaScript et frameworks modernes.',
                'duree' => 60,
                'prix' => 85000,
                'categorie' => 'particulier',
                'date_debut' => now()->addDays(15),
                'places_disponibles' => 20,
                'benefices' => json_encode([
                    'Maîtriser HTML5 et CSS3',
                    'Programmer en JavaScript',
                    'Découvrir React et Vue',
                    'Déboguer et optimiser',
                    'Créer des sites responsifs'
                ]),
                'id_pays' => $paysId,
            ],

            [
                'titre' => 'Marketing Digital & SEO',
                'description' => 'Stratégie digitale, SEO, SEM, réseaux sociaux et analytics. Maîtrisez le marketing en ligne.',
                'duree' => 40,
                'prix' => 55000,
                'categorie' => 'particulier',
                'date_debut' => now()->addDays(18),
                'places_disponibles' => 25,
                'benefices' => json_encode([
                    'Optimiser pour les moteurs de recherche',
                    'Créer des campagnes Google Ads',
                    'Engager sur les réseaux sociaux',
                    'Analyser le trafic avec Google Analytics',
                    'Augmenter les conversions'
                ]),
                'id_pays' => $paysId,
            ],

            // ─────────────────────────────────────────────────────────────────
            // FORMATIONS MÉTIER & SOFT SKILLS
            // ─────────────────────────────────────────────────────────────────

            [
                'titre' => 'Gestion de Projet Agile/Scrum',
                'description' => 'Methodology Agile, Scrum Master, planification et delivery itérative. Pour les chefs de projet.',
                'duree' => 35,
                'prix' => 65000,
                'categorie' => 'etudiant',
                'date_debut' => now()->addDays(11),
                'places_disponibles' => 18,
                'benefices' => json_encode([
                    'Maîtriser Scrum et Agile',
                    'Planifier les sprints',
                    'Gérer l\'équipe efficacement',
                    'Livrer rapidement',
                    'Certification Scrum Master'
                ]),
                'id_pays' => $paysId,
            ],

            [
                'titre' => 'Communication Professionnelle & Leadership',
                'description' => 'Développer vos soft skills : communication, négociation, leadership et gestion du stress.',
                'duree' => 30,
                'prix' => 40000,
                'categorie' => 'particulier',
                'date_debut' => now()->addDays(9),
                'places_disponibles' => 35,
                'benefices' => json_encode([
                    'Améliorer la communication',
                    'Négocier efficacement',
                    'Exercer le leadership',
                    'Gérer le stress',
                    'Développer l\'empathie'
                ]),
                'id_pays' => $paysId,
            ],

            [
                'titre' => 'Anglais Professionnel - Business English',
                'description' => 'Maîtrisez l\'anglais des affaires pour communiquer en anglais au travail. Conversation, présentation, rédaction.',
                'duree' => 50,
                'prix' => 55000,
                'categorie' => 'particulier',
                'date_debut' => now()->addDays(13),
                'places_disponibles' => 22,
                'benefices' => json_encode([
                    'Parler couramment l\'anglais',
                    'Présenter en anglais',
                    'Rédiger les emails professionnels',
                    'Négocier en anglais',
                    'Passer le TOEIC'
                ]),
                'id_pays' => $paysId,
            ],
        ];

        // Insérer les formations
        foreach ($formations as $formation) {
            if (empty($formation['uuid'])) {
                $formation['uuid'] = (string) Str::uuid();
            }
            Formation::create($formation);
        }

        // Log du succès
        $this->command->info('✅ ' . count($formations) . ' formations créées avec succès !');
    }
}
