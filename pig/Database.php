<?php

require_once __DIR__ . '../vendor/autoload.php';

class Database {
    private static $connection;

    public static function getConnection() {
        if (!self::$connection) {

            $env = Dotenv\Dotenv::createImmutable(__DIR__);
            $env->load();

            $username = $_ENV['DB_NAME'];
            $password = $_ENV['DB_PASSWORD'];
            $connection_string = $_ENV['DB_CONNECTION_STRING']; 

            self::$connection = oci_connect($username, $password, $connection_string);

            if (!self::$connection) {
                $e = oci_error();
                die("Conexiune esuata: " . $e['message']);
            }
        }

        return self::$connection;
    }
}

