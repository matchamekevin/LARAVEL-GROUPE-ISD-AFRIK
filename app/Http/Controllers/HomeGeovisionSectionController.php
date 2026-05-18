<?php

namespace App\Http\Controllers;

use App\Models\HomeGeovisionSection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class HomeGeovisionSectionController extends Controller
{
    private const DEFAULTS = [
        [
            'title' => 'Caméras',
            'description' => 'Caméras professionnelles pour la surveillance et l\'analyse vidéo.',
            'image_path' => '/images/geovision/cam1.webp',
            'link' => '/geovision?famille=geovision-cameras',
            'sort_order' => 10,
        ],
        [
            'title' => "Contrôle d'accès",
            'description' => 'Contrôleurs et lecteurs pour la gestion des accès sécurisés.',
            'image_path' => '/images/geovision/controleur1.webp',
            'link' => '/geovision?famille=geovision-controle-acces',
            'sort_order' => 20,
        ],
        [
            'title' => 'Enregistreurs',
            'description' => 'Enregistreurs (NVR/DVR) et solutions d\'archivage pour la gestion vidéo.',
            'image_path' => '/images/geovision/nvr1.webp',
            'link' => '/geovision?famille=geovision-enregistreurs-nvr',
            'sort_order' => 30,
        ],
        [
            'title' => 'Solutions',
            'description' => 'Logiciels et services GeoVision : VMS, analytics et intégration.',
            'image_path' => '/images/geovision/solution1.webp',
            'link' => '/geovision?famille=geovision-vms-analytics',
            'sort_order' => 40,
        ],
    ];

    private function seedDefaultsIfEmpty(): void
    {
        if (HomeGeovisionSection::query()->exists()) {
            return;
        }

        $rows = collect(self::DEFAULTS)->map(fn (array $item) => [
            'title' => $item['title'],
            'description' => $item['description'],
            'image_path' => $item['image_path'],
            'link' => $item['link'],
            'sort_order' => $item['sort_order'] ?? 0,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ])->all();

        HomeGeovisionSection::insert($rows);
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
            HomeGeovisionSection::query()
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
            HomeGeovisionSection::query()
                ->orderBy('sort_order')
                ->orderByDesc('id')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:500'],
            'link' => ['nullable', 'string', 'max:500'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('home-geovision', 'public');
        }

        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['sort_order'] = (int) ($validated['sort_order'] ?? 0);

        unset($validated['image']);

        $section = HomeGeovisionSection::create($validated);

        return response()->json($section, 201);
    }

    public function update(Request $request, HomeGeovisionSection $section)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:500'],
            'link' => ['nullable', 'string', 'max:500'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        if ($request->hasFile('image')) {
            if ($this->shouldDeleteStoredImage($section->image_path)) {
                Storage::disk('public')->delete($section->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('home-geovision', 'public');
        }

        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['sort_order'] = (int) ($validated['sort_order'] ?? 0);

        unset($validated['image']);

        $section->update($validated);

        return response()->json($section->fresh());
    }

    public function destroy(HomeGeovisionSection $section)
    {
        if ($this->shouldDeleteStoredImage($section->image_path)) {
            Storage::disk('public')->delete($section->image_path);
        }

        $section->delete();

        return response()->json(['success' => true]);
    }
}
