<?php
require_once __DIR__ . '/../vendor/autoload.php';
$env = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$env->load();

 require_once __DIR__ . '/Controllers/RegisterController.php';
 require_once __DIR__ . '/Controllers/LoginController.php';
 require_once __DIR__ . '/Controllers/GeneratorController.php';
 require_once __DIR__ . '/Controllers/ProfileController.php'; 


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
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';

    if($action=== 'getDataSet'){
        $ctrl = new ProfileController($conn);
        $ctrl->getDataSet();            
        exit;
    }

    if ($action === 'distribution') {
        $ctrl = new ProfileController($conn);
        $ctrl->distribution();
        exit;
    }

    if($action  === 'history'){
        $ctrl = new ProfileController($conn);
        $ctrl->history();
        exit;
    }

    if ($action === 'getUsername') {
        $ctrl = new ProfileController($conn);
        $ctrl->getUsername();
        exit;
    }

    if ($action === 'getUserData') {
        $ctrl = new ProfileController($conn);
        $ctrl->getUserData();
        exit;
    }

    if ($action === 'updateProfile') {
        try {
            $ctrl = new ProfileController($conn);
            $ctrl->updateProfile();
            exit;
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Update failed: ' . $e->getMessage()
            ]);
            exit;
        }
    }

    if ($action === 'logout') {
        setcookie('jwt', '', [
            'expires' => time() - 3600,
            'path' => '/',
            'domain' => '',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Strict'
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
        exit;
    }
}


if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_GET['action'] ?? '';
    $page = $_GET['page'] ?? '';

    if ($page === 'register') {
        $username      = $input['username']      ?? '';
        $password      = $input['password']      ?? '';
        $copy_password = $input['copy_password'] ?? '';
        $email         = $input['email']         ?? '';
        $registerController = new RegisterController($conn);
        $response = $registerController->register_user($username, $password, $copy_password, $email);
        echo json_encode($response);
        exit;
    }

    if ($page === 'login') {
        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';
        $loginController = new LoginController($conn);
        $response = $loginController->apiLogin($username, $password);
        echo json_encode($response);
        exit;
    }

    if ($action === 'updateProfile') {
        try {
            $ctrl = new ProfileController($conn);
            $ctrl->updateProfile();
            exit;
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Update failed: ' . $e->getMessage()
            ]);
            exit;
        }
    }

    if ($page === 'generate') {
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

    echo json_encode(['success' => false, 'message' => 'Route not found']);
    exit;
}