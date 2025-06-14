<?php
require_once __DIR__ . '/Model.php';

class ProfileModel extends Model
{
    public function getUserDataDistributionByUsername(string $username): array
    {
        $sql = "
            SELECT USER_ID,
                   USERNAME,
                   TYPE,
                   TYPE_COUNT,
                   PERCENTAGE
              FROM USER_DATA_DISTRIBUTION
             WHERE USERNAME = :p_user
             ORDER BY TYPE
        ";

        $stmt = oci_parse($this->connection, $sql);
        if (!$stmt) {
            $err = oci_error($this->connection);
            throw new \Exception('oci_parse failed: ' . $err['message']);
        }

        oci_bind_by_name($stmt, ':p_user', $username, -1, SQLT_CHR);

        if (!oci_execute($stmt)) {
            $err = oci_error($stmt);
            throw new \Exception('oci_execute failed: ' . $err['message']);
        }

        $rows = [];
        while ($row = oci_fetch_assoc($stmt)) {
            $rows[] = $row;
        }
        return $rows;
    }

    public function getUserData(string $username): array
    {
        $sql = "SELECT username, email FROM users WHERE username = :username";
        $stmt = oci_parse($this->connection, $sql);

        oci_bind_by_name($stmt, ":username", $username);

        if (!oci_execute($stmt)) {
            $error = oci_error($stmt);
            throw new Exception($error['message']);
        }

        $user = oci_fetch_assoc($stmt);
        if (!$user) {
            throw new Exception('User not found');
        }

        return $user;
    }

    public function getUserHistory(string $username, string $type = null): array
    {
        $userSql = "SELECT ID FROM USERS WHERE USERNAME = :username";
        $userStmt = oci_parse($this->connection, $userSql);
        oci_bind_by_name($userStmt, ':username', $username);

        if (!oci_execute($userStmt)) {
            throw new \Exception('Failed to get user ID');
        }

        $userRow = oci_fetch_assoc($userStmt);
        if (!$userRow) {
            throw new \Exception('User not found');
        }

        $userId = $userRow['ID'];

        $sql = "
            SELECT 
                d.ID,
                d.USER_ID,
                d.TYPE,
                d.LABEL,
                TO_CHAR(d.CREATED_AT, 'YYYY-MM-DD\"T\"HH24:MI:SS') AS CREATED_AT,
                CASE 
                    WHEN d.TYPE = 'number_array' THEN na.DATA
                    WHEN d.TYPE = 'character_array' THEN ca.DATA
                    WHEN d.TYPE = 'matrix' THEN m.DATA
                    WHEN d.TYPE = 'graph' THEN g.DATA
                    WHEN d.TYPE = 'tree' THEN t.DATA
                END as DATA
            FROM data_set d
            LEFT JOIN number_array na ON d.ID = na.ID AND d.TYPE = 'number_array'
            LEFT JOIN character_array ca ON d.ID = ca.ID AND d.TYPE = 'character_array'
            LEFT JOIN matrix m ON d.ID = m.ID AND d.TYPE = 'matrix'
            LEFT JOIN graph g ON d.ID = g.ID AND d.TYPE = 'graph'
            LEFT JOIN tree t ON d.ID = t.ID AND d.TYPE = 'tree'
            WHERE d.USER_ID = :user_id
        ";

        if ($type) {
            $sql .= " AND d.TYPE = :type";
        }

        $sql .= " ORDER BY d.CREATED_AT DESC";

        $stmt = oci_parse($this->connection, $sql);
        if (!$stmt) {
            throw new \Exception('Failed to parse query');
        }

        oci_bind_by_name($stmt, ':user_id', $userId);
        if ($type) {
            oci_bind_by_name($stmt, ':type', $type);
        }

        if (!oci_execute($stmt)) {
            $err = oci_error($stmt);
            throw new \Exception('Failed to execute query: ' . $err['message']);
        }

        $rows = [];
        while ($row = oci_fetch_assoc($stmt)) {
            if (!empty($row['DATA'])) {
                if ($row['DATA'] instanceof OCILob) {
                    $clobData = $row['DATA']->read($row['DATA']->size());
                    $row['SIZE'] = strlen($clobData);
                } else {
                    $row['SIZE'] = strlen((string)$row['DATA']);
                }
            } else {
                $row['SIZE'] = 0;
            }

            unset($row['DATA']);
            $rows[] = $row;
        }

        return $rows;
    }

