<?php
require_once __DIR__ . '/Model.php';

class RegisterModel extends Model{
    public function __construct($connection){
        parent::__construct($connection);
    }

    public function register($username, $password, $copy_password, $email) {
        if ($password !== $copy_password) {
            return ["success" => false, "message" => "Password missmatch !"];
        }
        if ($this->email_exists($email)) {
            return ["success" => false, "message" => "Email adress already in use!"];
        }
        if ($this->user_exists($username)) {
            return ["success" => false, "message" => "Username already in use !"];
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

}