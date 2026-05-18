<?php

namespace App\Http\Controllers;

use App\Models\Projet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProjetController extends Controller
{
    private const DEFAULT_PROJETS = [
        [
            'title' => 'Plateforme ISD Portal',
            'category' => 'Digital',
            'description' => 'Solution complète de gestion d\'entreprise incluant la facturation, le CRM et le suivi des stocks.',
            'image_path' => '/images/solutions/im1.webp',
            'url' => 'https://portal.isdafrik.com',
            'slug' => 'isd-portal',
            'long_desc' => 'ISD Portal est une plateforme tout-en-un qui centralise la gestion de votre entreprise : facturation automatisée, CRM intégré, suivi des stocks en temps réel, rapports financiers et tableau de bord personnalisable. Conçue pour les PME africaines, elle s\'adapte à vos processus métier.',
            'sort_order' => 10,
        ],
        [
            'title' => 'SafeCity Surveillance',
            'category' => 'Sécurité',
            'description' => 'Déploiement d\'un réseau de vidéosurveillance IP haute définition pour une zone industrielle.',
            'image_path' => '/images/solutions/im2.webp',
            'url' => 'https://security.isdafrik.com',
            'slug' => 'safecity-surveillance',
            'long_desc' => 'SafeCity est un système de vidéosurveillance IP nouvelle génération. Caméras HD, analyse vidéo intelligente, stockage cloud sécurisé et supervision 24h/24. Solution déployée pour les zones industrielles, les centres commerciaux et les administrations publiques.',
            'sort_order' => 20,
        ],
        [
            'title' => 'AfrikPay',
            'category' => 'Fintech',
            'description' => 'Passerelle de paiement sécurisée pour le commerce électronique local et international.',
            'image_path' => '/images/solutions/im3.webp',
            'url' => 'https://pay.isdafrik.com',
            'slug' => 'afrikpay',
            'long_desc' => 'AfrikPay est une passerelle de paiement qui permet aux entreprises d\'accepter les paiements en ligne en toute sécurité. Supporte TMoney, Flooz, Visa, Mastercard et mobile money. Interface API RESTful pour une intégration facile avec votre site e-commerce.',
            'sort_order' => 30,
        ],
        [
            'title' => 'EduAfrik Management',
            'category' => 'Éducation',
            'description' => 'Système de gestion universitaire (ERP) pour le suivi des étudiants et de la scolarité.',
            'image_path' => '/images/solutions/im4.webp',
            'url' => 'https://edu.isdafrik.com',
            'slug' => 'eduafrik-management',
            'long_desc' => 'EduAfrik est un ERP universitaire complet : gestion des inscriptions, des notes, des emplois du temps, de la scolarité et des frais. Portail étudiant, espace enseignant et tableau de bord direction. Solution déployée dans plusieurs universités africaines.',
            'sort_order' => 40,
        ],
        [
            'title' => 'AgroDrone Mapping',
            'category' => 'Agriculture',
            'description' => 'Service de cartographie par drone pour l\'optimisation des rendements agricoles.',
            'image_path' => '/images/solutions/im1.webp',
            'url' => 'https://drones.isdafrik.com',
            'slug' => 'agrodrone-mapping',
            'long_desc' => 'AgroDrone Mapping utilise des drones professionnels pour la cartographie agricole : analyse NDVI des cultures, détection des stress hydriques, estimation des rendements et création d\'orthophotos. Optimisez vos rendements avec des données précises.',
            'sort_order' => 50,
        ],
        [
            'title' => 'HotelSync Pro',
            'category' => 'Hôtellerie',
            'description' => 'Logiciel de gestion hôtelière avec moteur de réservation en temps réel.',
            'image_path' => '/images/solutions/im2.webp',
            'url' => 'https://hotels.isdafrik.com',
            'slug' => 'hotelsync-pro',
            'long_desc' => 'HotelSync Pro est un logiciel de gestion hôtelière complet : module de réservation, gestion des chambres, check-in/check-out, facturation, reporting et intégration avec les OTA. Moteur de réservation en temps réel pour votre site web.',
            'sort_order' => 60,
        ],
        [
            'title' => 'BTP Connect',
            'category' => 'Industrie',
            'description' => 'Suivi technique et monitoring de chantiers via des capteurs IoT connectés.',
            'image_path' => '/images/solutions/im3.webp',
            'url' => 'https://btp.isdafrik.com',
            'slug' => 'btp-connect',
            'long_desc' => 'BTP Connect est une solution IoT pour le suivi de chantiers : capteurs de vibration, température, humidité et localisation. Tableau de bord en temps réel, alertes automatiques et rapports d\'avancement. Optimisez la gestion de vos projets BTP.',
            'sort_order' => 70,
        ],
        [
            'title' => 'ArchiveSafe GED',
            'category' => 'Archivage',
            'description' => 'Plateforme de gestion électronique de documents (GED) hautement sécurisée.',
            'image_path' => '/images/solutions/im4.webp',
            'url' => 'https://archive.isdafrik.com',
            'slug' => 'archivesafe-ged',
            'long_desc' => 'ArchiveSafe GED est une plateforme de gestion électronique de documents avec chiffrement de bout en bout. Indexation automatique, recherche plein texte, gestion des versions, signatures électroniques et conformité RGPD. Solution cloud ou on-premise.',
            'sort_order' => 80,
        ],
    ];

    private function seedDefaultsIfEmpty(): void
    {
        if (Projet::query()->exists()) return;

        $rows = collect(self::DEFAULT_PROJETS)->map(fn (array $item) => [
            'title' => $item['title'],
            'category' => $item['category'],
            'description' => $item['description'],
            'url' => $item['url'],
            'slug' => $item['slug'],
            'long_desc' => $item['long_desc'] ?? null,
            'image_path' => $item['image_path'],
            'is_active' => true,
            'sort_order' => $item['sort_order'],
            'created_at' => now(),
            'updated_at' => now(),
        ])->all();

        Projet::insert($rows);
    }

    private function shouldDeleteStoredImage(?string $path): bool
    {
        if (!$path) return false;
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) return false;
        return !str_starts_with($path, '/');
    }

    public function index()
    {
        $this->seedDefaultsIfEmpty();

        return response()->json(
            Projet::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get()
        );
    }

    public function adminIndex()
    {
        $this->seedDefaultsIfEmpty();

        return response()->json(
            Projet::query()
                ->orderBy('sort_order')
                ->orderByDesc('id')
                ->get()
        );
    }

    public function show($slug)
    {
        $projet = Projet::where('slug', $slug)->firstOrFail();
        return response()->json($projet);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'long_desc' => ['nullable', 'string'],
            'url' => ['nullable', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:projets,slug'],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
        ]);

        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('projets', 'public');
        }

        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['sort_order'] = (int) ($validated['sort_order'] ?? 0);

        unset($validated['image']);

        $projet = Projet::create($validated);

        return response()->json($projet, 201);
    }

    public function update(Request $request, Projet $projet)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'long_desc' => ['nullable', 'string'],
            'url' => ['nullable', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:projets,slug,' . $projet->id],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
        ]);

        if ($request->hasFile('image')) {
            if ($this->shouldDeleteStoredImage($projet->image_path)) {
                Storage::disk('public')->delete($projet->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('projets', 'public');
        }

        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['sort_order'] = (int) ($validated['sort_order'] ?? 0);

        unset($validated['image']);

        $projet->update($validated);

        return response()->json($projet->fresh());
    }

    public function destroy(Projet $projet)
    {
        if ($this->shouldDeleteStoredImage($projet->image_path)) {
            Storage::disk('public')->delete($projet->image_path);
        }

        $projet->delete();

        return response()->json(['success' => true]);
    }
}
