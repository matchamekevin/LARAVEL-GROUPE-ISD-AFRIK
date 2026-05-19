<?php

namespace App\Http\Controllers;

use App\Models\Projet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProjetController extends Controller
{
    public function image(Projet $projet)
    {
        if ($projet->image_data) {
            $data = $projet->image_data;

            if (str_starts_with($data, 'data:')) {
                $parts = explode(',', $data, 2);
                $content = isset($parts[1]) ? base64_decode($parts[1]) : base64_decode($parts[0]);
                preg_match('/^data:(image\/\w+);/', $data, $mime);
                $mimeType = $mime[1] ?? 'image/jpeg';
            } else {
                $content = base64_decode($data);
                $mimeType = 'image/jpeg';
            }

            return response($content, 200, ['Content-Type' => $mimeType]);
        }

        if ($projet->image_path && Storage::disk('public')->exists($projet->image_path)) {
            return response()->file(Storage::disk('public')->path($projet->image_path));
        }

        return self::placeholderResponse();
    }

    private static function placeholderResponse()
    {
        $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#f1f5f9"/>
  <g transform="translate(400,260)" fill="#94a3b8">
    <rect x="-40" y="-30" width="80" height="60" rx="8" opacity="0.4"/>
    <circle cx="0" cy="0" r="12" opacity="0.4"/>
  </g>
  <text x="400" y="330" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" fill="#94a3b8">Image non disponible</text>
</svg>';
        return response($svg, 200, ['Content-Type' => 'image/svg+xml', 'Cache-Control' => 'no-cache']);
    }

    public function index()
    {
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
            $file = $request->file('image');
            $mime = $file->getMimeType();
            $b64 = base64_encode($file->get());
            $validated['image_data'] = 'data:' . $mime . ';base64,' . $b64;
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
            $file = $request->file('image');
            $mime = $file->getMimeType();
            $b64 = base64_encode($file->get());
            $validated['image_data'] = 'data:' . $mime . ';base64,' . $b64;
        }

        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['sort_order'] = (int) ($validated['sort_order'] ?? 0);

        unset($validated['image']);

        $projet->update($validated);

        return response()->json($projet->fresh());
    }

    public function destroy(Projet $projet)
    {
        $projet->delete();

        return response()->json(['success' => true]);
    }
}
