<?php
require_once __DIR__ . '/../vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;


$env = Dotenv\Dotenv::createImmutable(__DIR__ ."/../");
$env->load();

require_once __DIR__ . '/Controllers/LoginController.php';
require_once __DIR__ . '/Controllers/RegisterController.php';

$conn = oci_connect($_ENV['DB_NAME'], $_ENV['DB_PASSWORD'], $_ENV['DB_CONNECTION_STRING']);
if (!$conn) {
    die("Eroare la conectarea la baza de date!");
}

$page = $_GET['page'] ?? 'login';

function loggedIn() {
    $jwt = $_COOKIE['jwt'] ?? null;
    if (!$jwt) {
        redirectToLogin('No authentication token found');
    }

    try {
        $payload = JWT::decode($jwt, new Key($_ENV['JWT_SECRET'], 'HS256'));
        
        if (time() >= $payload->exp) {
            setcookie('jwt', '', time() - 3600, '/');
            redirectToLogin('Session expired. Please login again.');
        }

        return $payload;
    } catch (Exception $e) {
        setcookie('jwt', '', time() - 3600, '/');
        redirectToLogin('Invalid authentication token');
    }
}

function redirectToLogin($message = null) {
    if ($message) {
        $_SESSION['error'] = $message;
    }
    header('Location: /ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/index.php?page=login');
    exit;
}

function renderTemplate($template) {
    $templatePath = __DIR__ . '/../frontend/templates/' . $template;
    if (file_exists($templatePath)) {
        readfile($templatePath);
    } else {
        echo "Template not found!";
    }
}

$protectedPage = ['generator','profile'];

try {

    if(in_array($page,$protectedPage)){
        $user = loggedIn();
    }

    if ($page === 'register') {
        renderTemplate('RegisterView.tpl');
    } else if($page === 'login'){
        renderTemplate('LoginView.tpl');
    }else if($page === 'generator'){
        loggedIn();
        renderTemplate('GeneratorView.tpl');
    }else if($page === 'profile'){
        loggedIn();
        renderTemplate('ProfileView.tpl');
    }else{
        echo '404 - Pagina nu a fost găsită';
    }
} catch (Exception $e) {
    error_log($e->getMessage());
    echo'Error !!!';
}