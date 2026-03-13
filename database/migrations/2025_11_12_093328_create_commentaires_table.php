<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commentaires', function (Blueprint $table) {
            $table->bigIncrements('id_commentaire'); // Clé primaire

            $table->text('contenu'); // Texte du commentaire
            $table->integer('note')->nullable(); // Note optionnelle (1 à 5)
            $table->timestamp('date')->useCurrent(); // Date personnalisée

            // Polymorphisme : commentaire lié à produit, formation ou blog
            $table->string('commentable_type', 50);
            $table->bigInteger('commentable_id');

            // Relation avec utilisateur
            $table->unsignedBigInteger('id_utilisateur');

            $table->timestamps();

            // Clé étrangère vers utilisateurs
            $table->foreign('id_utilisateur')
                  ->references('id_utilisateur')
                  ->on('utilisateurs')
                  ->onDelete('cascade');
        });

        // Contraintes CHECK PostgreSQL
        DB::statement("
            ALTER TABLE commentaires 
            ADD CONSTRAINT commentaire_note_check 
            CHECK (note IS NULL OR (note >= 1 AND note <= 5))
        ");

        DB::statement("
            ALTER TABLE commentaires 
            ADD CONSTRAINT commentaire_type_check 
            CHECK (commentable_type IN ('PRODUIT','FORMATION','BLOG'))
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('commentaires');
    }
};