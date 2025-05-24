<?php
class AuthModel {

    private $connection;

    public function __construct($connection) {
        $this->connection = $connection;
    }

    public function user_exists($username) {
        $sql = "SELECT COUNT(*) AS COUNT FROM users WHERE username = :username";
        $stmt = oci_parse($this->connection, $sql);
        oci_bind_by_name($stmt, ":username", $username);
        oci_execute($stmt);
        $row = oci_fetch_array($stmt, OCI_ASSOC + OCI_RETURN_NULLS);
        return ($row['COUNT'] > 0);
    }

    public function email_exists($email){
        $sql="SELECT COUNT(*) AS COUNT FROM users WHERE email=:email";
        $stmt=oci_parse($this->connection,$sql);
        oci_bind_by_name($stmt,":email",$email);
        oci_execute($stmt);
        $row = oci_fetch_array($stmt, OCI_ASSOC + OCI_RETURN_NULLS);
        return ($row['COUNT'] > 0);
    }

    public function register($username, $password, $copy_password,$email) {
        if ($password !== $copy_password) {
            return ["success" => false, "message" => "Parolele nu se potrivesc!"];
        }
        if ($this->user_exists($username)) {
            return ["success" => false, "message" => "Numele utilizatorului este deja folosit!"];
        }

        if ($this->email_exists($email)) {
            return ["success" => false, "message" => "Adresa de email este deja folosită!"];
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);

        $sql = "INSERT INTO users (username, password,email) VALUES (:username, :password,:email)";
        $stmt = oci_parse($this->connection, $sql);
        oci_bind_by_name($stmt, ":username", $username);
        oci_bind_by_name($stmt, ":password", $hash);
        oci_bind_by_name($stmt, ":email", $email);
        $result = oci_execute($stmt);

        if ($result) {
            oci_commit($this->connection);
            return ["success" => true, "message" => "Cont creat cu succes!"];
        } else {
            $e = oci_error($stmt);
            return ["success" => false, "message" => "Eroare la crearea contului!"];
        }
    }

   public function login($username, $password) {

    if (!$this->user_exists($username)) {
        return ["success" => false, "message" => "Numele utilizatorului nu există!"];
    }

    $sql = "SELECT password FROM users WHERE username = :username";
    $stmt = oci_parse($this->connection, $sql);
    oci_bind_by_name($stmt, ":username", $username);
    oci_execute($stmt);
    $row = oci_fetch_array($stmt, OCI_ASSOC + OCI_RETURN_NULLS);

    if ($row && password_verify($password, $row["PASSWORD"])) {
        return ["success" => true, "message" => "Autentificare reușită!"];
        } else {
        return ["success" => false, "message" => "Parola este incorectă!"];
        }
    }

}