    public function getDatasetById(int $id, string $username): array
    {
        $userSql = "SELECT ID FROM USERS WHERE USERNAME = :username";
        $userStmt = oci_parse($this->connection, $userSql);
        oci_bind_by_name($userStmt, ':username', $username);

        if (!oci_execute($userStmt)) {
            $err = oci_error($userStmt);
            throw new \Exception('Failed to get user ID: ' . $err['message']);
        }

        $userRow = oci_fetch_assoc($userStmt);
        if (!$userRow) {
            throw new \Exception('User not found');
        }

        $userId = $userRow['ID'];

        $sql = "
            SELECT 
                d.ID,
                d.TYPE,
                d.LABEL,
                TO_CHAR(d.CREATED_AT, 'YYYY-MM-DD\"T\"HH24:MI:SS') AS CREATED_AT,
                CASE 
                    WHEN d.TYPE = 'number_array' THEN na.DATA
                    WHEN d.TYPE = 'character_array' THEN ca.DATA
                    WHEN d.TYPE = 'matrix' THEN m.DATA
                    WHEN d.TYPE = 'graph' THEN g.DATA
                    WHEN d.TYPE = 'tree' THEN t.DATA
                END as DATA,
                CASE 
                    WHEN d.TYPE = 'number_array' THEN 
                        'Length: ' || na.LENGTH || ', Type: ' || na.NUMBER_TYPE || 
                        ', Min: ' || na.MIN_VALUE || ', Max: ' || na.MAX_VALUE ||
                        ', Sorted: ' || na.SORTED
                    WHEN d.TYPE = 'character_array' THEN 
                        'Length: ' || ca.LENGTH || ', Encoding: ' || ca.ENCODING
                    WHEN d.TYPE = 'matrix' THEN 
                        'Lines: ' || m.LINES || ', Columns: ' || m.COLUMNS ||
                        ', Min: ' || m.MIN_VALUE || ', Max: ' || m.MAX_VALUE
                    WHEN d.TYPE = 'graph' THEN 
                        'Nodes: ' || g.NODES || ', Edges: ' || g.EDGES ||
                        ', Directed: ' || g.IS_DIGRAPH || ', Weighted: ' || g.IS_WEIGHTED ||
                        ', Representation: ' || g.REPRESENTATION
                    WHEN d.TYPE = 'tree' THEN 
                        'Nodes: ' || t.NODES || ', Edges: ' || t.EDGES ||
                        ', Root: ' || t.ROOT || ', Weighted: ' || t.IS_WEIGHTED ||
                        ', Representation: ' || t.REPRESENTATION
                END as DESCRIPTION
            FROM data_set d
            LEFT JOIN number_array na ON d.ID = na.ID AND d.TYPE = 'number_array'
            LEFT JOIN character_array ca ON d.ID = ca.ID AND d.TYPE = 'character_array'
            LEFT JOIN matrix m ON d.ID = m.ID AND d.TYPE = 'matrix'
            LEFT JOIN graph g ON d.ID = g.ID AND d.TYPE = 'graph'
            LEFT JOIN tree t ON d.ID = t.ID AND d.TYPE = 'tree'
            WHERE d.ID = :id AND d.USER_ID = :user_id
        ";

        $stmt = oci_parse($this->connection, $sql);
        if (!$stmt) {
            $err = oci_error($this->connection);
            throw new \Exception('Failed to parse query: ' . $err['message']);
        }

        oci_bind_by_name($stmt, ':id', $id);
        oci_bind_by_name($stmt, ':user_id', $userId);

        if (!oci_execute($stmt)) {
            $err = oci_error($stmt);
            throw new \Exception('Failed to execute query: ' . $err['message']);
        }

        $row = oci_fetch_assoc($stmt);
        if (!$row) {
            throw new \Exception('Dataset not found or access denied');
        }

        if (!empty($row['DATA'])) {
            if ($row['DATA'] instanceof OCILob) {
                $clobData = $row['DATA']->load();
                $row['DATA'] = $clobData;
            }
        } else {
            $row['DATA'] = '';
        }

        $result = [
            'ID' => $row['ID'],
            'TYPE' => $row['TYPE'],
            'LABEL' => $row['LABEL'],
            'CREATED_AT' => $row['CREATED_AT'],
            'DESCRIPTION' => $row['DESCRIPTION'],
            'DATA' => $row['DATA']
        ];

        return $result;
    }

    public function updateUser(string $currentUsername, array $data): bool
    {
        try {
            $sql = "SELECT password FROM users WHERE username = :username";
            $stmt = oci_parse($this->connection, $sql);
            oci_bind_by_name($stmt, ":username", $currentUsername);


            if (!oci_execute($stmt)) {
                throw new Exception(oci_error($stmt)['message']);
            }


            $user = oci_fetch_assoc($stmt);
            if (!$user || !password_verify($data['currentPassword'], $user['PASSWORD'])) {
                throw new Exception('Current password is incorrect');
            }

            oci_commit($this->connection);

            if ($data['username'] !== $currentUsername) {
                $checkSql = "SELECT 1 FROM users WHERE username = :username";
                $checkStmt = oci_parse($this->connection, $checkSql);
                oci_bind_by_name($checkStmt, ":username", $data['username']);


                if (!oci_execute($checkStmt)) {
                    throw new Exception(oci_error($checkStmt)['message']);
                }


                if (oci_fetch_assoc($checkStmt)) {
                    throw new Exception('Username already taken');
                }
            }

            $updates = [];
            $sql = "UPDATE users SET ";


            if ($data['username'] !== $currentUsername) {
                $updates[] = "username = :new_username";
            }
            if ($data['email']) {
                $updates[] = "email = :email";
            }
            if (!empty($data['newPassword'])) {
                $updates[] = "password = :new_password";
            }


            if (empty($updates)) {
                return true;
            }

            $sql .= implode(", ", $updates);
            $sql .= " WHERE username = :current_username";


            $stmt = oci_parse($this->connection, $sql);


            if ($data['username'] !== $currentUsername) {
                oci_bind_by_name($stmt, ":new_username", $data['username']);
            }
            if ($data['email']) {
                oci_bind_by_name($stmt, ":email", $data['email']);
            }
            if (!empty($data['newPassword'])) {
                $hash = password_hash($data['newPassword'], PASSWORD_DEFAULT);
                oci_bind_by_name($stmt, ":new_password", $hash);
            }
            oci_bind_by_name($stmt, ":current_username", $currentUsername);


            if (!oci_execute($stmt)) {
                oci_rollback($this->connection);
                throw new Exception(oci_error($stmt)['message']);
            }

            oci_commit($this->connection);
            return true;

        } catch (Exception $e) {
            oci_rollback($this->connection);
            throw $e;
        }
    }
}