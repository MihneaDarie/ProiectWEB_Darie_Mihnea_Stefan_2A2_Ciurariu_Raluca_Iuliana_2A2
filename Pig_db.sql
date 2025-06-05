drop table users cascade constraints
/
drop table data_set cascade CONSTRAINTS
/
drop table number_array CASCADE CONSTRAINTS
/
drop table character_array CASCADE CONSTRAINTS
/
drop table matrix CASCADE CONSTRAINTS
/
drop table graph CASCADE CONSTRAINTS
/
drop table tree CASCADE CONSTRAINTS
/
DROP SEQUENCE user_seq
/
DROP SEQUENCE data_set_seq
/
create SEQUENCE user_seq start with 1 increment by 1
/

CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username VARCHAR2(50) UNIQUE NOT NULL,
    password VARCHAR2(255) NOT NULL,
    email VARCHAR2(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
/

create or replace trigger user_inc
before insert on users
for each row
begin
    SELECT user_seq.NEXTVAL INTO :NEW.id FROM dual;
end;
/
create SEQUENCE data_set_seq start with 1 increment by 1
/
create table data_set(
    id INTEGER NOT NULL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR2(15) CHECK(type IN ('number_array','character_array','matrix','graph','tree')),
    label VARCHAR2(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_data_set_id_users FOREIGN KEY (user_id) REFERENCES users(id)
)
/
create or replace trigger data_set_inc
before insert on data_set
for each row
begin
    SELECT data_set_seq.NEXTVAL INTO :NEW.id FROM dual;
end;
/
create table number_array(
    id INTEGER NOT NULL PRIMARY KEY,
    length INTEGER,
    number_type CHAR(5) default 'int' check(number_type in ('int','float')),
    min_value NUMBER,
    max_value NUMBER,
    sorted CHAR(4) DEFAULT 'none' check(sorted in ('none','asc','desc')),
    data CLOB,
    CONSTRAINT fk_number_array_id_data_set FOREIGN KEY (id) REFERENCES data_set(id)
)
/
create table character_array(
    id INTEGER NOT NULL PRIMARY KEY,
    length INTEGER,
    encoding VARCHAR2(15) DEFAULT 'ascii' check(encoding in ('ascii','utf8','unicode','binary')),
    data CLOB,
    CONSTRAINT fk_character_array_id_data_set FOREIGN KEY (id) REFERENCES data_set(id)
)
/
create table matrix(
    id INTEGER NOT NULL PRIMARY KEY,
    lines INTEGER,
    columns INTEGER,
    min_value NUMBER,
    max_value NUMBER,
    data CLOB,
    CONSTRAINT fk_matrix_id_data_set FOREIGN KEY (id) REFERENCES data_set(id)
)
/
create table graph(
    id INTEGER NOT NULL PRIMARY KEY,
    nodes INTEGER,
    edges INTEGER,
    is_digraph CHAR(1) DEFAULT 'n' check(is_digraph in ('y','n')),
    is_weighted CHAR(1) DEFAULT 'n' check(is_weighted in ('y','n')),
    representation VARCHAR2(25) DEFAULT 'adjacency_matrix' check(representation in ('edge_list','adjacency_matrix','adjacency_list')),
    data CLOB,
    CONSTRAINT fk_graph_id_data_set FOREIGN KEY (id) REFERENCES data_set(id)
)
/
CREATE OR REPLACE FUNCTION is_valid_adjacency_list(
    p_data        CLOB,
    p_nodes       INTEGER,
    p_is_digraph  CHAR DEFAULT 'y',
    p_is_weighted CHAR DEFAULT 'n'
) RETURN CHAR IS
    c_yes         CONSTANT CHAR := 'y';
    c_no          CONSTANT CHAR := 'n';
    
    v_source      VARCHAR2(32767);
    v_node_str    VARCHAR2(4000);
    v_neighbor_str VARCHAR2(1000);
    v_node_max    NUMBER := p_nodes - 1;
    v_has_weights BOOLEAN := (p_is_weighted = c_yes);
    v_is_digraph  BOOLEAN := (p_is_digraph = c_yes);
    v_step        VARCHAR2(100);
    v_node_count  NUMBER;
    v_current_node NUMBER := 0;
    
    v_neighbor_node NUMBER;
    v_weight        NUMBER;
    v_comma_pos     NUMBER;
    v_part1         VARCHAR2(100);
    v_part2         VARCHAR2(100);
    v_neighbor_count NUMBER;
    
    TYPE t_edge_map IS TABLE OF NUMBER INDEX BY VARCHAR2(100);
    v_edges t_edge_map;
    v_edge_key VARCHAR2(100);
    v_reverse_key VARCHAR2(100);
    
BEGIN
    v_step := 'Initial parameter validation';
    
    IF p_data IS NULL THEN
        RAISE_APPLICATION_ERROR(-20100, 'VALIDATION_ERROR: Step=' || v_step || ' - p_data is NULL');
    END IF;
    
    IF p_nodes IS NULL THEN
        RAISE_APPLICATION_ERROR(-20101, 'VALIDATION_ERROR: Step=' || v_step || ' - p_nodes is NULL');
    END IF;
    
    IF p_nodes <= 0 THEN
        RAISE_APPLICATION_ERROR(-20102, 'VALIDATION_ERROR: Step=' || v_step || ' - p_nodes must be > 0, got: ' || p_nodes);
    END IF;
    
    IF p_is_digraph NOT IN (c_yes, c_no) THEN
        RAISE_APPLICATION_ERROR(-20103, 'VALIDATION_ERROR: Step=' || v_step || ' - p_is_digraph must be y or n, got: ' || p_is_digraph);
    END IF;
    
    IF p_is_weighted NOT IN (c_yes, c_no) THEN
        RAISE_APPLICATION_ERROR(-20104, 'VALIDATION_ERROR: Step=' || v_step || ' - p_is_weighted must be y or n, got: ' || p_is_weighted);
    END IF;
    
    BEGIN
        v_source := DBMS_LOB.SUBSTR(p_data, 32767, 1);
        v_source := REGEXP_REPLACE(v_source, '[[:space:]]+', '');
    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20105, 'VALIDATION_ERROR: Step=' || v_step || ' - Failed to process CLOB data: ' || SQLERRM);
    END;
    
    v_step := 'Format validation';
    
    IF NOT REGEXP_LIKE(v_source, '^\[.*\]$') THEN
        RAISE_APPLICATION_ERROR(-20106, 'VALIDATION_ERROR: Step=' || v_step || ' - Data must be in format [...] but got: ' || SUBSTR(v_source, 1, 100));
    END IF;

    v_step := 'Node extraction and processing';
    
    v_source := SUBSTR(v_source, 2, LENGTH(v_source) - 2);
    
    v_node_count := 0;
    DECLARE
        v_bracket_count NUMBER := 0;
        v_char CHAR(1);
    BEGIN
        FOR i IN 1..LENGTH(v_source) LOOP
            v_char := SUBSTR(v_source, i, 1);
            IF v_char = '[' THEN
                v_bracket_count := v_bracket_count + 1;
                IF v_bracket_count = 1 THEN
                    v_node_count := v_node_count + 1;
                END IF;
            ELSIF v_char = ']' THEN
                v_bracket_count := v_bracket_count - 1;
            END IF;
        END LOOP;
    END;
    
    IF v_node_count != p_nodes THEN
        RAISE_APPLICATION_ERROR(-20107, 'VALIDATION_ERROR: Step=' || v_step || ' - Expected ' || p_nodes || ' nodes but found ' || v_node_count);
    END IF;
    
    DECLARE
        v_pos NUMBER := 1;
        v_start_pos NUMBER;
        v_end_pos NUMBER;
        v_bracket_count NUMBER;
    BEGIN
        FOR node_idx IN 0..p_nodes-1 LOOP
            v_current_node := node_idx;
            v_step := 'Processing node ' || node_idx || ' of ' || (p_nodes-1);
            
            WHILE v_pos <= LENGTH(v_source) AND SUBSTR(v_source, v_pos, 1) != '[' LOOP
                v_pos := v_pos + 1;
            END LOOP;
            
            IF v_pos > LENGTH(v_source) THEN
                RAISE_APPLICATION_ERROR(-20108, 'VALIDATION_ERROR: Step=' || v_step || ' - Could not find adjacency list for node ' || node_idx);
            END IF;
            
            v_start_pos := v_pos + 1;
            v_bracket_count := 1;
            v_pos := v_pos + 1;
            
            WHILE v_pos <= LENGTH(v_source) AND v_bracket_count > 0 LOOP
                IF SUBSTR(v_source, v_pos, 1) = '[' THEN
                    v_bracket_count := v_bracket_count + 1;
                ELSIF SUBSTR(v_source, v_pos, 1) = ']' THEN
                    v_bracket_count := v_bracket_count - 1;
                END IF;
                v_pos := v_pos + 1;
            END LOOP;
            
            v_end_pos := v_pos - 2;
            
            IF v_end_pos >= v_start_pos THEN
                v_node_str := SUBSTR(v_source, v_start_pos, v_end_pos - v_start_pos + 1);
            ELSE
                v_node_str := '';
            END IF;
            
            IF LENGTH(v_node_str) > 0 THEN
                IF v_has_weights THEN
                    v_neighbor_count := REGEXP_COUNT(v_node_str, '\[') ;
                    
                    FOR i IN 1..v_neighbor_count LOOP
                        v_neighbor_str := REGEXP_SUBSTR(v_node_str, '\[[^\]]+\]', 1, i);
                        v_neighbor_str := REPLACE(REPLACE(v_neighbor_str, '[', ''), ']', '');
                        
                        v_comma_pos := INSTR(v_neighbor_str, ',');
                        IF v_comma_pos = 0 THEN
                            RAISE_APPLICATION_ERROR(-20109, 'VALIDATION_ERROR: Step=' || v_step || ' - Weighted neighbor must have format [node,weight]: ' || v_neighbor_str);
                        END IF;
                        
                        v_part1 := TRIM(SUBSTR(v_neighbor_str, 1, v_comma_pos - 1));
                        v_part2 := TRIM(SUBSTR(v_neighbor_str, v_comma_pos + 1));
                        
                        BEGIN
                            v_neighbor_node := TO_NUMBER(v_part1);
                        EXCEPTION
                            WHEN VALUE_ERROR THEN
                                RAISE_APPLICATION_ERROR(-20110, 'VALIDATION_ERROR: Step=' || v_step || ' - Invalid neighbor node: ' || v_part1);
                        END;
                        
                        BEGIN
                            v_weight := TO_NUMBER(v_part2);
                            IF v_weight < 0 THEN
                                RAISE_APPLICATION_ERROR(-20111, 'VALIDATION_ERROR: Step=' || v_step || ' - Weight must be >= 0, got: ' || v_weight);
                            END IF;
                        EXCEPTION
                            WHEN VALUE_ERROR THEN
                                RAISE_APPLICATION_ERROR(-20112, 'VALIDATION_ERROR: Step=' || v_step || ' - Invalid weight: ' || v_part2);
                        END;
                        
                        IF v_neighbor_node < 0 OR v_neighbor_node > v_node_max THEN
                            RAISE_APPLICATION_ERROR(-20113, 'VALIDATION_ERROR: Step=' || v_step || ' - Neighbor node ' || v_neighbor_node || ' out of range [0,' || v_node_max || ']');
                        END IF;
                        
                        IF NOT v_is_digraph THEN
                            v_edge_key := node_idx || ',' || v_neighbor_node;
                            v_edges(v_edge_key) := v_weight;
                        END IF;
                    END LOOP;
                ELSE
                    v_neighbor_count := REGEXP_COUNT(v_node_str, ',') + 1;
                    IF TRIM(v_node_str) = '' THEN
                        v_neighbor_count := 0;
                    END IF;
                    
                    FOR i IN 1..v_neighbor_count LOOP
                        v_neighbor_str := TRIM(REGEXP_SUBSTR(v_node_str, '[^,]+', 1, i));
                        
                        BEGIN
                            v_neighbor_node := TO_NUMBER(v_neighbor_str);
                        EXCEPTION
                            WHEN VALUE_ERROR THEN
                                RAISE_APPLICATION_ERROR(-20114, 'VALIDATION_ERROR: Step=' || v_step || ' - Invalid neighbor node: ' || v_neighbor_str);
                        END;
                        
                        IF v_neighbor_node < 0 OR v_neighbor_node > v_node_max THEN
                            RAISE_APPLICATION_ERROR(-20115, 'VALIDATION_ERROR: Step=' || v_step || ' - Neighbor node ' || v_neighbor_node || ' out of range [0,' || v_node_max || ']');
                        END IF;
                        
                        IF NOT v_is_digraph THEN
                            v_edge_key := node_idx || ',' || v_neighbor_node;
                            v_edges(v_edge_key) := 1; 
                        END IF;
                    END LOOP;
                END IF;
            END IF;
        END LOOP;
    END;
    
    IF NOT v_is_digraph THEN
        v_step := 'Undirected graph symmetry validation';
        
        v_edge_key := v_edges.FIRST;
        WHILE v_edge_key IS NOT NULL LOOP
            v_comma_pos := INSTR(v_edge_key, ',');
            v_reverse_key := SUBSTR(v_edge_key, v_comma_pos + 1) || ',' || SUBSTR(v_edge_key, 1, v_comma_pos - 1);
            
            IF NOT v_edges.EXISTS(v_reverse_key) THEN
                RAISE_APPLICATION_ERROR(-20116, 'VALIDATION_ERROR: Step=' || v_step || ' - Missing reverse edge for undirected graph: ' || v_reverse_key || ' (found: ' || v_edge_key || ')');
            END IF;
            
            IF v_has_weights AND v_edges(v_edge_key) != v_edges(v_reverse_key) THEN
                RAISE_APPLICATION_ERROR(-20117, 'VALIDATION_ERROR: Step=' || v_step || ' - Weight mismatch in undirected graph: ' || v_edge_key || '=' || v_edges(v_edge_key) || ' vs ' || v_reverse_key || '=' || v_edges(v_reverse_key));
            END IF;
            
            v_edge_key := v_edges.NEXT(v_edge_key);
        END LOOP;
    END IF;
    
    v_step := 'Validation complete';
    RETURN c_yes;
    
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE BETWEEN -20199 AND -20100 THEN
            RAISE;
        ELSE
            RAISE_APPLICATION_ERROR(-20199, 'VALIDATION_ERROR: Step=' || v_step || ' - Unexpected system error: ' || SQLERRM);
        END IF;
END is_valid_adjacency_list;
/

create or replace FUNCTION is_valid_edge_list(
    p_data        CLOB,
    p_nodes       INTEGER,
    p_is_digraph  CHAR DEFAULT 'y',
    p_is_weighted CHAR DEFAULT 'n'
) RETURN CHAR IS
    c_yes         CONSTANT CHAR := 'y';
    c_no          CONSTANT CHAR := 'n';

    v_source      VARCHAR2(32767);
    v_edge_str    VARCHAR2(1000);
    v_node_max    NUMBER := p_nodes - 1;
    v_has_weights BOOLEAN := (p_is_weighted = c_yes);
    v_seen_edges  VARCHAR2(4000) := '';
    v_step        VARCHAR2(100);
    v_edge_count  NUMBER;
    v_current_edge NUMBER := 0;

    v_source_node NUMBER;
    v_target_node NUMBER;
    v_weight      NUMBER;
    v_comma_pos1  NUMBER;
    v_comma_pos2  NUMBER;
    v_part1       VARCHAR2(100);
    v_part2       VARCHAR2(100);
    v_part3       VARCHAR2(100);

BEGIN
    v_step := 'Initial parameter validation';

    IF p_data IS NULL THEN
        RAISE_APPLICATION_ERROR(-20100, 'VALIDATION_ERROR: Step=' || v_step || ' - p_data is NULL');
    END IF;

    IF p_nodes IS NULL THEN
        RAISE_APPLICATION_ERROR(-20101, 'VALIDATION_ERROR: Step=' || v_step || ' - p_nodes is NULL');
    END IF;

    IF p_nodes <= 0 THEN
        RAISE_APPLICATION_ERROR(-20102, 'VALIDATION_ERROR: Step=' || v_step || ' - p_nodes must be > 0, got: ' || p_nodes);
    END IF;

    IF p_is_digraph NOT IN (c_yes, c_no) THEN
        RAISE_APPLICATION_ERROR(-20103, 'VALIDATION_ERROR: Step=' || v_step || ' - p_is_digraph must be y or n, got: ' || p_is_digraph);
    END IF;

    IF p_is_weighted NOT IN (c_yes, c_no) THEN
        RAISE_APPLICATION_ERROR(-20104, 'VALIDATION_ERROR: Step=' || v_step || ' - p_is_weighted must be y or n, got: ' || p_is_weighted);
    END IF;

    BEGIN
        v_source := DBMS_LOB.SUBSTR(p_data, 32767, 1);

        v_source := REGEXP_REPLACE(v_source, '[[:space:]]+', '');

    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20105, 'VALIDATION_ERROR: Step=' || v_step || ' - Failed to process CLOB data: ' || SQLERRM);
    END;

    v_step := 'Format validation';

    IF NOT REGEXP_LIKE(v_source, '^\[\[.*\]\]$') THEN
        RAISE_APPLICATION_ERROR(-20106, 'VALIDATION_ERROR: Step=' || v_step || ' - Data must be in format [[...]] but got: ' || SUBSTR(v_source, 1, 100));
    END IF;

    v_step := 'Edge extraction and processing';

    v_source := SUBSTR(v_source, 2, LENGTH(v_source) - 2);

    v_source := REPLACE(v_source, '],[', '|');
    v_source := REPLACE(v_source, '[', '');
    v_source := REPLACE(v_source, ']', '');


    v_edge_count := REGEXP_COUNT(v_source, '\|') + 1;

    FOR i IN 1..v_edge_count LOOP
        v_current_edge := i;
        v_step := 'Processing edge ' || i || ' of ' || v_edge_count;

        BEGIN
            v_edge_str := REGEXP_SUBSTR(v_source, '[^|]+', 1, i);

            IF v_edge_str IS NULL THEN
                RAISE_APPLICATION_ERROR(-20108, 'VALIDATION_ERROR: Step=' || v_step || ' - Could not extract edge ' || i || ' from: ' || v_source);
            END IF;


            v_comma_pos1 := INSTR(v_edge_str, ',', 1, 1);
            v_comma_pos2 := INSTR(v_edge_str, ',', 1, 2);

            IF v_comma_pos1 = 0 THEN
                RAISE_APPLICATION_ERROR(-20109, 'VALIDATION_ERROR: Step=' || v_step || ' - No comma found in edge: ' || v_edge_str);
            END IF;

            v_part1 := TRIM(SUBSTR(v_edge_str, 1, v_comma_pos1 - 1));

            IF v_comma_pos2 > 0 THEN
                v_part2 := TRIM(SUBSTR(v_edge_str, v_comma_pos1 + 1, v_comma_pos2 - v_comma_pos1 - 1));
                v_part3 := TRIM(SUBSTR(v_edge_str, v_comma_pos2 + 1));
            ELSE
                v_part2 := TRIM(SUBSTR(v_edge_str, v_comma_pos1 + 1));
                v_part3 := NULL;
            END IF;

            IF v_has_weights AND v_part3 IS NULL THEN
                RAISE_APPLICATION_ERROR(-20110, 'VALIDATION_ERROR: Step=' || v_step || ' - Weighted edge must have 3 parts but only found 2 in: ' || v_edge_str);
            END IF;

            IF NOT v_has_weights AND v_part3 IS NOT NULL THEN
                RAISE_APPLICATION_ERROR(-20111, 'VALIDATION_ERROR: Step=' || v_step || ' - Unweighted edge must have 2 parts but found 3 in: ' || v_edge_str);
            END IF;

            BEGIN
                v_source_node := TO_NUMBER(v_part1);
            EXCEPTION
                WHEN VALUE_ERROR THEN
                    RAISE_APPLICATION_ERROR(-20112, 'VALIDATION_ERROR: Step=' || v_step || ' - Invalid source node: ' || v_part1);
            END;

            BEGIN
                v_target_node := TO_NUMBER(v_part2);
            EXCEPTION
                WHEN VALUE_ERROR THEN
                    RAISE_APPLICATION_ERROR(-20113, 'VALIDATION_ERROR: Step=' || v_step || ' - Invalid target node: ' || v_part2);
            END;

            IF v_source_node < 0 OR v_source_node > v_node_max THEN
                RAISE_APPLICATION_ERROR(-20114, 'VALIDATION_ERROR: Step=' || v_step || ' - Source node ' || v_source_node || ' out of range [0,' || v_node_max || ']');
            END IF;

            IF v_target_node < 0 OR v_target_node > v_node_max THEN
                RAISE_APPLICATION_ERROR(-20115, 'VALIDATION_ERROR: Step=' || v_step || ' - Target node ' || v_target_node || ' out of range [0,' || v_node_max || ']');
            END IF;

            IF v_has_weights THEN
                BEGIN
                    v_weight := TO_NUMBER(v_part3);

                    IF v_weight < 0 THEN
                        RAISE_APPLICATION_ERROR(-20116, 'VALIDATION_ERROR: Step=' || v_step || ' - Weight must be >= 0, got: ' || v_weight);
                    END IF;
                EXCEPTION
                    WHEN VALUE_ERROR THEN
                        RAISE_APPLICATION_ERROR(-20117, 'VALIDATION_ERROR: Step=' || v_step || ' - Invalid weight: ' || v_part3);
                END;
            ELSE
                v_weight := 1;
            END IF;

            IF INSTR(v_seen_edges, v_source_node || ',' || v_target_node || ';') > 0 THEN
                RAISE_APPLICATION_ERROR(-20118, 'VALIDATION_ERROR: Step=' || v_step || ' - Duplicate edge found: [' || 
                    v_source_node || ',' || v_target_node || ']');
            END IF;

            v_seen_edges := v_seen_edges || v_source_node || ',' || v_target_node || ';';

        EXCEPTION
            WHEN OTHERS THEN
                IF SQLCODE BETWEEN -20199 AND -20100 THEN
                    RAISE;
                ELSE
                    RAISE_APPLICATION_ERROR(-20119, 'VALIDATION_ERROR: Step=' || v_step || ' - Unexpected error: ' || SQLERRM);
                END IF;
        END;
    END LOOP;

    v_step := 'Undirected graph symmetry validation';


    v_step := 'Validation complete';

    RETURN c_yes;

EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE BETWEEN -20199 AND -20100 THEN
            RAISE;
        ELSE
            RAISE_APPLICATION_ERROR(-20199, 'VALIDATION_ERROR: Step=' || v_step || ' - Unexpected system error: ' || SQLERRM);
        END IF;
END is_valid_edge_list;
/
create or replace FUNCTION is_valid_adjacency_matrix (
   p_data        CLOB,
   p_nodes       PLS_INTEGER,
   p_is_digraph  CHAR,
   p_is_weighted CHAR
)
   RETURN CHAR
IS
   TYPE matrix_row  IS TABLE OF NUMBER;
   TYPE matrix_type IS TABLE OF matrix_row;
   v_matrix  matrix_type := matrix_type();
   v_source   VARCHAR2 (32767);
   v_row_txt  VARCHAR2 (32767);
   v_value    NUMBER;
   c_yes  CHAR(1) := 'y';
   c_no   CHAR(1) := 'n';

   v_error_msg   VARCHAR2(4000);
   v_error_code  NUMBER;
   v_context     VARCHAR2(500);

BEGIN
   IF p_data IS NULL
      OR p_nodes IS NULL
      OR p_nodes <= 0
      OR p_is_digraph NOT IN (c_yes,c_no)
      OR p_is_weighted NOT IN (c_yes,c_no)
   THEN
      RETURN c_no;
   END IF;

   BEGIN
      v_context := 'Data preprocessing - CLOB substring extraction';
      v_source := DBMS_LOB.SUBSTR(p_data, 32767, 1);

      v_context := 'Data preprocessing - String replacements';
      v_source := REPLACE (v_source, '[[',  '');
      v_source := REPLACE (v_source, ']]',  '');
      v_source := REPLACE (v_source, '],[', '|');
   EXCEPTION
      WHEN VALUE_ERROR THEN
         RAISE_APPLICATION_ERROR(-20001, 'Invalid CLOB data or string operation in ' || v_context);
      WHEN OTHERS THEN
         v_error_code := SQLCODE;
         v_error_msg := SQLERRM;
         RAISE_APPLICATION_ERROR(-20001, 'Data preprocessing error in ' || v_context || ': ' || v_error_code || ' - ' || v_error_msg);
   END;

   BEGIN
      v_context := 'Matrix initialization - Extending main collection';
      v_matrix.EXTEND(p_nodes);

      FOR i IN 1 .. p_nodes LOOP
         v_context := 'Row extraction - Processing row ' || i;
         v_row_txt := REGEXP_SUBSTR (v_source, '[^|]+', 1, i);

         IF v_row_txt IS NULL THEN
            RAISE_APPLICATION_ERROR(-20009, 
               'Row ' || i || ' is NULL or missing in matrix data');
         END IF;

         v_context := 'Matrix row initialization - Row ' || i;
         v_matrix(i) := matrix_row();
         v_matrix(i).EXTEND (p_nodes);

         FOR j IN 1 .. p_nodes LOOP
            BEGIN
               v_context := 'Value extraction and conversion - Row ' || i || ', Column ' || j;
               v_value := TO_NUMBER (REGEXP_SUBSTR (v_row_txt, '[^,]+', 1, j), '99999');

               IF v_value < 0 THEN
                  RAISE_APPLICATION_ERROR(-20004, 'Negative value found at position [' || i || '][' || j || ']: ' || v_value);
               END IF;

               IF p_is_weighted = c_no AND v_value NOT IN (0,1) THEN
                  RAISE_APPLICATION_ERROR(-20005, 'Non-binary value in unweighted graph at position [' || i || '][' || j || ']: ' || v_value);
               END IF;

               IF i = j AND v_value <> 0 THEN
                  RAISE_APPLICATION_ERROR(-20006, 'Self-loop detected at diagonal position [' || i || '][' || j || ']: ' || v_value);
               END IF;

               v_matrix(i)(j) := v_value;

            EXCEPTION
               WHEN VALUE_ERROR THEN
                  RAISE_APPLICATION_ERROR(-20003, 'Invalid number format at position [' || i || '][' || j || '] in ' || v_context);
               WHEN INVALID_NUMBER THEN
                  RAISE_APPLICATION_ERROR(-20003, 'Cannot convert to number at position [' || i || '][' || j || '] in ' || v_context);
            END;
         END LOOP;
      END LOOP;

   EXCEPTION
      WHEN SUBSCRIPT_OUTSIDE_LIMIT THEN
         RAISE_APPLICATION_ERROR(-20007, 'Array index out of bounds in ' || v_context);
      WHEN SUBSCRIPT_BEYOND_COUNT THEN
         RAISE_APPLICATION_ERROR(-20007, 'Array not properly extended in ' || v_context);
      WHEN COLLECTION_IS_NULL THEN
         RAISE_APPLICATION_ERROR(-20010, 'Collection not initialized in ' || v_context);
      WHEN OTHERS THEN
         v_error_code := SQLCODE;
         v_error_msg := SQLERRM;
         RAISE_APPLICATION_ERROR(-20002, 'Matrix processing error in ' || v_context || ': ' || v_error_code || ' - ' || v_error_msg);
   END;

   IF p_is_digraph = c_no THEN
      BEGIN
         v_context := 'Symmetry validation for undirected graph';
         FOR i IN 1 .. p_nodes LOOP
            FOR j IN 1 .. p_nodes LOOP
               IF v_matrix(i)(j) <> v_matrix(j)(i) THEN
                  RAISE_APPLICATION_ERROR(-20008, 'Asymmetric matrix detected - Element[' || i || '][' || j || '] = ' || v_matrix(i)(j) || ' != Element[' || j || '][' || i || '] = ' || v_matrix(j)(i));
               END IF;
            END LOOP;
         END LOOP;
      EXCEPTION
         WHEN SUBSCRIPT_OUTSIDE_LIMIT THEN
            RAISE_APPLICATION_ERROR(-20007, 'Array index out of bounds during symmetry check in ' || v_context);
         WHEN OTHERS THEN
            v_error_code := SQLCODE;
            v_error_msg := SQLERRM;
            RAISE_APPLICATION_ERROR(-20008, 'Symmetry validation error in ' || v_context || ': ' || v_error_code || ' - ' || v_error_msg);
      END;
   END IF;

   RETURN c_yes;

