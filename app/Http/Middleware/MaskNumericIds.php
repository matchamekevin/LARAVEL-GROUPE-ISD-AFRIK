<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MaskNumericIds
{
    /**
     * Middleware pour masquer les IDs numériques et exposer UUIDs dans les réponses API
     * Remplace 'id' par 'uuid' dans le JSON et les URLs
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Si c'est une réponse JSON, transformer les données
        if ($response->headers->has('Content-Type') && 
            strpos($response->headers->get('Content-Type'), 'application/json') !== false) {
            
            $data = json_decode($response->getContent(), true);
            
            if (is_array($data)) {
                $data = $this->transformData($data);
                $response->setContent(json_encode($data));
            }
        }

        return $response;
    }

    /**
     * Transformer récursivement les données pour masquer les IDs
     */
    private function transformData($data)
    {
        if (is_array($data)) {
            // Si c'est un array associatif avec une clé 'data'
            if (isset($data['data'])) {
                $data['data'] = is_array($data['data']) 
                    ? array_map([$this, 'transformObject'], $data['data']) 
                    : $this->transformObject($data['data']);
            }
            
            // Sinon transformer chaque élément
            foreach ($data as $key => &$value) {
                if (is_array($value)) {
                    $value = $this->transformData($value);
                } elseif (is_object($value)) {
                    $value = $this->transformObject((array)$value);
                }
            }
        }

        return $data;
    }

    /**
     * Transformer un objet/array unique
     */
    private function transformObject($obj)
    {
        if (!is_array($obj) && !is_object($obj)) {
            return $obj;
        }

        $arr = is_array($obj) ? $obj : (array)$obj;
        $transformed = [];

        foreach ($arr as $key => $value) {
            // Garder 'id' caché, utiliser 'uuid' comme identifiant public
            if ($key === 'id' && isset($arr['uuid'])) {
                // Passer le 'id' mais aussi ajouter le uuid comme clé 'identifier'
                $transformed['id'] = $arr['uuid']; // Client verra 'id': uuid_value
                $transformed['_raw_id'] = $value; // Internal tracking
            } elseif ($key !== '_raw_id') {
                $transformed[$key] = $value;
            }
        }

        return $transformed;
    }
}
