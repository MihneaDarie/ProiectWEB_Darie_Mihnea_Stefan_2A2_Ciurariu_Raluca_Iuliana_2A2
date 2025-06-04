<?php

require_once __DIR__ . '/Model.php';

require_once __DIR__ . '/../../vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class GeneratorModel extends Model {
    private $userId = null;

    public function __construct($connection) {
        parent::__construct($connection);

        if(!isset($_ENV['JWT_SECRET'])) {
            $env = Dotenv\Dotenv::createImmutable(__DIR__ . '/../../');
            $env->load();
        }

        if(isset($_COOKIE['jwt'])){
            try{
                $decoded = JWT::decode($_COOKIE['jwt'], new Key($_ENV['JWT_SECRET'], 'HS256'));

                // Changed from $decoded->expires to $decoded->exp
                if(time() >= $decoded->exp) {
                    throw new \Exception('Token has expired!');
                }
                
                $username = $decoded->username;
                $this->userId = $this->get_userId_by_username($username);

            } catch(\Exception $e){
                throw new \Exception('Invalid token: ' . $e->getMessage());
            }
        } else {
            throw new \Exception('Authentication required');
        }
    }
   
    
    public function insert_numeric_array($minValue, $maxValue, $length, $sortOrder, $array) {
        $clob = null;
        try {
            oci_rollback($this->connection);

            $seqStmt = oci_parse($this->connection, 'SELECT data_set_seq.NEXTVAL FROM DUAL');
            oci_execute($seqStmt, OCI_DEFAULT);
            $row = oci_fetch_array($seqStmt, OCI_ASSOC);
            $dataSetId = $row['NEXTVAL'];

            $sqlDataSet = "INSERT INTO data_set (id, user_id, type, label, created_at) 
                        VALUES (:id, :userId, 'number_array', 'Generated Array', CURRENT_TIMESTAMP)";
            $stmtDataSet = oci_parse($this->connection, $sqlDataSet);
            oci_bind_by_name($stmtDataSet, ":id", $dataSetId);
            oci_bind_by_name($stmtDataSet, ":userId", $this->userId);
            
            $result1 = oci_execute($stmtDataSet, OCI_DEFAULT);
            if (!$result1) {
                $e = oci_error($stmtDataSet);
                oci_rollback($this->connection);
                throw new \Exception('Data set insert failed: ' . $e['message']);
            }

            $sqlNumberArray = "INSERT INTO number_array (id, length, min_value, max_value, sorted, data) 
                            VALUES (:id, :length, :min_value, :max_value, :sorted, :data)";
            $stmtNumberArray = oci_parse($this->connection, $sqlNumberArray);
            
            oci_bind_by_name($stmtNumberArray, ":id", $dataSetId);
            oci_bind_by_name($stmtNumberArray, ":length", $length);
            oci_bind_by_name($stmtNumberArray, ":min_value", $minValue);
            oci_bind_by_name($stmtNumberArray, ":max_value", $maxValue);
            oci_bind_by_name($stmtNumberArray, ":sorted", $sortOrder);

            $json_array = json_encode($array);
            $clob = oci_new_descriptor($this->connection, OCI_D_LOB);
            $clob->writetemporary($json_array, OCI_TEMP_CLOB);
            oci_bind_by_name($stmtNumberArray, ":data", $clob, -1, SQLT_CLOB);
            
            $result2 = oci_execute($stmtNumberArray, OCI_DEFAULT);
            if (!$result2) {
                $e = oci_error($stmtNumberArray);
                oci_rollback($this->connection);
                throw new \Exception('Number array insert failed: ' . $e['message']);
            }

            oci_commit($this->connection);
            $clob->free();

            return [
                'success' => true,
                'message' => 'Array saved successfully',
                'dataSetId' => $dataSetId
            ];

        } catch(\Exception $e) {
            if (isset($clob)) {
                $clob->free();
            }
            oci_rollback($this->connection);
            return [
                'success' => false,
                'message' => 'Error saving array: ' . $e->getMessage()
            ];
        }
    }

}