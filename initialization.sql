BEGIN TRANSACTION;
DROP TABLE IF EXISTS "directory_fnodes_contents";
CREATE TABLE IF NOT EXISTS "directory_fnodes_contents" (
	"parent_id"	BIGINT NOT NULL,
	"child_name"	TEXT NOT NULL,
	"child_id"	BIGINT NOT NULL,
	"btime"	BIGINT NOT NULL,
	FOREIGN KEY("parent_id") REFERENCES "fnodes_metadata"("id"),
	FOREIGN KEY("child_id") REFERENCES "fnodes_metadata"("id"),
	PRIMARY KEY("parent_id","child_name")
);
DROP TABLE IF EXISTS "regular_file_fnodes_contents";
CREATE TABLE IF NOT EXISTS "regular_file_fnodes_contents" (
	"id"	BIGINT NOT NULL UNIQUE,
	"content"	BLOB NOT NULL,
	FOREIGN KEY("id") REFERENCES "fnodes_metadata"("id"),
	PRIMARY KEY("id")
);
DROP TABLE IF EXISTS "fnodes_metadata";
CREATE TABLE IF NOT EXISTS "fnodes_metadata" (
	"id"	INTEGER NOT NULL UNIQUE,
	"type"	CHAR(1) NOT NULL,
	"mtime"	BIGINT NOT NULL,
	"rmtime"	INTEGER NOT NULL,
	"previous_version_id"	BIGINT,
	"first_version_id"	BIGINT NOT NULL,
	FOREIGN KEY("first_version_id") REFERENCES "fnodes_metadata"("id"),
	FOREIGN KEY("previous_version_id") REFERENCES "fnodes_metadata"("id"),
	PRIMARY KEY("id")
);
INSERT INTO "fnodes_metadata" ("id","type","mtime","rmtime","previous_version_id","first_version_id") VALUES (1,'d',0,0,NULL,1);
COMMIT;
