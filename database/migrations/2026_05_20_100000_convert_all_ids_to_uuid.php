<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $fkConstraints = [
        ['utilisateurs', 'utilisateurs_id_pays_foreign'],
        ['categories_produits', 'categories_produits_parent_id_foreign'],
        ['produits', 'produits_id_categorie_foreign'],
        ['produits', 'produits_id_pays_foreign'],
        ['produits', 'produits_id_utilisateur_foreign'],
        ['formations', 'formations_id_pays_foreign'],
        ['commandes', 'commandes_id_utilisateur_foreign'],
        ['ligne_commandes', 'ligne_commandes_id_commande_foreign'],
        ['ligne_commandes', 'ligne_commandes_id_produit_foreign'],
        ['paiements', 'paiements_id_commande_foreign'],
        ['paiements', 'paiements_id_formation_foreign'],
        ['paiements', 'paiements_id_utilisateur_foreign'],
        ['factures', 'factures_id_paiement_foreign'],
        ['factures', 'factures_id_pays_foreign'],
        ['livraisons', 'livraisons_id_commande_foreign'],
        ['tickets_support', 'tickets_support_id_utilisateur_foreign'],
        ['blogs', 'blogs_id_utilisateur_foreign'],
        ['commentaires', 'commentaires_id_utilisateur_foreign'],
        ['reservation_formation', 'reservation_formation_id_formation_foreign'],
        ['reservation_formation', 'reservation_formation_id_utilisateur_foreign'],
        ['reservation_formation', 'reservation_formation_id_entreprise_foreign'],
        ['audit_logs', 'audit_logs_id_utilisateur_foreign'],
        ['suivi_techniques', 'suivi_techniques_id_utilisateur_foreign'],
        ['formation_user', 'formation_user_id_formation_foreign'],
        ['formation_user', 'formation_user_id_utilisateur_foreign'],
        ['formation_participants', 'formation_participants_id_formation_foreign'],
        ['formation_participants', 'formation_participants_id_utilisateur_foreign'],
        ['admin_logs', 'admin_logs_admin_id_foreign'],
    ];

    private array $uuidTables = [
        'produits'               => ['pk' => 'id_produit', 'has_uuid' => true],
        'utilisateurs'           => ['pk' => 'id_utilisateur', 'has_uuid' => true],
        'formations'             => ['pk' => 'id_formation', 'has_uuid' => true],
        'commandes'              => ['pk' => 'id_commande', 'has_uuid' => true],
        'paiements'              => ['pk' => 'id_paiement', 'has_uuid' => true],
        // 'categorie_produits' (singular) exists but isn't used by models; keep UUIDs consistent.
        'pays'                   => ['pk' => 'id_pays', 'has_uuid' => false],
        'categorie_produits'     => ['pk' => 'id_categorie', 'has_uuid' => false],
        'categories_produits'    => ['pk' => 'id_categorie', 'has_uuid' => false],
        'ligne_commandes'        => ['pk' => 'id_ligne', 'has_uuid' => false],
        'factures'               => ['pk' => 'id_facture', 'has_uuid' => false],
        'livraisons'             => ['pk' => 'id_livraison', 'has_uuid' => false],
        'tickets_support'        => ['pk' => 'id_ticket', 'has_uuid' => false],
        'blogs'                  => ['pk' => 'id_blog', 'has_uuid' => false],
        'commentaires'           => ['pk' => 'id_commentaire', 'has_uuid' => false],
        'images'                 => ['pk' => 'id_image', 'has_uuid' => false],
        'entreprises'            => ['pk' => 'id_entreprise', 'has_uuid' => false],
        'reservation_formation'  => ['pk' => 'id_reservation', 'has_uuid' => false],
        'audit_logs'             => ['pk' => 'id_log', 'has_uuid' => false],
        'suivi_techniques'       => ['pk' => 'id_suivi', 'has_uuid' => false],
        'archivages'             => ['pk' => 'id_archivage', 'has_uuid' => false],
        'formation_user'         => ['pk' => 'id', 'has_uuid' => false],
        'formation_participants' => ['pk' => 'id', 'has_uuid' => false],
        'newsletters'            => ['pk' => 'id', 'has_uuid' => false],
        'revendeur_demandes'     => ['pk' => 'id', 'has_uuid' => false],
        'contact_messages'       => ['pk' => 'id', 'has_uuid' => false],
        'home_marketing_cards'   => ['pk' => 'id', 'has_uuid' => false],
        'home_testimonials'      => ['pk' => 'id', 'has_uuid' => false],
        'home_collaborators'     => ['pk' => 'id', 'has_uuid' => false],
        'home_partners'          => ['pk' => 'id', 'has_uuid' => false],
        'devis_prestations'      => ['pk' => 'id', 'has_uuid' => false],
        'form_mail_routes'       => ['pk' => 'id', 'has_uuid' => false],
        'home_geovision_sections'=> ['pk' => 'id', 'has_uuid' => false],
        'projets'                => ['pk' => 'id', 'has_uuid' => false],
        'platform_promotions'    => ['pk' => 'id', 'has_uuid' => false],
        'admin_logs'             => ['pk' => 'id', 'has_uuid' => false],
    ];

    private array $fkConversions = [
        ['utilisateurs', 'id_pays', 'pays'],
        ['categories_produits', 'parent_id', 'categories_produits'],
        ['produits', 'id_categorie', 'categories_produits'],
        ['produits', 'id_pays', 'pays'],
        ['produits', 'id_utilisateur', 'utilisateurs'],
        ['formations', 'id_pays', 'pays'],
        ['commandes', 'id_utilisateur', 'utilisateurs'],
        ['ligne_commandes', 'id_commande', 'commandes'],
        ['ligne_commandes', 'id_produit', 'produits'],
        ['paiements', 'id_commande', 'commandes'],
        ['paiements', 'id_formation', 'formations'],
        ['paiements', 'id_utilisateur', 'utilisateurs'],
        ['paiements', 'id_produit', 'produits'],
        ['factures', 'id_paiement', 'paiements'],
        ['factures', 'id_pays', 'pays'],
        ['livraisons', 'id_commande', 'commandes'],
        ['tickets_support', 'id_utilisateur', 'utilisateurs'],
        ['blogs', 'id_utilisateur', 'utilisateurs'],
        ['commentaires', 'id_utilisateur', 'utilisateurs'],
        ['reservation_formation', 'id_formation', 'formations'],
        ['reservation_formation', 'id_utilisateur', 'utilisateurs'],
        ['reservation_formation', 'id_entreprise', 'entreprises'],
        ['audit_logs', 'id_utilisateur', 'utilisateurs'],
        ['suivi_techniques', 'id_utilisateur', 'utilisateurs'],
        ['admin_logs', 'admin_id', 'utilisateurs'],
        ['formation_user', 'id_formation', 'formations'],
        ['formation_user', 'id_utilisateur', 'utilisateurs'],
        ['formation_participants', 'id_formation', 'formations'],
        ['formation_participants', 'id_utilisateur', 'utilisateurs'],
    ];

    private array $nullableFks = [
        ['paiements', 'id_commande'],
        ['paiements', 'id_formation'],
        ['paiements', 'id_produit'],
        ['produits', 'id_utilisateur'],
        ['reservation_formation', 'id_utilisateur'],
        ['reservation_formation', 'id_entreprise'],
        ['audit_logs', 'id_utilisateur'],
        ['suivi_techniques', 'id_utilisateur'],
        ['categories_produits', 'parent_id'],
        ['factures', 'id_pays'],
    ];

    public function up(): void
    {
        $this->dropForeignKeys();
        $this->addMissingUuidColumns();
        $this->swapPrimaryKeys();       // uuid → PK,  old PK → PK_old (keep _old for FK conversion)
        $this->convertForeignKeys();
        $this->convertPolymorphicColumns();
        $this->convertAuditLogTargets();
        $this->dropOldColumns();         // now safe to drop _old
        $this->recreateForeignKeys();
    }

    public function down(): void
    {
        throw new RuntimeException('Irréversible. Utilisez migrate:fresh --seed pour repartir de zéro.');
    }

    private function dropForeignKeys(): void
    {
        foreach ($this->fkConstraints as [$table, $constraint]) {
            if ($this->constraintExists($table, $constraint)) {
                DB::statement("ALTER TABLE \"{$table}\" DROP CONSTRAINT \"{$constraint}\"");
            }
        }
    }

    private function constraintExists(string $table, string $constraint): bool
    {
        return DB::selectOne(
            "SELECT 1 FROM pg_constraint c
             JOIN pg_class t ON t.oid = c.conrelid
             WHERE t.relname = ? AND c.conname = ?",
            [$table, $constraint]
        ) !== null;
    }

    private function addMissingUuidColumns(): void
    {
        foreach ($this->uuidTables as $table => $config) {
            if (!Schema::hasTable($table)) {
                continue;
            }
            if ($config['has_uuid']) {
                continue;
            }
            if (!Schema::hasColumn($table, 'uuid')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->uuid('uuid')->unique()->nullable();
                });
            }
            DB::table($table)->whereNull('uuid')->update(['uuid' => DB::raw('gen_random_uuid()')]);
            Schema::table($table, function (Blueprint $t) {
                $t->uuid('uuid')->nullable(false)->change();
            });
        }
    }

    private function swapPrimaryKeys(): void
    {
        foreach ($this->uuidTables as $table => $config) {
            if (!Schema::hasTable($table)) {
                continue;
            }
            $pk = $config['pk'];

            if (!Schema::hasColumn($table, 'uuid') || !Schema::hasColumn($table, $pk)) {
                continue;
            }

            $pkeyName = "{$table}_pkey";
            DB::statement("ALTER TABLE \"{$table}\" DROP CONSTRAINT \"{$pkeyName}\" CASCADE");
            DB::statement("ALTER TABLE \"{$table}\" RENAME COLUMN \"{$pk}\" TO \"{$pk}_old\"");
            DB::statement("ALTER TABLE \"{$table}\" RENAME COLUMN \"uuid\" TO \"{$pk}\"");
            DB::statement("ALTER TABLE \"{$table}\" ADD PRIMARY KEY (\"{$pk}\")");
        }
    }

    private function convertForeignKeys(): void
    {
        foreach ($this->fkConversions as [$childTable, $fkColumn, $parentTable]) {
            if (!Schema::hasTable($childTable) || !Schema::hasTable($parentTable)) {
                continue;
            }
            $parentPk = $this->uuidTables[$parentTable]['pk'];
            $tempColumn = "{$fkColumn}_u";

            if (!Schema::hasColumn($childTable, $fkColumn)) {
                continue;
            }

            Schema::table($childTable, function (Blueprint $t) use ($tempColumn) {
                $t->uuid($tempColumn)->nullable();
            });

            DB::statement("
                UPDATE \"{$childTable}\" c
                SET \"{$tempColumn}\" = p.\"{$parentPk}\"
                FROM \"{$parentTable}\" p
                WHERE c.\"{$fkColumn}\" = p.\"{$parentPk}_old\"
            ");

            Schema::table($childTable, function (Blueprint $t) use ($fkColumn) {
                $t->dropColumn($fkColumn);
            });

            DB::statement("ALTER TABLE \"{$childTable}\" RENAME COLUMN \"{$tempColumn}\" TO \"{$fkColumn}\"");

            $isNullable = in_array([$childTable, $fkColumn], $this->nullableFks);
            $nullAction = $isNullable ? 'DROP NOT NULL' : 'SET NOT NULL';
            DB::statement("ALTER TABLE \"{$childTable}\" ALTER COLUMN \"{$fkColumn}\" {$nullAction}");
        }
    }

    private function dropOldColumns(): void
    {
        foreach ($this->uuidTables as $table => $config) {
            if (!Schema::hasTable($table)) {
                continue;
            }
            $pk = $config['pk'];
            $oldCol = "{$pk}_old";
            if (Schema::hasColumn($table, $oldCol)) {
                Schema::table($table, function (Blueprint $t) use ($oldCol) {
                    $t->dropColumn($oldCol);
                });
            }
        }
    }

    private function recreateForeignKeys(): void
    {
        $fkDefs = [
            ['utilisateurs', 'id_pays', 'pays', 'CASCADE'],
            ['categories_produits', 'parent_id', 'categories_produits', 'SET NULL'],
            ['produits', 'id_categorie', 'categories_produits', 'RESTRICT'],
            ['produits', 'id_pays', 'pays', 'CASCADE'],
            ['produits', 'id_utilisateur', 'utilisateurs', 'SET NULL'],
            ['formations', 'id_pays', 'pays', 'CASCADE'],
            ['commandes', 'id_utilisateur', 'utilisateurs', 'CASCADE'],
            ['ligne_commandes', 'id_commande', 'commandes', 'CASCADE'],
            ['ligne_commandes', 'id_produit', 'produits', 'CASCADE'],
            ['paiements', 'id_commande', 'commandes', 'CASCADE'],
            ['paiements', 'id_formation', 'formations', 'CASCADE'],
            ['paiements', 'id_utilisateur', 'utilisateurs', 'CASCADE'],
            ['paiements', 'id_produit', 'produits', 'SET NULL'],
            ['factures', 'id_paiement', 'paiements', 'CASCADE'],
            ['factures', 'id_pays', 'pays', 'SET NULL'],
            ['livraisons', 'id_commande', 'commandes', 'CASCADE'],
            ['tickets_support', 'id_utilisateur', 'utilisateurs', 'CASCADE'],
            ['blogs', 'id_utilisateur', 'utilisateurs', 'CASCADE'],
            ['commentaires', 'id_utilisateur', 'utilisateurs', 'CASCADE'],
            ['reservation_formation', 'id_formation', 'formations', 'CASCADE'],
            ['reservation_formation', 'id_utilisateur', 'utilisateurs', 'SET NULL'],
            ['reservation_formation', 'id_entreprise', 'entreprises', 'SET NULL'],
            ['audit_logs', 'id_utilisateur', 'utilisateurs', 'SET NULL'],
            ['suivi_techniques', 'id_utilisateur', 'utilisateurs', 'SET NULL'],
            ['admin_logs', 'admin_id', 'utilisateurs', 'CASCADE'],
            ['formation_user', 'id_formation', 'formations', 'CASCADE'],
            ['formation_user', 'id_utilisateur', 'utilisateurs', 'CASCADE'],
            ['formation_participants', 'id_formation', 'formations', 'CASCADE'],
            ['formation_participants', 'id_utilisateur', 'utilisateurs', 'CASCADE'],
        ];

        foreach ($fkDefs as [$childTable, $fkColumn, $parentTable, $onDelete]) {
            if (!Schema::hasTable($childTable) || !Schema::hasTable($parentTable)) {
                continue;
            }
            if (!Schema::hasColumn($childTable, $fkColumn)) {
                continue;
            }
            $constraint = "{$childTable}_{$fkColumn}_foreign";
            $parentPk = $this->uuidTables[$parentTable]['pk'];
            if ($this->constraintExists($childTable, $constraint)) {
                continue;
            }

            DB::statement("
                ALTER TABLE \"{$childTable}\"
                ADD CONSTRAINT \"{$constraint}\"
                FOREIGN KEY (\"{$fkColumn}\")
                REFERENCES \"{$parentTable}\"(\"{$parentPk}\")
                ON DELETE {$onDelete}
            ");
        }
    }

    private function convertPolymorphicColumns(): void
    {
        foreach (['images', 'commentaires', 'archivages'] as $table) {
            if (!Schema::hasTable($table)) {
                continue;
            }
            $prefix = match ($table) {
                'images' => 'imageable',
                'commentaires' => 'commentable',
                'archivages' => 'archivable',
            };
            $typeCol = "{$prefix}_type";
            $idCol = "{$prefix}_id";

            if (!Schema::hasColumn($table, $idCol)) {
                continue;
            }

            $tempCol = "{$idCol}_uuid";

            Schema::table($table, function (Blueprint $t) use ($tempCol) {
                $t->uuid($tempCol)->nullable();
            });

            foreach (['formations', 'produits', 'blogs'] as $parentTable) {
                $morphType = strtoupper($parentTable === 'formations' ? 'FORMATION' : ($parentTable === 'produits' ? 'PRODUIT' : 'BLOG'));
                $parentPk = $this->uuidTables[$parentTable]['pk'];

                DB::statement("
                    UPDATE \"{$table}\" c
                    SET \"{$tempCol}\" = p.\"{$parentPk}\"
                    FROM \"{$parentTable}\" p
                    WHERE c.\"{$idCol}\" = p.\"{$parentPk}_old\"
                    AND c.\"{$typeCol}\" = '{$morphType}'
                ");
            }

            Schema::table($table, function (Blueprint $t) use ($idCol) {
                $t->dropColumn($idCol);
            });
            DB::statement("ALTER TABLE \"{$table}\" RENAME COLUMN \"{$tempCol}\" TO \"{$idCol}\"");
        }
    }

    private function convertAuditLogTargets(): void
    {
        if (!Schema::hasTable('audit_logs')) {
            return;
        }
        if (!Schema::hasColumn('audit_logs', 'id_cible') || !Schema::hasColumn('audit_logs', 'table_cible')) {
            return;
        }

        $tempCol = 'id_cible_uuid';
        if (!Schema::hasColumn('audit_logs', $tempCol)) {
            Schema::table('audit_logs', function (Blueprint $t) use ($tempCol): void {
                $t->uuid($tempCol)->nullable();
            });
        }

        foreach ($this->uuidTables as $table => $config) {
            if (!Schema::hasTable($table)) {
                continue;
            }
            $parentPk = $config['pk'];
            $oldCol = "{$parentPk}_old";
            if (!Schema::hasColumn($table, $oldCol)) {
                continue;
            }
            $oldType = DB::table('information_schema.columns')
                ->where('table_schema', 'public')
                ->where('table_name', $table)
                ->where('column_name', $oldCol)
                ->value('data_type');
            if (!in_array($oldType, ['bigint', 'integer', 'smallint'], true)) {
                continue;
            }
            $aliases = [$table];
            if (str_ends_with($table, 's') && !in_array($table, ['pays'], true)) {
                $aliases[] = substr($table, 0, -1);
            }

            foreach ($aliases as $alias) {
                DB::statement("
                    UPDATE \"audit_logs\" a
                    SET \"{$tempCol}\" = p.\"{$parentPk}\"
                    FROM \"{$table}\" p
                    WHERE a.\"id_cible\" = p.\"{$parentPk}_old\"
                    AND LOWER(a.\"table_cible\") = '" . strtolower($alias) . "'
                ");
            }
        }

        Schema::table('audit_logs', function (Blueprint $t) {
            $t->dropColumn('id_cible');
        });
        DB::statement("ALTER TABLE \"audit_logs\" RENAME COLUMN \"{$tempCol}\" TO \"id_cible\"");
    }
};
