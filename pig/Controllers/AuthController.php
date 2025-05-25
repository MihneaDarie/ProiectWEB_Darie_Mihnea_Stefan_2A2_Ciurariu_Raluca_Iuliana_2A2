 <?php
require_once 'Controller.php';
require_once __DIR__ . '/../Models/AuthModel.php';

class AuthController extends Controller {
    public function __construct($connection) {
        parent::__construct($connection);
    }

    public function register_user($username, $password, $copy_password,$email) {
        return $this->model->register($username, $password, $copy_password,$email);
    }

    public function login_user($username, $password) {
        return $this->model->login($username, $password);
    
    }

    public function design(){
        $this->renderView('AuthView.tpl');
    }
}
