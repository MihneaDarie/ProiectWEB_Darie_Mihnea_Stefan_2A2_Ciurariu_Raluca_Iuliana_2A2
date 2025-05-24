<?php
require_once 'Database.php';
require_once 'Models/AuthModel.php';

$connection = Database::getConnection();
$model = new AuthModel($connection);

$result = $model->register('testuser', '123456', '123456');

var_dump($result);
