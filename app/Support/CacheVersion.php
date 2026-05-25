<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

class CacheVersion
{
    public static function key(string $prefix, string $suffix): string
    {
        $version = self::version($prefix);
        return "{$prefix}.v{$version}.{$suffix}";
    }

    public static function bump(string $prefix): void
    {
        $current = self::version($prefix);
        Cache::forever("{$prefix}.version", $current + 1);
    }

    public static function version(string $prefix): int
    {
        return (int) Cache::get("{$prefix}.version", 1);
    }
}
