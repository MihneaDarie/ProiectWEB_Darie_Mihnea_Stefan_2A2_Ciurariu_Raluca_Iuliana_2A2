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
}
