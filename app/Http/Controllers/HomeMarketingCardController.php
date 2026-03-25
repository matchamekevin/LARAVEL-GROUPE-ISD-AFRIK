<?php

namespace App\Http\Controllers;

use App\Models\HomeMarketingCard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class HomeMarketingCardController extends Controller
{
    private const DEFAULT_CARDS = [
        [
            'section' => 'offer',
            'title' => 'Gestion commerciale',
            'description' => "Motivation de l'equipe commerciale dans l'atteinte des objectifs.",
            'meta_text' => 'Inscription ouverte',
            'cta_label' => 'Je profite',
            'target_url' => '/formations',
            'image_path' => '/images/offers/offre1.webp',
            'is_active' => true,
            'sort_order' => 10,
        ],
        [
            'section' => 'offer',
            'title' => 'Organisation administrative et financiere',
            'description' => 'Conformite au SYSCOHADA revise et meilleure organisation administrative.',
            'meta_text' => 'Inscription ouverte',
            'cta_label' => 'Je profite',
            'target_url' => '/formations',
            'image_path' => '/images/offers/offre2.webp',
            'is_active' => true,
            'sort_order' => 20,
        ],
        [
            'section' => 'offer',
            'title' => 'Paie et ressources humaines',
            'description' => 'Maitrise des outils RH, optimisation du personnel et conformite sociale.',
            'meta_text' => 'Inscription ouverte',
            'cta_label' => 'Je profite',
            'target_url' => '/formations',
            'image_path' => '/images/offers/offre3.webp',
            'is_active' => true,
            'sort_order' => 30,
        ],
        [
            'section' => 'featured_product',
            'title' => "Solutions de gestion d'entreprise",
            'badge_text' => 'Logiciels',
            'meta_text' => 'Sur mesure',
            'cta_label' => 'En savoir plus',
            'target_url' => '/solutions',
            'image_path' => '/images/solutions/im1.webp',
            'is_active' => true,
            'sort_order' => 10,
        ],
        [
            'section' => 'featured_product',
            'title' => 'Formation professionnelle',
            'badge_text' => 'Formation',
            'meta_text' => 'Certifications',
            'cta_label' => 'En savoir plus',
            'target_url' => '/formations',
            'image_path' => '/images/solutions/im2.webp',
            'is_active' => true,
            'sort_order' => 20,
        ],
        [
            'section' => 'featured_product',
            'title' => 'Ingenierie informatique et industrielle',
            'badge_text' => 'Ingenierie',
            'meta_text' => 'Expertise IT',
            'cta_label' => 'En savoir plus',
            'target_url' => '/solutions',
            'image_path' => '/images/solutions/im3.webp',
            'is_active' => true,
            'sort_order' => 30,
        ],
        [
            'section' => 'featured_product',
            'title' => 'Fourniture et formation en pilotage de drones',
            'badge_text' => 'Drone',
            'meta_text' => 'Drone Pro',
            'cta_label' => 'En savoir plus',
            'target_url' => '/produits?categories=drone-formation',
            'image_path' => '/images/solutions/im4.webp',
            'is_active' => true,
            'sort_order' => 40,
        ],
        [
            'section' => 'home_promotion',
            'title' => 'Promotion Ingenierie',
            'cta_label' => 'Decouvrir',
            'target_url' => '/produits?categories=ingenierie',
            'image_path' => '/images/promotions/promo9.webp',
            'is_active' => true,
            'sort_order' => 10,
        ],
        [
            'section' => 'home_promotion',
            'title' => 'Promotion Solutions',
            'cta_label' => 'Decouvrir',
            'target_url' => '/solutions',
            'image_path' => '/images/promotions/promo10.webp',
            'is_active' => true,
            'sort_order' => 20,
        ],
        [
            'section' => 'home_promotion',
            'title' => 'Promotion Drone',
            'cta_label' => 'Decouvrir',
            'target_url' => '/produits?categories=drone-formation',
            'image_path' => '/images/promotions/promo6.webp',
            'is_active' => true,
            'sort_order' => 30,
        ],
        [
            'section' => 'promotion_page',
            'title' => 'Promotion Formation 1',
            'cta_label' => 'Decouvrir',
            'target_url' => '/formations',
            'image_path' => '/images/promotions/promo1.webp',
            'is_active' => true,
            'sort_order' => 10,
        ],
        [
            'section' => 'promotion_page',
            'title' => 'Promotion Formation 2',
            'cta_label' => 'Decouvrir',
            'target_url' => '/formations',
            'image_path' => '/images/promotions/promo2.webp',
            'is_active' => true,
            'sort_order' => 20,
        ],
        [
            'section' => 'promotion_page',
            'title' => 'Promotion Formation 3',
            'cta_label' => 'Decouvrir',
            'target_url' => '/formations',
            'image_path' => '/images/promotions/promo3.webp',
            'is_active' => true,
            'sort_order' => 30,
        ],
        [
            'section' => 'promotion_page',
            'title' => 'Promotion 4',
            'cta_label' => 'Decouvrir',
            'target_url' => '/promotions/promo-4',
            'image_path' => '/images/promotions/promo4.webp',
            'is_active' => true,
            'sort_order' => 40,
        ],
        [
            'section' => 'promotion_page',
            'title' => 'Promotion 5',
            'cta_label' => 'Decouvrir',
            'target_url' => '/produits?categories=drone-formation,fourniture-tpe',
            'image_path' => '/images/promotions/promo5.webp',
            'is_active' => true,
            'sort_order' => 50,
        ],
        [
            'section' => 'promotion_page',
            'title' => 'Promotion 6',
            'cta_label' => 'Decouvrir',
            'target_url' => '/produits?categories=drone-formation,fourniture-tpe',
            'image_path' => '/images/promotions/promo6.webp',
            'is_active' => true,
            'sort_order' => 60,
        ],
        [
            'section' => 'promotion_page',
            'title' => 'Promotion 7',
            'cta_label' => 'Decouvrir',
            'target_url' => '/promotions/promo-7',
            'image_path' => '/images/promotions/promo7.webp',
            'is_active' => true,
            'sort_order' => 70,
        ],
        [
            'section' => 'promotion_page',
            'title' => 'Promotion 8',
            'cta_label' => 'Decouvrir',
            'target_url' => '/promotions/promo-8',
            'image_path' => '/images/promotions/promo8.webp',
            'is_active' => true,
            'sort_order' => 80,
        ],
        [
            'section' => 'promotion_page',
            'title' => 'Promotion 9',
            'cta_label' => 'Decouvrir',
            'target_url' => '/promotions/promo-9',
            'image_path' => '/images/promotions/promo9.webp',
            'is_active' => true,
            'sort_order' => 90,
        ],
        [
            'section' => 'promotion_page',
            'title' => 'Promotion 10',
            'cta_label' => 'Decouvrir',
            'target_url' => '/promotions/promo-10',
            'image_path' => '/images/promotions/promo10.webp',
            'is_active' => true,
            'sort_order' => 100,
        ],
    ];

    private function seedDefaultSections(): void
    {
        $cardsBySection = collect(self::DEFAULT_CARDS)->groupBy('section');

        foreach ($cardsBySection as $section => $cards) {
            $sectionExists = HomeMarketingCard::query()
                ->where('section', $section)
                ->exists();

            if ($sectionExists) {
                continue;
            }

            HomeMarketingCard::insert($cards->map(function (array $card) {
                return [
                    ...$card,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            })->all());
        }
    }

    private function shouldDeleteStoredImage(?string $path): bool
    {
        if (!$path) {
            return false;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return false;
        }

        return !str_starts_with($path, '/');
    }

    public function index(Request $request)
    {
        $this->seedDefaultSections();

        $section = $request->query('section');

        $query = HomeMarketingCard::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id');

        if ($section) {
            $query->where('section', $section);
        }

        return response()->json($query->get());
    }

    public function adminIndex(Request $request)
    {
        $this->seedDefaultSections();

        $section = $request->query('section');

        $query = HomeMarketingCard::query()
            ->orderBy('section')
            ->orderBy('sort_order')
            ->orderByDesc('id');

        if ($section) {
            $query->where('section', $section);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'section' => ['required', Rule::in(HomeMarketingCard::allowedSections())],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'badge_text' => ['nullable', 'string', 'max:255'],
            'meta_text' => ['nullable', 'string', 'max:255'],
            'cta_label' => ['nullable', 'string', 'max:120'],
            'target_url' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'image' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        $validated['image_path'] = $request->file('image')->store('home-marketing', 'public');
        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['sort_order'] = (int) ($validated['sort_order'] ?? 0);

        unset($validated['image']);

        $card = HomeMarketingCard::create($validated);

        return response()->json($card, 201);
    }

    public function update(Request $request, HomeMarketingCard $card)
    {
        $validated = $request->validate([
            'section' => ['required', Rule::in(HomeMarketingCard::allowedSections())],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'badge_text' => ['nullable', 'string', 'max:255'],
            'meta_text' => ['nullable', 'string', 'max:255'],
            'cta_label' => ['nullable', 'string', 'max:120'],
            'target_url' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        if ($request->hasFile('image')) {
            if ($this->shouldDeleteStoredImage($card->image_path)) {
                Storage::disk('public')->delete($card->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('home-marketing', 'public');
        }

        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['sort_order'] = (int) ($validated['sort_order'] ?? 0);

        unset($validated['image']);

        $card->update($validated);

        return response()->json($card->fresh());
    }

    public function destroy(HomeMarketingCard $card)
    {
        if ($this->shouldDeleteStoredImage($card->image_path)) {
            Storage::disk('public')->delete($card->image_path);
        }

        $card->delete();

        return response()->json(['success' => true]);
    }
}
