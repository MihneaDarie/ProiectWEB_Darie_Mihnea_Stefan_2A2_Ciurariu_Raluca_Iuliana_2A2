<?php
abstract class Controller {
    protected $model;
    protected $view;

    public function __construct($connection){
        $numeModel = str_replace("Controller", "Model", get_class($this));
        $modelFile = __DIR__ . '/../Models/' . $numeModel . '.php';
        require_once $modelFile;
        $this->model = new $numeModel($connection);

        $numeView = str_replace("Controller", "View", get_class($this));
        $viewFile = __DIR__ . '/../Views/' . $numeView . '.tpl';
    }

   public function renderView($viewFile, $data = []){
    extract($data);
    include __DIR__ . '/../templates/' . $viewFile;
    }

}
