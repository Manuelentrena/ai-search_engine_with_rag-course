-- NO intentar borrar codely, solo crear si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'codely') THEN
        CREATE ROLE codely WITH LOGIN PASSWORD 'c0d3ly7v';
    END IF;
END $$;

ALTER DATABASE postgres OWNER TO codely;

