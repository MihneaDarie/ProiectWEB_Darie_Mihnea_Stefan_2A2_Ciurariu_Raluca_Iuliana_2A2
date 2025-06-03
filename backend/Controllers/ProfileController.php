<?php
require_once 'Controller.php';

class ProfileController extends Controller {
    public function __construct($connection) {
        parent::__construct($connection);
    }

    public function get_profile($username) {
        return $this->model->getProfile($username);
    }

    public function update_profile($username, $email, $password) {
        return $this->model->updateProfile($username, $email, $password);
    }
}