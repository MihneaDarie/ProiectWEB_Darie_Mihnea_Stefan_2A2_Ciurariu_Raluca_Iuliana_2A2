<?php
require_once __DIR__ . '/AuthController.php';

header('Content-Type: application/json');

$conn = oci_connect('student', 'STUDENT', 'localhost/XE');
if (!$conn) {
    echo json_encode(["success" => false, "message" => "Eroare la conectarea la baza de date!"]);
    exit;
}

$action = $_POST['action'] ?? null;
$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';
$copy_password = $_POST['copy_password'] ?? '';
$email= $_POST['email'] ??'';

$authController = new AuthController($conn);

if ($action === 'register') {
    $result = $authController->register_user($username, $password, $copy_password,$email);
    echo json_encode($result);
    exit;
} elseif ($action === 'login') {
    $result = $authController->login_user($username, $password);
    echo json_encode($result);
    exit;
} else {
    echo json_encode(["success" => false, "message" => "Acțiune necunoscută"]);
    exit;
}