EXCEPTION
   WHEN OTHERS THEN
      v_error_code := SQLCODE;
      v_error_msg := SQLERRM;

      IF v_error_code BETWEEN -20999 AND -20001 THEN
         RAISE;
      ELSE

         RAISE_APPLICATION_ERROR(-20000, 'Unexpected error in is_valid_adjacency_matrix' || CASE WHEN v_context IS NOT NULL THEN ' (Context: ' || v_context || ')' END || ': ' || v_error_code || ' - ' || v_error_msg);
      END IF;
END is_valid_adjacency_matrix;
/


create table tree(
    id INTEGER NOT NULL PRIMARY KEY,
    nodes INTEGER,
    edges INTEGER,
    root INTEGER,
    is_weighted CHAR(1),
    representation VARCHAR2(25) DEFAULT 'adjacency_matrix' check(representation in ('adjacency_matrix','adjacency_list','parent_list')),
    data CLOB,
    CONSTRAINT fk_tree_id_data_set FOREIGN KEY (id) REFERENCES data_set(id)
)
/

--statistics--
CREATE OR REPLACE FORCE VIEW "STUDENT"."USER_DATA_DISTRIBUTION" ("USER_ID", "USERNAME", "TYPE", "TYPE_COUNT", "PERCENTAGE") AS 
  SELECT 
    u.id AS user_id,
    u.username,
    d.type,
    COUNT(*) AS type_count,
    ROUND(COUNT(*) * 100.0 / NULLIF((
        SELECT COUNT(*) FROM data_set ds WHERE ds.user_id = u.id
    ), 0), 2) AS percentage
