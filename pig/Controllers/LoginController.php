<?php
require_once 'Controller.php';
require_once __DIR__ . '/../Models/LoginModel.php';

class LoginController extends Controller {
    public function __construct($connection) {
        parent::__construct($connection);
    }

    public function login_user($username, $password) {
        return $this->model->login($username,$password);
    }

    public function design(){
        $this->renderView('LoginView.tpl');
    }
}