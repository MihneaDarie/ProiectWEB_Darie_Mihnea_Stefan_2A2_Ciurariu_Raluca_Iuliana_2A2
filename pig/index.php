<?php
require_once __DIR__ . '/Controllers/AuthController.php';

$conn = oci_connect('student', 'STUDENT', 'localhost/XE');
if (!$conn) {
    die("Eroare la conectarea la baza de date!");
}

$authController = new AuthController($conn);
$authController->design();
