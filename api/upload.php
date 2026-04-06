<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

$AUTH_KEY = 'assos2026';

// Şifre kontrolü
$key = isset($_SERVER['HTTP_X_AUTH_KEY']) ? $_SERVER['HTTP_X_AUTH_KEY'] : (isset($_POST['key']) ? $_POST['key'] : '');
if ($key !== $AUTH_KEY) {
    http_response_code(403);
    echo json_encode(['error' => 'Yetkisiz erisim']);
    exit;
}

if (!isset($_FILES['image']) || !isset($_POST['path'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Dosya veya yol eksik']);
    exit;
}

$file = $_FILES['image'];
$targetPath = $_POST['path']; // örn: images/yerler/athena-tapinagi.jpg

// Güvenlik: sadece images/ altına izin ver
if (strpos($targetPath, 'images/') !== 0 || strpos($targetPath, '..') !== false) {
    http_response_code(400);
    echo json_encode(['error' => 'Gecersiz dosya yolu']);
    exit;
}

// Sadece jpg/png/webp
$ext = strtolower(pathinfo($targetPath, PATHINFO_EXTENSION));
if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Gecersiz dosya turu']);
    exit;
}

// Hedef klasörü oluştur
$fullPath = __DIR__ . '/../' . $targetPath;
$dir = dirname($fullPath);
if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
}

// Dosyayı taşı
if (move_uploaded_file($file['tmp_name'], $fullPath)) {
    echo json_encode(['success' => true, 'path' => $targetPath, 'size' => filesize($fullPath)]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Dosya yukleme hatasi']);
}
