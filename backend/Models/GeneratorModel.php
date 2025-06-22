<?php

require_once __DIR__ . '/Model.php';

require_once __DIR__ . '/../../vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class GeneratorModel extends Model
{
    private $userId = null;

    public function __construct($connection)
    {
        parent::__construct($connection);

        if (!isset($_ENV['JWT_SECRET'])) {
            $env = Dotenv\Dotenv::createImmutable(__DIR__ . '/../../');
            $env->load();
        }

        if (isset($_COOKIE['jwt'])) {
            try {
                $decoded = JWT::decode($_COOKIE['jwt'], new Key($_ENV['JWT_SECRET'], 'HS256'));

                if (time() >= $decoded->exp) {
                    throw new \Exception('Token has expired!');
                }

                $username = $decoded->username;
                $this->userId = $this->get_userId_by_username($username);

            } catch (\Exception $e) {
                throw new \Exception('Invalid token: ' . $e->getMessage());
            }
        } else {
            throw new \Exception('Authentication required');
        }
    }


    public function insert_data_set($type, $data, $params = [])
    {
        $clob = null;
        try {
            $seqStmt = oci_parse($this->connection, 'SELECT data_set_seq.NEXTVAL FROM DUAL');
            oci_execute($seqStmt);
            $row = oci_fetch_array($seqStmt, OCI_ASSOC);
            $dataSetId = $row['NEXTVAL'];

            $sqlDataSet = "INSERT INTO data_set (id, user_id, type, label, created_at) 
                          VALUES (:id, :userId, :type, :label, CURRENT_TIMESTAMP)";
            $stmtDataSet = oci_parse($this->connection, $sqlDataSet);
            oci_bind_by_name($stmtDataSet, ":id", $dataSetId);
            if (!$this->userId) {
                throw new \Exception('USER_ID is not set. Cannot insert data.');
            }
            oci_bind_by_name($stmtDataSet, ":userId", $this->userId);
            oci_bind_by_name($stmtDataSet, ":type", $type);
            $label = "Generated " . ucfirst($type);
            oci_bind_by_name($stmtDataSet, ":label", $label);

            $result1 = oci_execute($stmtDataSet, OCI_DEFAULT);
            if (!$result1) {
                $e = oci_error($stmtDataSet);
                throw new \Exception('Data set insert failed: ' . $e['message']);
            }

            switch ($type) {
                case 'number_array':
                    return $this->insert_number_array($dataSetId, $data, $params);
                case 'character_array':
                    return $this->insert_character_array($dataSetId, $data, $params);
                case 'matrix':
                    return $this->insert_matrix($dataSetId, $data, $params);
                case 'graph':
                    return $this->insert_graph($dataSetId, $data, $params);
                case 'tree':
                    return $this->insert_tree($dataSetId, $data, $params);
                default:
                    throw new \Exception('Invalid data type');
            }

        } catch (\Exception $e) {
            if (isset($clob)) {
                $clob->free();
            }
            oci_rollback($this->connection);
            return [
                'success' => false,
                'message' => 'Error saving data: ' . $e->getMessage()
            ];
        }
    }

    private function insert_number_array($dataSetId, $array, $params)
    {

        $sqlNumberArray = "INSERT INTO number_array (id, length, min_value, max_value, sorted, data) 
                          VALUES (:id, :length, :min_value, :max_value, :sorted, :data)";
        $stmtNumberArray = oci_parse($this->connection, $sqlNumberArray);

        oci_bind_by_name($stmtNumberArray, ":id", $dataSetId);
        oci_bind_by_name($stmtNumberArray, ":length", $params['length']);
        oci_bind_by_name($stmtNumberArray, ":min_value", $params['minValue']);
        oci_bind_by_name($stmtNumberArray, ":max_value", $params['maxValue']);
        oci_bind_by_name($stmtNumberArray, ":sorted", $params['sortOrder']);

        $clob = oci_new_descriptor($this->connection, OCI_D_LOB);
        $clob->writetemporary(json_encode($array), OCI_TEMP_CLOB);
        oci_bind_by_name($stmtNumberArray, ":data", $clob, -1, SQLT_CLOB);

        $result = oci_execute($stmtNumberArray, OCI_DEFAULT);
        if (!$result) {
            throw new \Exception('Number array insert failed: ' . oci_error($stmtNumberArray)['message']);
        }

        oci_commit($this->connection);
        $clob->free();

        return [
            'success' => true,
            'message' => 'Array saved successfully',
            'dataSetId' => $dataSetId
        ];
    }

    private function insert_character_array($dataSetId, $data, $params)
    {
        $sqlCharacterArray = "INSERT INTO character_array (id, length, encoding, data) 
                            VALUES (:id, :length, :encoding, :data)";
        $stmtCharacterArray = oci_parse($this->connection, $sqlCharacterArray);

        oci_bind_by_name($stmtCharacterArray, ":id", $dataSetId);

        $length = strlen($data);
        oci_bind_by_name($stmtCharacterArray, ":length", $length);

        $encoding = $params['encoding'] ?? 'ascii';
        oci_bind_by_name($stmtCharacterArray, ":encoding", $encoding);

        $jsonData = json_encode([$data]);
        $clob = oci_new_descriptor($this->connection, OCI_D_LOB);
        $clob->writetemporary($jsonData, OCI_TEMP_CLOB);
        oci_bind_by_name($stmtCharacterArray, ":data", $clob, -1, SQLT_CLOB);

        $result = oci_execute($stmtCharacterArray, OCI_DEFAULT);
        if (!$result) {
            $clob->free();
            throw new \Exception('Character array insert failed: ' . oci_error($stmtCharacterArray)['message']);
        }

        oci_commit($this->connection);
        $clob->free();

        return [
            'success' => true,
            'message' => 'Character array saved successfully',
            'dataSetId' => $dataSetId
        ];
    }

    private function insert_matrix($dataSetId, $data, $params)
    {
        $sqlMatrix = "INSERT INTO matrix (id, lines, columns, min_value, max_value, data) 
                    VALUES (:id, :lines, :columns, :min_value, :max_value, :data)";
        $stmtMatrix = oci_parse($this->connection, $sqlMatrix);

        oci_bind_by_name($stmtMatrix, ":id", $dataSetId);
        oci_bind_by_name($stmtMatrix, ":lines", $params['rows']);
        oci_bind_by_name($stmtMatrix, ":columns", $params['cols']);
        oci_bind_by_name($stmtMatrix, ":min_value", $params['minValue']);
        oci_bind_by_name($stmtMatrix, ":max_value", $params['maxValue']);

        $clob = oci_new_descriptor($this->connection, OCI_D_LOB);
        $clob->writetemporary(json_encode($data), OCI_TEMP_CLOB);
        oci_bind_by_name($stmtMatrix, ":data", $clob, -1, SQLT_CLOB);

        $result = oci_execute($stmtMatrix, OCI_DEFAULT);
        if (!$result) {
            $clob->free();
            throw new \Exception('Matrix insert failed: ' . oci_error($stmtMatrix)['message']);
        }

        oci_commit($this->connection);
        $clob->free();

        return [
            'success' => true,
            'message' => 'Matrix saved successfully',
            'dataSetId' => $dataSetId
        ];
    }

    private function insert_graph($dataSetId, $data, $params)
    {
        $sqlGraph = "INSERT INTO graph (id, nodes, edges, is_digraph, is_weighted, representation, data) 
                    VALUES (:id, :nodes, :edges, :is_digraph, :is_weighted, :representation, :data)";
        $stmtGraph = oci_parse($this->connection, $sqlGraph);

        oci_bind_by_name($stmtGraph, ":id", $dataSetId);
        oci_bind_by_name($stmtGraph, ":nodes", $params['vertices']);
        oci_bind_by_name($stmtGraph, ":edges", $params['edges']);

        $isDigraph = ($params['graphType'] === 'directed') ? 'y' : 'n';
        oci_bind_by_name($stmtGraph, ":is_digraph", $isDigraph);

        $isWeighted = ($params['isWeighted'] === true || $params['isWeighted'] === 'y') ? 'y' : 'n';
        oci_bind_by_name($stmtGraph, ":is_weighted", $isWeighted);

        $representationMap = [
            'adjacency-matrix' => 'adjacency_matrix',
            'adjacency-list' => 'adjacency_list',
            'edge-list' => 'edge_list'
        ];

        $frontendRep = $params['representation'] ?? 'adjacency-matrix';
        $representation = $representationMap[$frontendRep] ?? 'adjacency_matrix';
        oci_bind_by_name($stmtGraph, ":representation", $representation);

        $clob = oci_new_descriptor($this->connection, OCI_D_LOB);
        $clob->writetemporary(json_encode($data), OCI_TEMP_CLOB);
        oci_bind_by_name($stmtGraph, ":data", $clob, -1, SQLT_CLOB);

        $result = oci_execute($stmtGraph, OCI_DEFAULT);
        if (!$result) {
            $clob->free();
            throw new \Exception('Graph insert failed: ' . oci_error($stmtGraph)['message']);
        }

        oci_commit($this->connection);
        $clob->free();

        return [
            'success' => true,
            'message' => 'Graph saved successfully',
            'dataSetId' => $dataSetId
        ];
    }

    private function insert_tree($dataSetId, $data, $params)
    {
        $sqlTree = "INSERT INTO tree (id, nodes, edges, root, is_weighted, representation, data) 
                VALUES (:id, :nodes, :edges, :root, :is_weighted, :representation, :data)";
        $stmtTree = oci_parse($this->connection, $sqlTree);

        oci_bind_by_name($stmtTree, ":id", $dataSetId);
        oci_bind_by_name($stmtTree, ":nodes", $params['nodes']);

        $edges = $params['nodes'] - 1;
        oci_bind_by_name($stmtTree, ":edges", $edges);

        $root = 0;
        if (
            ($params['representation'] ?? '') === 'parent-list' &&
            is_array($data)
        ) {
            if (array_key_exists('parents', $data) && is_array($data['parents'])) {
                $root = array_search(-1, $data['parents']);
            } elseif (array_is_list($data)) {
                $root = array_search(-1, $data);
            }
            if ($root === false)
                $root = 0;
        }
        oci_bind_by_name($stmtTree, ":root", $root);

        $isWeighted = ($params['isWeighted'] === true || $params['isWeighted'] === 'y') ? 'y' : 'n';
        oci_bind_by_name($stmtTree, ":is_weighted", $isWeighted);

        $representationMap = [
            'adjacency-matrix' => 'adjacency_matrix',
            'adjacency-list' => 'adjacency_list',
            'parent-list' => 'parent_list'
        ];
        $frontendRep = $params['representation'] ?? 'parent-list';
        $representation = $representationMap[$frontendRep] ?? 'parent_list';
        oci_bind_by_name($stmtTree, ":representation", $representation);

        $clob = oci_new_descriptor($this->connection, OCI_D_LOB);

        if (
            $representation === 'parent_list' &&
            is_array($data) &&
            array_key_exists('parents', $data) &&
            array_key_exists('weights', $data)
        ) {
            $dataString = json_encode($data);
        } elseif ($representation === 'parent_list' && is_array($data) && array_is_list($data)) {
            $dataString = implode(',', $data);
        } else {
            $dataString = json_encode($data);
        }

        $clob->writetemporary($dataString, OCI_TEMP_CLOB);
        oci_bind_by_name($stmtTree, ":data", $clob, -1, SQLT_CLOB);

        $result = oci_execute($stmtTree, OCI_DEFAULT);
        if (!$result) {
            $clob->free();
            throw new \Exception('Tree insert failed: ' . oci_error($stmtTree)['message']);
        }

        oci_commit($this->connection);
        $clob->free();

        return [
            'success' => true,
            'message' => 'Tree saved successfully',
            'dataSetId' => $dataSetId
        ];
    }


}