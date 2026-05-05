<?php

// Point d'entrée API : routes découpées par domaine.
require __DIR__ . '/api/auth.php';
require __DIR__ . '/api/catalog.php';
require __DIR__ . '/api/admin.php';
require __DIR__ . '/api/formations.php';
require __DIR__ . '/api/payments.php';
require __DIR__ . '/api/content.php';
require __DIR__ . '/api/system.php';
