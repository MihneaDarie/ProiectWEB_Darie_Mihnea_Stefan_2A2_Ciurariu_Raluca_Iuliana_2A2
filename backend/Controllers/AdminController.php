<?php
require_once 'Controller.php';
require_once __DIR__ . '/../Models/AdminModel.php';
require_once __DIR__ . '/../../vendor/autoload.php';
 use Firebase\JWT\JWT;
 use Firebase\JWT\Key;

class AdminController extends Controller {
    
    public function __construct($connection) {
        parent::__construct($connection);
        $this->model = new AdminModel($connection);
    }

    public function getDashboardStats() {
        try {
            $stats = $this->model->getDashboardStats();
            echo json_encode([
                'success' => true,
                'data' => $stats
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Error fetching dashboard stats: ' . $e->getMessage()
            ]);
        }
    }

    public function getAllUsers() {
        try {
            $users = $this->model->getAllUsers();
            echo json_encode([
                'success' => true,
                'data' => $users
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Error fetching users: ' . $e->getMessage()
            ]);
        }
    }



    public function deleteUser() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $userId = $input['user_id'] ?? null;

            if (!$userId) {
                throw new Exception('User ID is required');
            }

            $currentUser = $this->getCurrentUser();
            if ($currentUser && $currentUser['id'] == $userId) {
                throw new Exception('Cannot delete your own account');
            }

            $result = $this->model->deleteUser($userId);
            
            if ($result) {
                echo json_encode([
                    'success' => true,
                    'message' => 'User deleted successfully'
                ]);
            } else {
                throw new Exception('Failed to delete user');
            }
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting user: ' . $e->getMessage()
            ]);
        }
    }

    private function getCurrentUser() {

        $jwt = $_COOKIE['jwt'] ?? null;
        if (!$jwt) return null;

        try {
            $payload = JWT::decode($jwt, new Key($_ENV['JWT_SECRET'], 'HS256'));
            return [
                'username' => $payload->username,
                'role' => $payload->role ?? 'user',
                'id' => $payload->user_id ?? null
            ];
        } catch (Exception $e) {
            return null;
        }
    }
}