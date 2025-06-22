<?php
require_once __DIR__ . '/Model.php';

class AdminModel extends Model {
    
    public function __construct($connection) {
        parent::__construct($connection);
    }

    public function getDashboardStats() {
        $stats = [];

        $sql = "SELECT COUNT(*) as total_users FROM users";
        $stmt = oci_parse($this->connection, $sql);
        oci_execute($stmt);
        $result = oci_fetch_array($stmt, OCI_ASSOC);
        $stats['total_users'] = $result['TOTAL_USERS'];


        $sql = "SELECT COUNT(*) as total_datasets FROM data_set";
        $stmt = oci_parse($this->connection, $sql);
        oci_execute($stmt);
        $result = oci_fetch_array($stmt, OCI_ASSOC);
        $stats['total_datasets'] = $result['TOTAL_DATASETS'];


        $sql = "SELECT role, COUNT(*) as count FROM users GROUP BY role";
        $stmt = oci_parse($this->connection, $sql);
        oci_execute($stmt);
        $roles = [];
        while ($row = oci_fetch_array($stmt, OCI_ASSOC)) {
            $roles[$row['ROLE']] = $row['COUNT'];
        }
        $stats['users_by_role'] = $roles;

        $sql = "SELECT COUNT(*) as recent_users FROM users WHERE created_at >= SYSTIMESTAMP - INTERVAL '7' DAY";
        $stmt = oci_parse($this->connection, $sql);
        oci_execute($stmt);
        $result = oci_fetch_array($stmt, OCI_ASSOC);
        $stats['recent_users'] = $result['RECENT_USERS'];


        $sql = "SELECT type, COUNT(*) as count FROM data_set GROUP BY type";
        $stmt = oci_parse($this->connection, $sql);
        oci_execute($stmt);
        $dataTypes = [];
        while ($row = oci_fetch_array($stmt, OCI_ASSOC)) {
            $dataTypes[$row['TYPE']] = $row['COUNT'];
        }
        $stats['datasets_by_type'] = $dataTypes;

        return $stats;
    }

    public function getAllUsers() {
        $sql = "SELECT * FROM admin_users_dashboard ORDER BY created_at DESC";
        $stmt = oci_parse($this->connection, $sql);
        oci_execute($stmt);
        
        $users = [];
        while ($row = oci_fetch_array($stmt, OCI_ASSOC + OCI_RETURN_NULLS)) {
            $users[] = [
                'id' => $row['ID'],
                'username' => $row['USERNAME'],
                'email' => $row['EMAIL'],
                'role' => $row['ROLE'],
                'created_at' => $row['CREATED_AT'],
                'total_datasets' => $row['TOTAL_DATASETS'],
                'number_arrays' => $row['NUMBER_ARRAYS'],
                'character_arrays' => $row['CHARACTER_ARRAYS'],
                'matrices' => $row['MATRICES'],
                'graphs' => $row['GRAPHS'],
                'trees' => $row['TREES'],
                'last_dataset_created' => $row['LAST_DATASET_CREATED']
            ];
        }
        
        return $users;
    }

    public function getUserDetails($userId) {

        $sql = "SELECT * FROM users WHERE id = :user_id";
        $stmt = oci_parse($this->connection, $sql);
        oci_bind_by_name($stmt, ":user_id", $userId);
        oci_execute($stmt);
        $user = oci_fetch_array($stmt, OCI_ASSOC + OCI_RETURN_NULLS);

        if (!$user) {
            throw new Exception('User not found');
        }

        $sql = "SELECT ds.*, 
                CASE 
                    WHEN ds.type = 'number_array' THEN na.length
                    WHEN ds.type = 'character_array' THEN ca.length
                    WHEN ds.type = 'matrix' THEN (m.lines * m.columns)
                    WHEN ds.type = 'graph' THEN g.nodes
                    WHEN ds.type = 'tree' THEN t.nodes
                END as size_info
                FROM data_set ds
                LEFT JOIN number_array na ON ds.id = na.id
                LEFT JOIN character_array ca ON ds.id = ca.id
                LEFT JOIN matrix m ON ds.id = m.id
                LEFT JOIN graph g ON ds.id = g.id
                LEFT JOIN tree t ON ds.id = t.id
                WHERE ds.user_id = :user_id
                ORDER BY ds.created_at DESC";
        
        $stmt = oci_parse($this->connection, $sql);
        oci_bind_by_name($stmt, ":user_id", $userId);
        oci_execute($stmt);
        
        $datasets = [];
        while ($row = oci_fetch_array($stmt, OCI_ASSOC + OCI_RETURN_NULLS)) {
            $datasets[] = [
                'id' => $row['ID'],
                'type' => $row['TYPE'],
                'label' => $row['LABEL'],
                'created_at' => $row['CREATED_AT'],
                'size_info' => $row['SIZE_INFO']
            ];
        }

        return [
            'user' => [
                'id' => $user['ID'],
                'username' => $user['USERNAME'],
                'email' => $user['EMAIL'],
                'role' => $user['ROLE'],
                'created_at' => $user['CREATED_AT']
            ],
            'datasets' => $datasets
        ];
    }

    public function updateUserRole($userId, $newRole) {
        $sql = "UPDATE users SET role = :role WHERE id = :user_id";
        $stmt = oci_parse($this->connection, $sql);
        oci_bind_by_name($stmt, ":role", $newRole);
        oci_bind_by_name($stmt, ":user_id", $userId);
        
        $result = oci_execute($stmt);
        if ($result) {
            oci_commit($this->connection);
        }
        
        return $result;
    }

    public function deleteUser($userId) {
        $sql = "BEGIN delete_user_complete(:user_id); END;";
        $stmt = oci_parse($this->connection, $sql);
        oci_bind_by_name($stmt, ":user_id", $userId);
        
        $result = oci_execute($stmt);
        if ($result) {
            oci_commit($this->connection);
        }
        
        return $result;
    }

}