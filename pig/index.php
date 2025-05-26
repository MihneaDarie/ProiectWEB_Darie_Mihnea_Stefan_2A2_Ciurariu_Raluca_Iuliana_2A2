<?php
require_once __DIR__ . '/../vendor/autoload.php';

$env = Dotenv\Dotenv::createImmutable(__DIR__ ."/../");
$env->load();

require_once __DIR__ . '/Controllers/LoginController.php';
require_once __DIR__ . '/Controllers/RegisterController.php';



$conn = oci_connect($_ENV['DB_NAME'], $_ENV['DB_PASSWORD'], $_ENV['DB_CONNECTION_STRING']);
if (!$conn) {
    die("Eroare la conectarea la baza de date!");
}

$page = $_GET['page'] ?? 'login';

if ($page === 'register') {
    $controller = new RegisterController($conn);
    $controller->design();
} else {
    $controller = new LoginController($conn);
    $controller->design();
}