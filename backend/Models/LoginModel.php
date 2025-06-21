<?php
require_once __DIR__ . '/Model.php';

require __DIR__ . '/../../vendor/autoload.php';
use Firebase\JWT\JWT;

class LoginModel extends Model{

    public function __construct($connection) {
        parent::__construct($connection);
            
        if(!isset($_ENV['JWT_SECRET'])) {
            $env = Dotenv\Dotenv::createImmutable(__DIR__ . '/../../');
            $env->load();
        }
    }
    
    public function login($username, $password){

        if (!$this->user_exists($username)) {
            return ["success" => false, "message" => "Username does not exist!"];
        }

        $sql = "SELECT id, password, role FROM users WHERE username = :username";
        $stmt = oci_parse($this->connection, $sql);
        oci_bind_by_name($stmt, ":username", $username);
        oci_execute($stmt);
        $row = oci_fetch_array($stmt, OCI_ASSOC + OCI_RETURN_NULLS);

        if ($row && password_verify($password, $row["PASSWORD"])) {
            $payload = [
                "iss" => "localhost",
                "aud" => "localhost",
                "iat" => time(),
                "exp" => time() + 3600,
                "username" => $username,
                "role" => $row["ROLE"] ?? 'user',
                "user_id" => $row["ID"]
            ];

            $jwt = JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');

            setcookie('jwt',$jwt,['expires'  => time() + 3600,'path' => '/', 'httponly' => true, 'samesite' => 'Lax']);

            return [
                "success" => true,
                "message" => "Authentication successful!",
                "token" => $jwt,
                "role" => $row["ROLE"] ?? 'user',
                "redirect" => $row["ROLE"] === 'admin' ? 'admin' : 'generator'
            ];
        } else {
            return ["success" => false, "message" => "Incorrect password!"];
        }
    }

}