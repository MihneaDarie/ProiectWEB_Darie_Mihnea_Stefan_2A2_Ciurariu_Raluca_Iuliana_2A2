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
$email = $_POST['email'] ?? '';

$authController = new AuthController($conn);
$response = ["success" => false, "message" => "Acțiune necunoscută"];

if ($action === 'register') {
    $response = $authController->register_user($username, $password, $copy_password, $email);
} elseif ($action === 'login') {
    $response = $authController->login_user($username, $password);
}

echo json_encode($response);
exit;
