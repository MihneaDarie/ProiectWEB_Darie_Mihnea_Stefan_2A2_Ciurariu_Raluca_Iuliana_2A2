<?php
require_once __DIR__ . '/Controller.php';


class RegisterController extends Controller{
    public function __construct($connection){
        parent::__construct($connection);
    }

    public function register_user($username,$password,$copy_password,$email) {
        return $this->model->register($username,$password,$copy_password,$email);        
    }

    public function design(){
        $this->renderView('RegisterView.tpl');
    }
}