FROM 
    users u
JOIN 
    data_set d ON u.id = d.user_id
GROUP BY 
    u.id, u.username, d.type
ORDER BY u.id
/

CREATE OR REPLACE PACKAGE pkg_graph_handler AS
    
    PROCEDURE insert_graph(
        p_user_id INTEGER,
        p_label VARCHAR2,
        p_nodes INTEGER,
        p_edges INTEGER,
        p_is_digraph CHAR DEFAULT 'n',
        p_is_weighted CHAR DEFAULT 'n',
        p_representation VARCHAR2 DEFAULT 'adjacency_matrix',
        p_data CLOB,
        p_graph_id OUT INTEGER
    );
    
    FUNCTION validate_graph_data(
        p_data CLOB,
        p_nodes INTEGER,
        p_edges INTEGER,
        p_is_digraph CHAR,
        p_is_weighted CHAR,
        p_representation VARCHAR2
    ) RETURN VARCHAR2;
    
END pkg_graph_handler;
/

CREATE OR REPLACE PACKAGE BODY pkg_graph_handler AS

    FUNCTION validate_graph_data(
        p_data CLOB,
        p_nodes INTEGER,
        p_edges INTEGER,
        p_is_digraph CHAR,
        p_is_weighted CHAR,
        p_representation VARCHAR2
    ) RETURN VARCHAR2 IS
        l_error_msg VARCHAR2(4000);
        l_validation_result CHAR(1);
    BEGIN
        BEGIN
            CASE p_representation
                WHEN 'adjacency_matrix' THEN
                    l_validation_result := is_valid_adjacency_matrix(p_data, p_nodes, p_is_digraph, p_is_weighted);
                WHEN 'edge_list' THEN
                    l_validation_result := is_valid_edge_list(p_data, p_nodes, p_is_digraph, p_is_weighted);
                WHEN 'adjacency_list' THEN
                    l_validation_result := is_valid_adjacency_list(p_data, p_nodes, p_is_digraph, p_is_weighted);
            END CASE;
            
            IF l_validation_result = 'y' THEN
                RETURN NULL;
            ELSE
                RETURN 'Validation failed for ' || p_representation;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RETURN SQLERRM;
        END;
    END validate_graph_data;
    
    PROCEDURE insert_graph(
        p_user_id INTEGER,
        p_label VARCHAR2,
        p_nodes INTEGER,
        p_edges INTEGER,
        p_is_digraph CHAR DEFAULT 'n',
        p_is_weighted CHAR DEFAULT 'n',
        p_representation VARCHAR2 DEFAULT 'adjacency_matrix',
        p_data CLOB,
        p_graph_id OUT INTEGER
    ) IS
        l_data_set_id INTEGER;
        l_error_msg VARCHAR2(4000);
    BEGIN
        
        l_error_msg := validate_graph_data(
            p_data, p_nodes, p_edges, p_is_digraph, p_is_weighted, p_representation
        );
        
        IF l_error_msg IS NOT NULL THEN
            RAISE_APPLICATION_ERROR(-20002, 'Graph validation failed: ' || l_error_msg);
        END IF;
        
        INSERT INTO data_set (user_id, type, label)
        VALUES (p_user_id, 'graph', p_label)
        RETURNING id INTO l_data_set_id;
        
        INSERT INTO graph (id, nodes, edges, is_digraph, is_weighted, representation, data)
        VALUES (l_data_set_id, p_nodes, p_edges, p_is_digraph, p_is_weighted, p_representation, p_data);
        
        p_graph_id := l_data_set_id;
        
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END insert_graph;

