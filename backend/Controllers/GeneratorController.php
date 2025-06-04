<?php
require_once 'Controller.php';
require_once __DIR__ . '/../Models/GeneratorModel.php';

class GeneratorController extends Controller {
    private $generatorModel;

    public function __construct($connection) {
        parent::__construct($connection);
        $this->generatorModel = new GeneratorModel($connection);
    }

    public function handleRequest() {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$this->validateInput($input)) {
            return [
                'success' => false,
                'message' => 'Invalid input data'
            ];
        }

        try {
            $result = $this->generatorModel->insert_numeric_array(
                $input['minValue'],
                $input['maxValue'],
                $input['arrayLength'],
                $input['sortOrder'],
                $input['array']
            );

            return $result;

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    private function validateInput($input) {
        return isset($input['minValue']) &&
               isset($input['maxValue']) &&
               isset($input['arrayLength']) &&
               isset($input['sortOrder']) &&
               isset($input['array']) &&
               is_array($input['array']);
    }
}