<?php
abstract class Model {
    protected $connection;

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

    public function email_exists($email) {
        $sql = "SELECT COUNT(*) AS COUNT FROM users WHERE email = :email";
        $stmt = oci_parse($this->connection, $sql);
        oci_bind_by_name($stmt, ":email", $email);
        oci_execute($stmt);
        $row = oci_fetch_array($stmt, OCI_ASSOC + OCI_RETURN_NULLS);
        return ($row['COUNT'] > 0);
    }
}