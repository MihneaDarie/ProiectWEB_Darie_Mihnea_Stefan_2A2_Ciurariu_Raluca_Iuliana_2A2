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

    public function deleteUser(string $username): bool
    {
        try {
            oci_execute(oci_parse($this->connection, "BEGIN TRANSACTION"));

            $getUserIdSql = "SELECT id FROM users WHERE username = :username";
            $stmtUserId = oci_parse($this->connection, $getUserIdSql);
            oci_bind_by_name($stmtUserId, ":username", $username);
            
            if (!oci_execute($stmtUserId)) {
                throw new Exception(oci_error($stmtUserId)['message']);
            }
            
            $row = oci_fetch_assoc($stmtUserId);
            if (!$row) {
                throw new Exception('User not found');
            }
            $userId = $row['ID'];

            $getDatasetsSql = "SELECT id FROM data_set WHERE user_id = :user_id";
            $stmtDatasets = oci_parse($this->connection, $getDatasetsSql);
            oci_bind_by_name($stmtDatasets, ":user_id", $userId);
            
            if (!oci_execute($stmtDatasets)) {
                throw new Exception(oci_error($stmtDatasets)['message']);
            }

            $datasetIds = [];
            while ($row = oci_fetch_assoc($stmtDatasets)) {
                $datasetIds[] = $row['ID'];
            }

            if (!empty($datasetIds)) {
                $idList = implode(',', $datasetIds);
                
                $dependentTables = [
                    'graph',
                    'tree',
                    'number_array',
                    'character_array',
                    'matrix'
                ];

                foreach ($dependentTables as $table) {
                    $deleteSql = "DELETE FROM {$table} WHERE id IN ($idList)";
                    $stmt = oci_parse($this->connection, $deleteSql);
                    if (!oci_execute($stmt)) {
                        throw new Exception(oci_error($stmt)['message']);
                    }
                }

                $deleteDataSetSql = "DELETE FROM data_set WHERE id IN ($idList)";
                $stmtDataSet = oci_parse($this->connection, $deleteDataSetSql);
                if (!oci_execute($stmtDataSet)) {
                    throw new Exception(oci_error($stmtDataSet)['message']);
                }
            }

            $deleteUserSql = "DELETE FROM users WHERE id = :user_id";
            $stmtUser = oci_parse($this->connection, $deleteUserSql);
            oci_bind_by_name($stmtUser, ":user_id", $userId);
            if (!oci_execute($stmtUser)) {
                throw new Exception(oci_error($stmtUser)['message']);
            }

            oci_commit($this->connection);
            return true;
            
        } catch (Exception $e) {
            oci_rollback($this->connection);
            throw $e;
        }
    }
}