<?php
require_once __DIR__ . '/../vendor/autoload.php';
$env = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$env->load();

 require_once __DIR__ . '/Controllers/RegisterController.php';
 require_once __DIR__ . '/Controllers/LoginController.php';
 require_once __DIR__ . '/Controllers/GeneratorController.php';


header('Content-Type: application/json');

$conn = oci_connect($_ENV['DB_NAME'], $_ENV['DB_PASSWORD'], $_ENV['DB_CONNECTION_STRING']);
if (!$conn) {
    echo json_encode(["success" => false, "message" => "Eroare la conectarea la baza de date!"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$page   = $_GET['page'] ?? '';              
$input  = json_decode(file_get_contents('php://input'), true) ?? [];

if ($method === 'POST' && $page === 'register') {
    $username      = $input['username']      ?? '';
    $password      = $input['password']      ?? '';
    $copy_password = $input['copy_password'] ?? '';
    $email         = $input['email']         ?? '';
    $registerController = new RegisterController($conn);
    $response = $registerController->register_user($username, $password, $copy_password, $email);
    echo json_encode($response);
    exit;
}

if ($method === 'POST' && $page === 'login') {
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    $loginController = new LoginController($conn);
    $response = $loginController->apiLogin($username, $password);
    echo json_encode($response);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_GET['page'])) {
        if ($_GET['page'] === 'generate') {
            $input = json_decode(file_get_contents('php://input'), true);           
            try {
                $generatorController = new GeneratorController($conn);
                $response = $generatorController->handleRequest($input['type'], $input['array'], $input);
                echo json_encode($response);
                exit;
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'message' => 'Controller error: ' . $e->getMessage()]);
                exit;
            }
        }
    }
    echo json_encode(['success' => false, 'message' => 'Route not found']);
    exit;
}
