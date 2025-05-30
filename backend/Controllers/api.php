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

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

$scriptName = $_SERVER['SCRIPT_NAME'];
$route = substr($path, strlen($scriptName));

$input = json_decode(file_get_contents('php://input'), true) ?? [];

if ($method === 'POST' && preg_match('/register$/', $route)) {
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    $copy_password = $input['copy_password'] ?? '';
    $email = $input['email'] ?? '';
    $registerController = new RegisterController($conn);
    $response = $registerController->register_user($username, $password, $copy_password, $email);
    echo json_encode($response);
    exit;
} elseif ($method === 'POST' && preg_match('/login$/', $route)) {
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    $loginController = new LoginController($conn);
    $response = $loginController->login_user($username, $password);
    echo json_encode($response);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Route not found']);
exit;