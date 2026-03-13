<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        if (!Schema::hasColumn('formation_user', 'responsable_nom')) {
            Schema::table('formation_user', function (Blueprint $table) {
                $table->string('responsable_nom')->nullable();
                $table->string('responsable_prenom')->nullable();
                $table->string('civilite')->nullable();
                $table->string('fonction')->nullable();
                $table->string('email')->nullable();
                $table->string('telephone')->nullable();
                $table->string('mobile')->nullable();
                $table->string('societe')->nullable();
                $table->string('adresse_societe')->nullable();
                $table->string('facturation')->nullable();
            });
        }
    }

    public function down()
    {
        if (Schema::hasColumn('formation_user', 'responsable_nom')) {
            Schema::table('formation_user', function (Blueprint $table) {
                $table->dropColumn([
                    'responsable_nom', 'responsable_prenom', 'civilite', 'fonction',
                    'email', 'telephone', 'mobile', 'societe', 'adresse_societe', 'facturation'
                ]);
            });
        }
    }

};
