<?php

namespace App\Http\Controllers;

use App\Models\HomeTestimonial;
use App\Services\Base64ImageService;
use Illuminate\Http\Request;

class HomeTestimonialController extends Controller
{
    private const DEFAULT_TESTIMONIALS = [
        [
            'name' => 'Plateforme Industrielle d\'Adetikope (PIA)',
            'role' => 'Direction Generale',
            'company' => 'PIA',
            'text' => 'Nous avons choisi ISD AFRIK pour accompagner notre developpement industriel. Leur expertise digitale nous a permis de fluidifier nos processus et de renforcer notre competitivite.',
            'rating' => 5,
            'avatar_path' => '/images/avis/pia.webp',
            'is_active' => true,
            'sort_order' => 10,
        ],
        [
            'name' => 'CANAL+',
            'role' => 'Direction Technique',
            'company' => 'CANAL+',
            'text' => 'ISD AFRIK est un partenaire fiable qui comprend nos enjeux. Grace a leurs solutions, nous avons ameliore l\'experience de nos abonnes et optimise nos operations internes.',
            'rating' => 5,
            'avatar_path' => '/images/avis/canal.webp',
            'is_active' => true,
            'sort_order' => 20,
        ],
        [
            'name' => 'Hotel Sarakawa',
            'role' => 'Direction Hoteliere',
            'company' => 'Hotel Sarakawa',
            'text' => 'Avec ISD AFRIK, nous avons modernise notre gestion et renforce la satisfaction de nos clients. Leur accompagnement est un vrai atout pour l\'hotellerie.',
            'rating' => 4,
            'avatar_path' => '/images/avis/sarakawa.webp',
            'is_active' => true,
            'sort_order' => 30,
        ],
        [
            'name' => 'ASKY Airlines',
            'role' => 'Direction des Operations',
            'company' => 'ASKY',
            'text' => 'ISD AFRIK nous aide a digitaliser nos processus et a offrir un meilleur service a nos passagers. Leur expertise est un levier strategique pour notre croissance panafricaine.',
            'rating' => 5,
            'avatar_path' => '/images/avis/asky.webp',
            'is_active' => true,
            'sort_order' => 40,
        ],
        [
            'name' => 'ORYX Energies',
            'role' => 'Direction Commerciale',
            'company' => 'ORYX Energies',
            'text' => 'Nous faisons confiance a ISD AFRIK pour la gestion de nos donnees et la digitalisation de nos services. Leur professionnalisme nous accompagne dans notre expansion.',
            'rating' => 5,
            'avatar_path' => '/images/avis/oryx.webp',
            'is_active' => true,
            'sort_order' => 50,
        ],
        [
            'name' => 'SUNU Bank',
            'role' => 'Direction Generale',
            'company' => 'SUNU Bank',
            'text' => 'ISD AFRIK est un partenaire strategique qui nous apporte des solutions fiables et securisees. Leur expertise renforce notre efficacite et la confiance de nos clients.',
            'rating' => 5,
            'avatar_path' => '/images/avis/sunu.webp',
            'is_active' => true,
            'sort_order' => 60,
        ],
    ];

    private function seedDefaultsIfEmpty(): void
    {
        if (HomeTestimonial::query()->exists()) {
            return;
        }

        $rows = collect(self::DEFAULT_TESTIMONIALS)->map(function (array $item) {
            return [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                ...$item,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        })->all();

        HomeTestimonial::insert($rows);
    }

    public function index()
    {
        $this->seedDefaultsIfEmpty();

        return response()->json(
            HomeTestimonial::query()
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
            HomeTestimonial::query()
                ->orderBy('sort_order')
                ->orderByDesc('id')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'role' => ['nullable', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
            'text' => ['required', 'string'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'avatar' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        $encoded = Base64ImageService::encode($request->file('avatar'));
        $validated['avatar_data'] = $encoded['data'];
        $validated['avatar_mime'] = $encoded['mime'];
        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['sort_order'] = (int) ($validated['sort_order'] ?? 0);
        $validated['rating'] = (int) $validated['rating'];

        unset($validated['avatar']);

        $testimonial = HomeTestimonial::create($validated);

        return response()->json($testimonial, 201);
    }

    public function update(Request $request, HomeTestimonial $testimonial)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'role' => ['nullable', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
            'text' => ['required', 'string'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        if ($request->hasFile('avatar')) {
            $encoded = Base64ImageService::encode($request->file('avatar'));
            $validated['avatar_data'] = $encoded['data'];
            $validated['avatar_mime'] = $encoded['mime'];
        }

        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['sort_order'] = (int) ($validated['sort_order'] ?? 0);
        $validated['rating'] = (int) $validated['rating'];

        unset($validated['avatar']);

        $testimonial->update($validated);

        return response()->json($testimonial->fresh());
    }

    public function image(HomeTestimonial $testimonial)
    {
        if ($testimonial->avatar_data) {
            return Base64ImageService::response($testimonial->avatar_data, $testimonial->avatar_mime);
        }
        abort(404);
    }

    public function destroy(HomeTestimonial $testimonial)
    {
        $testimonial->delete();

        return response()->json(['success' => true]);
    }
}