END pkg_graph_handler;
/


CREATE OR REPLACE TRIGGER trg_validate_graph_simple
BEFORE INSERT OR UPDATE ON graph
FOR EACH ROW
DECLARE
    l_validation_result CHAR(1);
BEGIN
    IF :NEW.nodes IS NULL OR :NEW.nodes <= 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Nodes count must be positive');
    END IF;
    
    IF :NEW.edges IS NULL OR :NEW.edges < 0 THEN
        RAISE_APPLICATION_ERROR(-20002, 'Edges count cannot be negative');
    END IF;
    
    IF :NEW.data IS NULL OR DBMS_LOB.GETLENGTH(:NEW.data) = 0 THEN
        RAISE_APPLICATION_ERROR(-20003, 'Graph data cannot be empty');
    END IF;
    
    IF :NEW.representation = 'adjacency_matrix' THEN
        l_validation_result := is_valid_adjacency_matrix(:NEW.data, :NEW.nodes, :NEW.is_digraph, :NEW.is_weighted);
    ELSIF :NEW.representation = 'edge_list' THEN
        l_validation_result := is_valid_edge_list(:NEW.data, :NEW.nodes, :NEW.is_digraph, :NEW.is_weighted);
    ELSIF :NEW.representation = 'adjacency_list' THEN
        l_validation_result := is_valid_adjacency_list(:NEW.data, :NEW.nodes, :NEW.is_digraph, :NEW.is_weighted);
    END IF;
    
    IF l_validation_result = 'n' THEN
        RAISE_APPLICATION_ERROR(-20004, 'Invalid ' || :NEW.representation || ' format');
    END IF;
