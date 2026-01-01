CREATE SCHEMA IF NOT EXISTS mooc;

CREATE TABLE IF NOT EXISTS mooc.courses (
    id CHAR(4) PRIMARY KEY NOT NULL,
    name VARCHAR(255) NOT NULL,
    embedding vector(768)
);
