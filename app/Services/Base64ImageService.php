<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;

class Base64ImageService
{
    public static function encode(UploadedFile $file): array
    {
        return [
            'data' => base64_encode($file->get()),
            'mime' => $file->getMimeType(),
        ];
    }

    public static function response(?string $data, ?string $mime = null)
    {
        if (!$data) {
            abort(404);
        }

        $content = $data;
        $mimeType = $mime ?? 'image/jpeg';

        if (str_starts_with($data, 'data:')) {
            $parts = explode(',', $data, 2);
            $content = isset($parts[1]) ? base64_decode($parts[1]) : base64_decode($parts[0]);
            preg_match('/^data:(image\/\w+);/', $data, $m);
            $mimeType = $m[1] ?? $mimeType;
        } else {
            $content = base64_decode($data);
        }

        return response($content, 200, ['Content-Type' => $mimeType]);
    }
}
