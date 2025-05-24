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
    format VARCHAR2(15) DEFAULT 'json' check(format in ('json','csv')),
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
    is_bipartite CHAR(1) DEFAULT 'n' check(is_bipartite in ('y','n')),
    representation VARCHAR2(25) DEFAULT 'adjacency_matrix' check(representation in ('edge_list','adjacency_matrix','adjacency_list')),
    data CLOB,
    CONSTRAINT fk_graph_id_data_set FOREIGN KEY (id) REFERENCES data_set(id)
)
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
INSERT INTO users (username, password, email, created_at) VALUES ('mihnea', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.OG.VMFL6d8mZV1E6', 'mihnea@example.com', SYSTIMESTAMP)
/
INSERT INTO users (username, password, email, created_at) VALUES ('raluca', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.OG.VMFL6d8mZV1E6', 'raluca@example.com', SYSTIMESTAMP)
/
INSERT INTO users (username, password, email, created_at) VALUES ('dan', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.OG.VMFL6d8mZV1E6', 'matematix@example.com', SYSTIMESTAMP)
/


INSERT INTO data_set (user_id, type, label, format, created_at) VALUES (1, 'number_array', 'temperaturi', 'json', SYSTIMESTAMP)
/
INSERT INTO data_set (user_id, type, label, format, created_at) VALUES (1, 'character_array', 'parola encryptata cu parola "parola"', 'csv', SYSTIMESTAMP);
/
INSERT INTO data_set (user_id, type, label, format, created_at) VALUES (1, 'matrix', 'display', 'json', SYSTIMESTAMP)
/
INSERT INTO data_set (user_id, type, label, format, created_at) VALUES (2, 'graph', 'prietenii de pe facebook', 'json', SYSTIMESTAMP)
/
INSERT INTO data_set (user_id, type, label, format, created_at) VALUES (2, 'tree', 'arborele genealogic', 'csv', SYSTIMESTAMP)
/


INSERT INTO number_array (id, length, number_type, min_value, max_value, sorted, data) VALUES (1, 5, 'float', 10.5, 99.9, 'none', '[10.5, 45.2, 99.9, 23.1, 67.8]')
/
INSERT INTO character_array (id, length, encoding, data) VALUES (2, 3, 'utf8', '[proiectul acesta este interesant]')
/
INSERT INTO matrix (id, lines, columns, min_value, max_value, data) VALUES (3, 2, 3, 0, 255, '[[255,0,128],[64,192,32]]')
/
INSERT INTO graph (id, nodes, edges, is_digraph, is_weighted, is_bipartite, representation, data) VALUES (4, 4, 5, 'n', 'y', 'n', 'adjacency_list', '{"nodes":["A","B","C","D"],"edges":[["A","B",5],["A","C",3],["B","D",2],["C","D",7],["B","C",1]]}')

/
INSERT INTO tree (id, nodes, edges, root, is_weighted, representation, data) VALUES (5, 5, 4, 1, 'n', 'adjacency_list', '-5,0,0,1,0');


select * from users;

select * from data_set;

select * from number_array;

select * from character_array;

select * from matrix;

select * from graph;

select * from tree;



