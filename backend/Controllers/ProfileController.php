<?php
require_once 'Controller.php';
require_once __DIR__ . '/../Models/ProfileModel.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class ProfileController extends Controller
{
    private string $jwtSecret;
    protected $model;

    public function __construct($connection)
    {
        parent::__construct($connection);
        $this->jwtSecret = $_ENV['JWT_SECRET'] ?? '';
        $this->model = new ProfileModel($connection);
    }

    public function distribution(): void
    {
        header('Content-Type: application/json; charset=UTF-8');

        try {
            $jwt = $_COOKIE['jwt'] ?? null;
            if (!$jwt) {
                $this->jsonResponse(['success' => false, 'message' => 'Token lipsă'], 401);
            }

            $payload = JWT::decode($jwt, new Key($this->jwtSecret, 'HS256'));
            $username = $payload->username ?? null;    

            if (!$username) {
                $this->jsonResponse(['success' => false, 'message' => 'Username absent în token'], 401);
            }

            $data = $this->model->getUserDataDistributionByUsername($username);
            $this->jsonResponse(['success' => true, 'data' => $data]);      
        } catch (\Throwable $e) {
            $this->jsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function getUsername(): void
    {
        header('Content-Type: application/json; charset=UTF-8');

        try {
            $jwt = $_COOKIE['jwt'] ?? null;
            if (!$jwt) {
                $this->jsonResponse(['success' => false, 'message' => 'Token lipsă'], 401);
            }

            $payload = JWT::decode($jwt, new Key($this->jwtSecret, 'HS256'));
            $username = $payload->username ?? null;

            if (!$username) {
                $this->jsonResponse(['success' => false, 'message' => 'Username absent în token'], 401);
            }

            $this->jsonResponse([
                'success' => true, 
                'username' => $username
            ]);

        } catch (\Throwable $e) {
            $this->jsonResponse([
                'success' => false, 
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getUserData(): void 
    {
        header('Content-Type: application/json; charset=UTF-8');
        
        try {
            $jwt = $_COOKIE['jwt'] ?? null;
            if (!$jwt) {
                $this->jsonResponse([
                    'success' => false, 
                    'error' => 'Authentication required'
                ], 401);
                return;
            }

            $payload = JWT::decode($jwt, new Key($this->jwtSecret, 'HS256'));
            $username = $payload->username ?? null;

            if (!$username) {
                $this->jsonResponse([
                    'success' => false, 
                    'error' => 'Invalid token'
                ], 401);
                return;
            }

            $userData = $this->model->getUserData($username);
            
            if (!$userData) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => 'User data not found'
                ], 404);
                return;
            }

            $this->jsonResponse([
                'success' => true,
                'username' => $userData['USERNAME'],
                'email' => $userData['EMAIL']
            ]);
            
        } catch (\Throwable $e) {
            error_log($e->getMessage());
            $this->jsonResponse([
                'success' => false,
                'error' => 'Internal server error'
            ], 500);
        }
    }

    public function updateProfile(): void 
    {
        header('Content-Type: application/json; charset=UTF-8');
        
        try {
            $jwt = $_COOKIE['jwt'] ?? null;
            if (!$jwt) {
                $this->jsonResponse([
                    'success' => false, 
                    'message' => 'Authentication required'
                ], 401);
                return;
            }
            $payload = JWT::decode($jwt, new Key($this->jwtSecret, 'HS256'));
            $currentUsername = $payload->username ?? null;

            if (!$currentUsername) {
                $this->jsonResponse([
                    'success' => false, 
                    'message' => 'Invalid token'
                ], 401);
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['username']) || !isset($input['email']) || !isset($input['currentPassword'])) {
                $this->jsonResponse([
                    'success' => false,
                    'message' => 'Missing required fields'
                ], 400);
                return;
            }

            if (!empty($input['newPassword']) && $input['newPassword'] !== $input['confirmPassword']) {
                $this->jsonResponse([
                    'success' => false,
                    'message' => 'New passwords do not match'
                ], 400);
                return;
            }

            try {
                $this->model->updateUser($currentUsername, [
                    'username' => $input['username'],
                    'email' => $input['email'],
                    'currentPassword' => $input['currentPassword'],
                    'newPassword' => $input['newPassword'] ?? null
                ]);

                $this->jsonResponse([
                    'success' => true,
                    'message' => 'Profile updated successfully',
                    'data' => [
                        'username' => $input['username'],
                        'email' => $input['email']
                    ]
                ]);

            } catch (Exception $e) {
                $this->jsonResponse([
                    'success' => false,
                    'message' => $e->getMessage()
                ], 400);
            }

        } catch (\Throwable $e) {
            error_log($e->getMessage());
            $this->jsonResponse([
                'success' => false,
                'message' => 'Internal server error'
            ], 500);
        }
    }
}
