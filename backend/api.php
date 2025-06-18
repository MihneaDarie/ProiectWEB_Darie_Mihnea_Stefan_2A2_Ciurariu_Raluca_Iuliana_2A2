<?php
require_once __DIR__ . '/../vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
$env = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$env->load();

require_once __DIR__ . '/Controllers/RegisterController.php';
require_once __DIR__ . '/Controllers/LoginController.php';
require_once __DIR__ . '/Controllers/GeneratorController.php';
require_once __DIR__ . '/Controllers/ProfileController.php';
require_once __DIR__ . '/Controllers/AdminController.php';

header('Content-Type: application/json');

$conn = oci_connect($_ENV['DB_NAME'], $_ENV['DB_PASSWORD'], $_ENV['DB_CONNECTION_STRING']);
if (!$conn) {
    echo json_encode(["success" => false, "message" => "Eroare la conectarea la baza de date!"]);
    exit;
}

// Helper function to check admin role
function checkAdminRole() {


    $jwt = $_COOKIE['jwt'] ?? null;
    if (!$jwt) {
        echo json_encode(['success' => false, 'message' => 'Authentication required']);
        exit;
    }

    try {
        $payload = JWT::decode($jwt, new Key($_ENV['JWT_SECRET'], 'HS256'));
        if (($payload->role ?? 'user') !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Admin access required']);
            exit;
        }
        return $payload;
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Invalid token']);
        exit;
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$page = $_GET['page'] ?? '';
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Login and Register routes
if ($method === 'POST' && $page === 'register') {
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    $copy_password = $input['copy_password'] ?? '';
    $email = $input['email'] ?? '';
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

// Admin routes
if ($page === 'admin') {
    checkAdminRole(); // Verify admin access
    $adminController = new AdminController($conn);
    
    if ($method === 'GET') {
        switch ($action) {
            case 'dashboard_stats':
                $adminController->getDashboardStats();
                exit;
            case 'users':
                $adminController->getAllUsers();
                exit;
            case 'user_details':
                $adminController->getUserDetails();
                exit;
            case 'system_logs':
                $adminController->getSystemLogs();
                exit;
            case 'data_distribution':
                $adminController->getDataTypeDistribution();
                exit;
            default:
                echo json_encode(['success' => false, 'message' => 'Admin action not found']);
                exit;
        }
    }
    
    if ($method === 'POST') {
        switch ($action) {
            case 'update_role':
                $adminController->updateUserRole();
                exit;
            default:
                echo json_encode(['success' => false, 'message' => 'Admin action not found']);
                exit;
        }
    }
    
    if ($method === 'DELETE') {
        switch ($action) {
            case 'delete_user':
                $adminController->deleteUser();
                exit;
            default:
                echo json_encode(['success' => false, 'message' => 'Admin action not found']);
                exit;
        }
    }
}

// Existing routes
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if($action === 'getDataSet'){
        $ctrl = new ProfileController($conn);
        $ctrl->getDataSet();            
        exit;
    }

    if ($action === 'distribution') {
        $ctrl = new ProfileController($conn);
        $ctrl->distribution();
        exit;
    }

    if($action === 'history'){
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

    if ($action === 'checkPassword') {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            if (!isset($data['username']) || !isset($data['password'])) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Missing required parameters'
                ]);
                exit;
            }
            
            $ctrl = new ProfileController($conn);
            $ctrl->checkPassword($data['username'],$data['password']);
            exit;
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Password check failed: ' . $e->getMessage()
            ]);
            exit;
        }
    }

    echo json_encode(['success' => false, 'message' => 'Route not found']);
    exit;
}

if ($method === 'DELETE') {
    if ($action === 'deleteAccount') {
        try {
            $ctrl = new ProfileController($conn);
            $ctrl->deleteAccount();
            exit;
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Update failed: ' . $e->getMessage()
            ]);
            exit;
        }
    }
}