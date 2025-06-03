<?php
require_once 'Controller.php';
require_once __DIR__ . '/../Models/LoginModel.php';

class LoginController extends Controller {
    public function __construct($connection) {
        parent::__construct($connection);
    }

    public function login_user($user, $pass) {
        $result = $this->model->login($user, $pass);

        if ($result['success']) {
            header('Location: /index.php?page=generator');
            exit;
        }

        $errorMessage = $result['message'];
        include __DIR__.'/../Views/LoginView.tpl';
    }

    public function apiLogin($user, $pass) : array {
        return $this->model->login($user, $pass);   
    }
}