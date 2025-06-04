<?php
require_once 'Controller.php';
require_once __DIR__ . '/../Models/ProfileModel.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class ProfileController extends Controller
{
    private string $jwtSecret;

    public function __construct($connection)
    {
        parent::__construct($connection);
        $this->jwtSecret = $_ENV['JWT_SECRET'] ?? '';
    }

    public function distribution(): void
    {
        header('Content-Type: application/json; charset=UTF-8');

        try {
            $jwt = $_COOKIE['jwt'] ?? null;
            if (!$jwt) {
                $this->jsonResponse(['error' => 'Token lipsă'], 401);
            }

            $payload  = JWT::decode($jwt, new Key($this->jwtSecret, 'HS256'));
            $username = $payload->username ?? null;    

            if (!$username) {
                $this->jsonResponse(['error' => 'Username absent în token'], 401);
            }

            $data = $this->model->getUserDataDistributionByUsername($username);
            $this->jsonResponse(['data' => $data]);      
        } catch (\Throwable $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 500);
        }
    }
}
