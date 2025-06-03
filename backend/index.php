<?php
require_once __DIR__ . '/../vendor/autoload.php';

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
        header('Location: /ProiectWEB_…/backend/index.php?page=login');
        exit;
    }
    try {
        Firebase\JWT\JWT::decode($jwt, new Firebase\JWT\Key($_ENV['JWT_SECRET'], 'HS256'));
    } catch (Exception $e) {
        header('Location: /ProiectWEB_…/backend/index.php?page=login');
        exit;
    }
}

function renderTemplate($template) {
    $templatePath = __DIR__ . '/../frontend/templates/' . $template;
    if (file_exists($templatePath)) {
        readfile($templatePath);
    } else {
        echo "Template not found!";
    }
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