END;
/

CREATE OR REPLACE FUNCTION is_bipartite_graph(
    p_data        CLOB,
    p_nodes       INTEGER,
    p_is_digraph  CHAR DEFAULT 'n',
    p_is_weighted CHAR DEFAULT 'n'
) RETURN CHAR IS
    c_yes         CONSTANT CHAR := 'y';
    c_no          CONSTANT CHAR := 'n';
    
    TYPE matrix_row  IS TABLE OF NUMBER;
    TYPE matrix_type IS TABLE OF matrix_row;
    v_matrix      matrix_type := matrix_type();
    v_source      VARCHAR2(32767);
    v_row_txt     VARCHAR2(32767);
    v_value       NUMBER;
    
    TYPE color_array IS TABLE OF INTEGER;
    v_colors      color_array := color_array();
    TYPE queue_array IS TABLE OF INTEGER;
    v_queue       queue_array := queue_array();
    v_queue_start INTEGER := 1;
    v_queue_end   INTEGER := 0;
    v_current_node INTEGER;
    
    COLOR_UNVISITED CONSTANT INTEGER := 0;
    COLOR_ONE       CONSTANT INTEGER := 1;
    COLOR_TWO       CONSTANT INTEGER := 2;

BEGIN

    IF p_data IS NULL OR p_nodes IS NULL OR p_nodes <= 0 THEN
        RETURN c_no;
    END IF;
    
    IF p_is_digraph NOT IN (c_yes, c_no) OR p_is_weighted NOT IN (c_yes, c_no) THEN
        RETURN c_no;
    END IF;

    BEGIN
        v_source := DBMS_LOB.SUBSTR(p_data, 32767, 1);
        v_source := REPLACE(v_source, '[[', '');
        v_source := REPLACE(v_source, ']]', '');
        v_source := REPLACE(v_source, '],[', '|');
        
        v_matrix.EXTEND(p_nodes);
        
        FOR i IN 1..p_nodes LOOP
            v_row_txt := REGEXP_SUBSTR(v_source, '[^|]+', 1, i);
            
            IF v_row_txt IS NULL THEN
                RETURN c_no;
            END IF;
            
            v_matrix(i) := matrix_row();
            v_matrix(i).EXTEND(p_nodes);
            
            FOR j IN 1..p_nodes LOOP
                v_value := TO_NUMBER(REGEXP_SUBSTR(v_row_txt, '[^,]+', 1, j));
                
                IF v_value > 0 THEN
                    v_matrix(i)(j) := 1;
                ELSE
                    v_matrix(i)(j) := 0;
                END IF;
            END LOOP;
        END LOOP;
        
    EXCEPTION
        WHEN OTHERS THEN
            RETURN c_no;
    END;

    IF p_is_digraph = c_yes THEN
        FOR i IN 1..p_nodes LOOP
            FOR j IN 1..p_nodes LOOP
                IF v_matrix(i)(j) = 1 OR v_matrix(j)(i) = 1 THEN
                    v_matrix(i)(j) := 1;
                    v_matrix(j)(i) := 1;
                END IF;
            END LOOP;
        END LOOP;
    END IF;

    v_colors.EXTEND(p_nodes);
    v_queue.EXTEND(p_nodes);
    
    FOR i IN 1..p_nodes LOOP
        v_colors(i) := COLOR_UNVISITED;
    END LOOP;
    
    FOR start_node IN 1..p_nodes LOOP
        
        IF v_colors(start_node) = COLOR_UNVISITED THEN
           
            v_colors(start_node) := COLOR_ONE;
            v_queue_start := 1;
            v_queue_end := 1;
            v_queue(1) := start_node;
            
         
            WHILE v_queue_start <= v_queue_end LOOP
                v_current_node := v_queue(v_queue_start);
                v_queue_start := v_queue_start + 1;
                
                
                FOR neighbor IN 1..p_nodes LOOP
                    IF v_matrix(v_current_node)(neighbor) = 1 THEN
                        
                        IF v_colors(neighbor) = COLOR_UNVISITED THEN
                         
                            IF v_colors(v_current_node) = COLOR_ONE THEN
                                v_colors(neighbor) := COLOR_TWO;
                            ELSE
                                v_colors(neighbor) := COLOR_ONE;
                            END IF;
                            
                          
                            v_queue_end := v_queue_end + 1;
                            v_queue(v_queue_end) := neighbor;
                            
                        ELSIF v_colors(neighbor) = v_colors(v_current_node) THEN
                            
                            RETURN c_no;
                        END IF;
                        
                    END IF;
                END LOOP;
                
            END LOOP;
        END IF;
    END LOOP;

    RETURN c_yes;

