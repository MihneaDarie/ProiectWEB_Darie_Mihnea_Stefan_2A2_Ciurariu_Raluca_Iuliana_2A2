<?php
require_once __DIR__ . '/Model.php';

require __DIR__ . '/../../vendor/autoload.php';     
use Firebase\JWT\JWT;   

class ProfileModel extends Model {

    public function __construct($connection) {
        parent::__construct($connection);
        
        if(!isset($_ENV['JWT_SECRET'])) {
            $env = Dotenv\Dotenv::createImmutable(__DIR__ . '/../../');
            $env->load();
        }
    }

}
