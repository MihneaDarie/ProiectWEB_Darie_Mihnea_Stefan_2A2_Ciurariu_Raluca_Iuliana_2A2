<?php
require_once 'Controller.php';
require_once __DIR__ . '/../Models/GeneratorModel.php';

class GeneratorController extends Controller {
    private $generatorModel;

    public function __construct($connection) {
        parent::__construct($connection);
        $this->generatorModel = new GeneratorModel($connection);
    }

    public function handleRequest($type, $data, $params = []) {
        if (empty($type)) {
            return [
                'success' => false,
                'message' => 'Data type not specified'
            ];
        }

        $allParams = [
            'type' => $type,
            'array' => $data,
            'length' => $params['length'] ?? null,
            'minValue' => $params['minValue'] ?? null,
            'maxValue' => $params['maxValue'] ?? null,
            'sortOrder' => $params['sortOrder'] ?? null,
            'rows' => $params['rows'] ?? null,
            'cols' => $params['cols'] ?? null,
            'charSet' => $params['charSet'] ?? null,
            'vertices' => $params['vertices'] ?? null,
            'edges' => $params['edges'] ?? null,
            'graphType' => $params['graphType'] ?? null,
            'representation' => $params['representation'] ?? null,
            'nodes' => $params['nodes'] ?? null,
            'isWeighted' => $params['isWeighted'] ?? 'n'
        ];

        if (!$this->validateInput($allParams)) {
            return [
                'success' => false,
                'message' => 'Invalid input data'
            ];
        }

        try {
            $result = $this->generatorModel->insert_data_set(
                $type,
                $data,
                $allParams
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
        switch($input['type']) {
            case 'number_array':
                return isset($input['minValue']) &&
                    isset($input['maxValue']) &&
                    isset($input['length']) &&
                    isset($input['sortOrder']) &&
                    isset($input['array']) &&
                    is_array($input['array']);
            
            case 'character_array':
                return isset($input['charSet']) &&
                    isset($input['length']) &&
                    isset($input['array']) &&
                    is_string($input['array']);
            
            case 'matrix':
                return isset($input['rows']) &&
                    isset($input['cols']) &&
                    isset($input['array']) &&
                    is_array($input['array']);
            
            case 'graph':
                return isset($input['array']) &&
                    is_array($input['array']) &&
                    isset($input['vertices']) &&
                    isset($input['edges']) &&
                    isset($input['graphType']) &&
                    isset($input['representation']);
            
            case 'tree':
                return isset($input['array']) &&
                    (is_array($input['array']) || is_string($input['array'])) &&
                    isset($input['nodes']) &&
                    isset($input['representation']);
            
            default:
                return false;
        }
    }

}