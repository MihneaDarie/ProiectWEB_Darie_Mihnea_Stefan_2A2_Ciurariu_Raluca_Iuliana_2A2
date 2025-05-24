<?php

class Database {
    private static $connection;

    public static function getConnection() {
        if (!self::$connection) {
            $username = "student";
            $password = "STUDENT";
            $connection_string = "localhost/XE"; 

            self::$connection = oci_connect($username, $password, $connection_string);

            if (!self::$connection) {
                $e = oci_error();
                die("Conexiune esuata: " . $e['message']);
            }
        }

        return self::$connection;
    }
}

