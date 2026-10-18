<?php
// In config.php kopieren und den erzeugten Hash einsetzen. config.php wird
// absichtlich nicht versioniert. Hash erzeugen: php -r "echo password_hash('MEIN-PASSWORT', PASSWORD_DEFAULT), PHP_EOL;"
return [
    'password_hash' => 'HIER_DEN_PASSWORT_HASH_EINSETZEN',
];
