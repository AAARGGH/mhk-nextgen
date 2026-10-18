<?php
declare(strict_types=1);

const DATA_FILE = __DIR__ . '/../data/projects.json';
const UPLOAD_DIR = __DIR__ . '/../images/projects/uploads';
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

ini_set('session.use_strict_mode', '1');
session_name('mhk_project_admin');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");

function respond(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function passwordHash(): string
{
    $hash = getenv('MHK_ADMIN_PASSWORD_HASH') ?: '';
    $plain = getenv('MHK_ADMIN_PASSWORD') ?: '';
    $localConfig = __DIR__ . '/config.php';
    if (is_file($localConfig)) {
        $config = require $localConfig;
        $hash = (string) ($config['password_hash'] ?? $hash);
        $plain = (string) ($config['password'] ?? $plain);
    }
    return $hash !== '' ? $hash : ($plain !== '' ? password_hash($plain, PASSWORD_DEFAULT) : '');
}

function requireAuth(): void
{
    if (empty($_SESSION['authenticated'])) {
        respond(['error' => 'Bitte erneut anmelden.'], 401);
    }
}

function requireCsrf(): void
{
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($token) || !hash_equals($_SESSION['csrf'] ?? '', $token)) {
        respond(['error' => 'Ungültige Sitzung. Bitte die Seite neu laden.'], 403);
    }
}

function readProjects(): array
{
    $json = @file_get_contents(DATA_FILE);
    $projects = $json === false ? null : json_decode($json, true);
    if (!is_array($projects)) respond(['error' => 'Die Projektdaten konnten nicht gelesen werden.'], 500);
    return $projects;
}

function cleanString(mixed $value, int $max): string
{
    $value = trim((string) $value);
    return mb_substr($value, 0, $max);
}

$action = $_GET['action'] ?? 'status';

if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $now = time();
    $attempts = array_values(array_filter($_SESSION['login_attempts'] ?? [], fn ($time) => $time > $now - 600));
    if (count($attempts) >= 5) respond(['error' => 'Zu viele Versuche. Bitte in zehn Minuten erneut versuchen.'], 429);
    $body = json_decode((string) file_get_contents('php://input'), true) ?: [];
    $hash = passwordHash();
    if ($hash === '') respond(['error' => 'Die Verwaltung wurde noch nicht konfiguriert.'], 503);
    if (!password_verify((string) ($body['password'] ?? ''), $hash)) {
        $attempts[] = $now;
        $_SESSION['login_attempts'] = $attempts;
        usleep(350000);
        respond(['error' => 'Das Passwort ist nicht korrekt.'], 401);
    }
    session_regenerate_id(true);
    $_SESSION['authenticated'] = true;
    $_SESSION['login_attempts'] = [];
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
    respond(['authenticated' => true, 'csrf' => $_SESSION['csrf']]);
}

if ($action === 'status') {
    respond([
        'authenticated' => !empty($_SESSION['authenticated']),
        'configured' => passwordHash() !== '',
        'csrf' => $_SESSION['authenticated'] ?? false ? ($_SESSION['csrf'] ?? '') : '',
    ]);
}

requireAuth();

if ($action === 'logout' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireCsrf();
    $_SESSION = [];
    session_destroy();
    respond(['ok' => true]);
}

if ($action === 'projects' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    respond(['projects' => readProjects(), 'csrf' => $_SESSION['csrf']]);
}

requireCsrf();

if ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($body) || !is_array($body['projects'] ?? null)) respond(['error' => 'Ungültige Projektdaten.'], 422);
    $projects = [];
    foreach (array_slice($body['projects'], 0, 250) as $index => $project) {
        if (!is_array($project)) continue;
        $title = cleanString($project['title'] ?? '', 160);
        $year = filter_var($project['year'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 2000, 'max_range' => 2100]]);
        if ($title === '' || $year === false) respond(['error' => 'Jedes Projekt braucht eine Überschrift und ein gültiges Jahr.'], 422);
        $images = array_values(array_filter(array_map(
            fn ($image) => cleanString($image, 500),
            is_array($project['images'] ?? null) ? array_slice($project['images'], 0, 20) : []
        ), fn ($image) => preg_match('~^(?:images/projects/|https?://)~', $image)));
        $linkUrl = cleanString($project['linkUrl'] ?? '', 500);
        if ($linkUrl !== '' && !filter_var($linkUrl, FILTER_VALIDATE_URL)) respond(['error' => "Der Link bei „{$title}“ ist ungültig."], 422);
        $projects[] = [
            'id' => preg_replace('/[^a-zA-Z0-9_-]/', '', cleanString($project['id'] ?? '', 100)) ?: 'project-' . bin2hex(random_bytes(6)),
            'year' => $year,
            'title' => $title,
            'teaser' => cleanString($project['teaser'] ?? '', 500),
            'text' => cleanString($project['text'] ?? '', 15000),
            'images' => $images,
            'thumbnail' => cleanString($project['thumbnail'] ?? ($images[0] ?? ''), 500),
            'alt' => cleanString($project['alt'] ?? '', 300),
            'linkUrl' => $linkUrl,
            'linkLabel' => cleanString($project['linkLabel'] ?? '', 200),
            'published' => ($project['published'] ?? true) === true,
        ];
    }
    $json = json_encode($projects, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
    $temporary = DATA_FILE . '.tmp';
    if (@file_put_contents($temporary, $json, LOCK_EX) === false || !@rename($temporary, DATA_FILE)) {
        @unlink($temporary);
        respond(['error' => 'Speichern fehlgeschlagen. Bitte Schreibrechte für data/projects.json prüfen.'], 500);
    }
    respond(['ok' => true, 'projects' => $projects]);
}

if ($action === 'upload' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) respond(['error' => 'Das Bild konnte nicht hochgeladen werden.'], 422);
    if ($_FILES['image']['size'] > MAX_UPLOAD_BYTES) respond(['error' => 'Das Bild darf höchstens 8 MB groß sein.'], 422);
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($_FILES['image']['tmp_name']);
    $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
    if (!isset($extensions[$mime])) respond(['error' => 'Erlaubt sind JPG, PNG, WebP und GIF.'], 422);
    if (!is_dir(UPLOAD_DIR) && !mkdir(UPLOAD_DIR, 0755, true)) respond(['error' => 'Der Upload-Ordner konnte nicht angelegt werden.'], 500);
    $filename = date('Ymd-His') . '-' . bin2hex(random_bytes(5)) . '.' . $extensions[$mime];
    if (!move_uploaded_file($_FILES['image']['tmp_name'], UPLOAD_DIR . '/' . $filename)) respond(['error' => 'Das Bild konnte nicht gespeichert werden.'], 500);
    respond(['path' => 'images/projects/uploads/' . $filename]);
}

respond(['error' => 'Unbekannte Anfrage.'], 404);
