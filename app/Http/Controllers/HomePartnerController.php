<?php

namespace App\Http\Controllers;

use App\Models\HomePartner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class HomePartnerController extends Controller
{
    private const DEFAULT_PARTNERS = [
        [
            'name' => 'vvavesoft',
            'image_path' => '/images/partenaire/pat1.webp',
            'is_active' => true,
            'sort_order' => 10,
        ],
        [
            'name' => 'asterbox',
            'image_path' => '/images/partenaire/pat2.webp',
            'is_active' => true,
            'sort_order' => 20,
        ],
        [
            'name' => 'gynod',
            'image_path' => '/images/partenaire/pat3.webp',
            'is_active' => true,
            'sort_order' => 30,
        ],
        [
            'name' => 'dip afrique',
            'image_path' => '/images/partenaire/pat4.webp',
            'is_active' => true,
            'sort_order' => 40,
        ],
        [
            'name' => 'dylog',
            'image_path' => '/images/partenaire/pat5.webp',
            'is_active' => true,
            'sort_order' => 50,
        ],
        [
            'name' => 'lacsoft',
            'image_path' => '/images/partenaire/pat6.webp',
            'is_active' => true,
            'sort_order' => 60,
        ],
        [
            'name' => 'orchestra',
            'image_path' => '/images/partenaire/pat7.webp',
            'is_active' => true,
            'sort_order' => 70,
        ],
        [
            'name' => 'sage',
            'image_path' => '/images/partenaire/pat8.webp',
            'is_active' => true,
            'sort_order' => 80,
        ],
        [
            'name' => 'sensoft',
            'image_path' => '/images/partenaire/pat9.webp',
            'is_active' => true,
            'sort_order' => 90,
        ],
        [
            'name' => 'show box',
            'image_path' => '/images/partenaire/pat10.webp',
            'is_active' => true,
            'sort_order' => 100,
        ],
    ];

    private function seedDefaultsIfEmpty(): void
    {
        if (HomePartner::query()->exists()) {
            return;
        }

        $rows = collect(self::DEFAULT_PARTNERS)->map(function (array $item) {
            return [
                'name' => $item['name'],
                'image_path' => $item['image_path'],
                'is_active' => $item['is_active'] ?? true,
                'sort_order' => $item['sort_order'] ?? 0,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        })->all();

        HomePartner::insert($rows);
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

    public function index()
    {
        $this->seedDefaultsIfEmpty();

        return response()->json(
            HomePartner::query()
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
            HomePartner::query()
                ->orderBy('sort_order')
                ->orderByDesc('id')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'image' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        $validated['image_path'] = $request->file('image')->store('home-partners', 'public');
        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['sort_order'] = (int) ($validated['sort_order'] ?? 0);

        unset($validated['image']);

        $partner = HomePartner::create($validated);

        return response()->json($partner, 201);
    }

    public function update(Request $request, HomePartner $partner)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        if ($request->hasFile('image')) {
            if ($this->shouldDeleteStoredImage($partner->image_path)) {
                Storage::disk('public')->delete($partner->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('home-partners', 'public');
        }

        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['sort_order'] = (int) ($validated['sort_order'] ?? 0);

        unset($validated['image']);

        $partner->update($validated);

        return response()->json($partner->fresh());
    }

    public function destroy(HomePartner $partner)
    {
        if ($this->shouldDeleteStoredImage($partner->image_path)) {
            Storage::disk('public')->delete($partner->image_path);
        }

        $partner->delete();

        return response()->json(['success' => true]);
    }
}
