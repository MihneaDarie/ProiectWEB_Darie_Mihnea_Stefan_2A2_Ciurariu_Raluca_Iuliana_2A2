<?php
abstract class Controller {
    protected $model;

    public function __construct($connection){
        $modelName = str_replace("Controller", "Model", get_class($this));
        $modelFile = __DIR__ . '/../Models/' . $modelName . '.php';
        if (file_exists($modelFile)) {
            require_once $modelFile;
            $this->model = new $modelName($connection);
        }
    }

    protected function jsonResponse($data, $status = 200) {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
}