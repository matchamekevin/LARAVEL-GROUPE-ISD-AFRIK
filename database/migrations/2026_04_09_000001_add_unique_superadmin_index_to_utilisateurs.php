<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class AddUniqueSuperadminIndexToUtilisateurs extends Migration
{
    /**
     * Run the migrations.
     *
     * This creates a partial unique index on PostgreSQL to ensure there
     * is at most one active user with admin_role = 'superadmin'.
     */
    public function up()
    {
        // Ensure we're running on PostgreSQL. If not, skip safely.
        $driver = DB::getPdo()->getAttribute(\PDO::ATTR_DRIVER_NAME) ?? null;
        if ($driver !== 'pgsql') {
            return;
        }

        // Defensive check: abort if multiple active superadmins exist.
        $count = DB::table('utilisateurs')
            ->whereNull('deleted_at')
            ->whereRaw("LOWER(COALESCE(admin_role, '')) = 'superadmin'")
            ->count();

        if ($count > 1) {
            throw new \Exception("Migration aborted: found {$count} active superadmin accounts. Resolve duplicates before running this migration.");
        }

        // Create a partial unique index. The index is over a constant expression
        // so that only rows matching the WHERE clause are included; uniqueness
        // of that constant prevents more than one matching row.
        DB::statement("CREATE UNIQUE INDEX IF NOT EXISTS unique_single_superadmin ON utilisateurs ((1)) WHERE LOWER(COALESCE(admin_role, '')) = 'superadmin' AND deleted_at IS NULL;");
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        $driver = DB::getPdo()->getAttribute(\PDO::ATTR_DRIVER_NAME) ?? null;
        if ($driver !== 'pgsql') {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS unique_single_superadmin;');
    }
}
