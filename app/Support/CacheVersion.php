<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

class CacheVersion
{
    private const VERSION_PREFIX = 'cv_';

    public static function key(string $prefix, string $suffix): string
    {
        $version = self::version($prefix);

        return "{$prefix}.v{$version}.{$suffix}";
    }

    public static function bump(string $prefix): void
    {
        $current = self::version($prefix);
        Cache::forever(self::VERSION_PREFIX."{$prefix}.version", $current + 1);
    }

    public static function version(string $prefix): int
    {
        return (int) Cache::get(self::VERSION_PREFIX."{$prefix}.version", 1);
    }

    public static function allVersions(): array
    {
        $prefixes = [
            'produits', 'formations', 'categories', 'pays',
            'commandes', 'paiements', 'commentaires', 'images',
            'blogs', 'home', 'projets', 'newsletter',
            'revendeurs', 'devis', 'messages', 'utilisateurs',
        ];

        $versions = [];
        foreach ($prefixes as $prefix) {
            $versions[$prefix] = self::version($prefix);
        }

        return $versions;
    }

    public static function hash(): string
    {
        $versions = self::allVersions();

        return md5(implode('|', array_map(
            fn ($k, $v) => "{$k}:{$v}",
            array_keys($versions),
            $versions
        )));
    }
}
