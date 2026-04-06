<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

// Basit şifre koruması
$AUTH_KEY = 'assos2026';

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['key']) || $input['key'] !== $AUTH_KEY) {
    http_response_code(403);
    echo json_encode(['error' => 'Yetkisiz erisim']);
    exit;
}

if (!isset($input['data'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Veri eksik']);
    exit;
}

// data.js dosyasını güncelle
$dataJS = 'window.DATA = ' . json_encode($input['data'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . ";\n";
$filePath = __DIR__ . '/../data.js';

// Yedek al
$backupPath = __DIR__ . '/../data.backup.js';
if (file_exists($filePath)) {
    copy($filePath, $backupPath);
}

$result = file_put_contents($filePath, $dataJS);

if ($result === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Dosya yazma hatasi']);
} else {
    echo json_encode(['success' => true, 'size' => $result]);
}
