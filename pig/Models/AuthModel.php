<?php

require __DIR__ . '/../../vendor/autoload.php';
use Firebase\JWT\JWT;

class AuthModel
{

    private $connection;

    public function __construct($connection)
    {
        $this->connection = $connection;

        if (!isset($_ENV['JWT_SECRET'])) {
            $env = Dotenv\Dotenv::createImmutable(__DIR__ . '/../../');
            $env->load();
        }

    }

    public function user_exists($username)
    {
        $sql = "SELECT COUNT(*) AS COUNT FROM users WHERE username = :username";
        $stmt = oci_parse($this->connection, $sql);
        oci_bind_by_name($stmt, ":username", $username);
        oci_execute($stmt);
        $row = oci_fetch_array($stmt, OCI_ASSOC + OCI_RETURN_NULLS);
        return ($row['COUNT'] > 0);
    }

    public function email_exists($email)
    {
        $sql = "SELECT COUNT(*) AS COUNT FROM users WHERE email=:email";
        $stmt = oci_parse($this->connection, $sql);
        oci_bind_by_name($stmt, ":email", $email);
        oci_execute($stmt);
        $row = oci_fetch_array($stmt, OCI_ASSOC + OCI_RETURN_NULLS);
        return ($row['COUNT'] > 0);
    }

    public function register($username, $password, $copy_password, $email)
    {
        if ($password !== $copy_password) {
            return ["success" => false, "message" => "Parolele nu se potrivesc!"];
        }
        if ($this->email_exists($email)) {
            return ["success" => false, "message" => "Adresa de email este deja folosită!"];
        }
        if ($this->user_exists($username)) {
            return ["success" => false, "message" => "Numele utilizatorului este deja folosit!"];
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);

        $sql = "INSERT INTO users (username, password, email, created_at)
            VALUES (:username, :password, :email, SYSTIMESTAMP)";
        $stmt = oci_parse($this->connection, $sql);
        oci_bind_by_name($stmt, ":username", $username);
        oci_bind_by_name($stmt, ":password", $hash);
        oci_bind_by_name($stmt, ":email", $email);


        if (!oci_execute($stmt, OCI_NO_AUTO_COMMIT)) {

            oci_rollback($this->connection);

            $e = oci_error($stmt);
            if (strpos($e['message'], 'ORA-00001') !== false) {
                return [
                    "success" => false,
                    "message" => "Numele de utilizator sau emailul este deja folosit!"
                ];
            }

            return [
                "success" => false,
                "message" => "Eroare la crearea contului: " . $e['message']
            ];
        }

        oci_commit($this->connection);

        return [
            "success" => true,
            "message" => "Cont creat cu succes!"
        ];
    }


    public function login($username, $password)
    {

        if (!$this->user_exists($username)) {
            return ["success" => false, "message" => "Numele utilizatorului nu există!"];
        }

        $sql = "SELECT password FROM users WHERE username = :username";
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
                "username" => $username
            ];

            $jwt = JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');

            setcookie("jwt", $jwt, time() + 3600, "/", "", false, true); //$jwt = $_COOKIE['token'] ?? null; (si folosim asta de fiecare data cand vrem sa luam tokenul in requesturi)

            return [
                "success" => true,
                "message" => "Autentificare reușită!",
                "token" => $jwt
            ];
        } else {
            return ["success" => false, "message" => "Parola incorectă!"];
        }
    }
}
