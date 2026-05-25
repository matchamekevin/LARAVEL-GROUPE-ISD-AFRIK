<?php

use Illuminate\Support\Facades\DB;

$formations = DB::table('formations')->where('categorie', 'entreprise')->get();

$count = 0;

foreach ($formations as $formation) {
    if (empty($formation->benefices)) continue;
    
    $text = $formation->benefices;
    $updates = [];
    
    // Mapping sections to columns
    $mapping = [
        'objectifs' => '/--- OBJECTIFS ---(.*?)---/s',
        'prerequis' => '/--- PRÉREQUIS ---(.*?)---/s',
        'modules' => '/--- CONTENU ---(.*?)---/s',
        'niveau' => '/--- NIVEAU ---(.*?)---/s',
        'cible' => '/--- PUBLIC ---(.*?)---/s',
        'pedagogie' => '/--- MÉTHODES ---(.*?)---/s',
        'materiel' => '/--- SUPPORTS ---(.*?)---/s',
        'certification' => '/--- CERTIFICATION ---(.*?)$/s',
    ];
    
    // Some blocks might not have triple dashes at the end if it's the last one
    // Certification is usually last.
    
    foreach ($mapping as $column => $pattern) {
        if (preg_match($pattern, $text, $matches)) {
            $updates[$column] = trim($matches[1]);
        }
    }
    
    // Fallback for sections that are last but not handled by the mapping above
    // or if the order changes.
    // Let's refine the regex to handle any section between markers.
    
    $sections = preg_split('/--- (.*?) ---/', $text, -1, PREG_SPLIT_DELIM_CAPTURE);
    // Result looks like [text before, TITLE1, content1, TITLE2, content2, ...]
    
    for ($i = 1; $i < count($sections); $i += 2) {
        $title = trim($sections[$i]);
        $content = trim($sections[$i+1]);
        
        switch (strtoupper($title)) {
            case 'OBJECTIFS':
            case 'OBJECTIFS DÉTAILLÉS':
                $updates['objectifs'] = ($updates['objectifs'] ?? '') . "\n" . $content;
                break;
            case 'PRÉREQUIS':
                $updates['prerequis'] = $content;
                break;
            case 'CONTENU':
                $updates['modules'] = $content;
                break;
            case 'NIVEAU':
                $updates['niveau'] = $content;
                break;
            case 'PUBLIC':
                $updates['cible'] = $content;
                break;
            case 'MÉTHODES':
                $updates['pedagogie'] = $content;
                break;
            case 'SUPPORTS':
                $updates['materiel'] = $content;
                break;
            case 'CERTIFICATION':
                $updates['certification'] = $content;
                break;
        }
    }
    
    if (!empty($updates)) {
        // Clean up leading/trailing newlines
        foreach ($updates as $k => $v) $updates[$k] = trim($v);
        
        DB::table('formations')->where('id_formation', $formation->id_formation)->update($updates);
        $count++;
    }
}

echo "Cleaned up $count formations.\n";
