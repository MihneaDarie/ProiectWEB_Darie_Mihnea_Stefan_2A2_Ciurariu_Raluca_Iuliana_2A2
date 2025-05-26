<?php
require_once __DIR__ . '/../../vendor/autoload.php';
$env = Dotenv\Dotenv::createImmutable(__DIR__ . '/../../');
$env->load();

require_once __DIR__ . '/RegisterController.php';
require_once __DIR__ . '/LoginController.php';

header('Content-Type: application/json');

$conn = oci_connect($_ENV['DB_NAME'], $_ENV['DB_PASSWORD'], $_ENV['DB_CONNECTION_STRING']);
if (!$conn) {
    echo json_encode(["success" => false, "message" => "Eroare la conectarea la baza de date!"]);
    exit;
}

$action = $_POST['action'] ?? null;
$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';
$copy_password = $_POST['copy_password'] ?? '';
$email = $_POST['email'] ?? '';

$response = ["success" => false, "message" => "Acțiune necunoscută"];

if ($action === 'register') {
    $registerController = new RegisterController($conn);
    $response = $registerController->register_user($username, $password, $copy_password, $email);
} elseif ($action === 'login') {
    $loginController = new LoginController($conn);
    $response = $loginController->login_user($username, $password);
}

echo json_encode($response);
exit;