EXCEPTION
    WHEN OTHERS THEN
        RETURN c_no;
        
END is_bipartite_graph;
/

INSERT INTO users (username, password, email, created_at) VALUES ('mihnea', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.OG.VMFL6d8mZV1E6', 'mihnea@example.com', SYSTIMESTAMP)
/
INSERT INTO users (username, password, email, created_at) VALUES ('raluca', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.OG.VMFL6d8mZV1E6', 'raluca@example.com', SYSTIMESTAMP)
/
INSERT INTO users (username, password, email, created_at) VALUES ('dan', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.OG.VMFL6d8mZV1E6', 'matematix@example.com', SYSTIMESTAMP)
/

INSERT INTO data_set (user_id, type, label, created_at) VALUES (1, 'number_array', 'temperaturi', SYSTIMESTAMP)
/
INSERT INTO data_set (user_id, type, label, created_at) VALUES (1, 'character_array', 'parola encryptata cu parola "parola"', SYSTIMESTAMP)
/
INSERT INTO data_set (user_id, type, label, created_at) VALUES (1, 'matrix', 'display', SYSTIMESTAMP)
/
INSERT INTO data_set (user_id, type, label, created_at) VALUES (2, 'graph', 'prietenii de pe facebook', SYSTIMESTAMP)
/
INSERT INTO data_set (user_id, type, label, created_at) VALUES (2, 'graph', 'prietenii de pe facebook directed', SYSTIMESTAMP)
/
INSERT INTO data_set (user_id, type, label, created_at) VALUES (2, 'graph', 'prietenii de pe facebook weighted', SYSTIMESTAMP)
/
INSERT INTO data_set (user_id, type, label, created_at) VALUES (2, 'graph', 'prietenii de pe facebook adjacency list', SYSTIMESTAMP)
/
INSERT INTO data_set (user_id, type, label, created_at) VALUES (2, 'tree', 'arborele genealogic', SYSTIMESTAMP)
/

INSERT INTO number_array (id, length, number_type, min_value, max_value, sorted, data) VALUES (1, 5, 'float', 10.5, 99.9, 'none', '[10.5, 45.2, 99.9, 23.1, 67.8]')
/
INSERT INTO character_array (id, length, encoding, data) VALUES (2, 3, 'utf8', '[proiectul acesta este interesant]')
/
INSERT INTO matrix (id, lines, columns, min_value, max_value, data) VALUES (3, 2, 3, 0, 255, '[[255,0,128],[64,192,32]]')
/
INSERT INTO graph (id, nodes, edges, is_digraph, is_weighted, representation, data) VALUES (4, 3, 3, 'y', 'n', 'adjacency_list', '[[1,2],[0,2],[0,1]]')
/
INSERT INTO graph (id, nodes, edges, is_digraph, is_weighted, representation, data) VALUES (5, 3, 2, 'n', 'n', 'adjacency_matrix', '[[0,1,1],[1,0,0],[1,0,0]]')
/
INSERT INTO graph (id, nodes, edges, is_digraph, is_weighted, representation, data) VALUES (6, 4, 5, 'y', 'y', 'edge_list', '[[0,1,2.5],[0,2,1.0],[1,2,3.5],[2,3,4.0],[3,0,2.0]]')
/
INSERT INTO graph (id, nodes, edges, is_digraph, is_weighted, representation, data) VALUES (7, 4, 4, 'n', 'n', 'adjacency_list', '[[1,2],[0,3],[0,3],[1,2]]')
/
INSERT INTO tree (id, nodes, edges, root, is_weighted, representation, data) VALUES (8, 5, 4, 1, 'n', 'parent_list', '-5,0,0,1,0')
/

select * from user_data_distribution;

select * from users;

select * from data_set;

select * from number_array;

select * from character_array;

select * from matrix;

select * from graph;

select * from tree;