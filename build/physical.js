"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhysicalModel = void 0;
const assert = require("assert");
const exceptions_1 = require("./exceptions");
class PhysicalModel {
    constructor(db) {
        this.db = db;
    }
    getFnodeMetadataLastInsertRowid() {
        const row = this.db.prepare(`
            SELECT last_insert_rowid()
            FROM fnodes_metadata
        ;`).safeIntegers().get();
        assert(row);
        assert(row.id <= Number.MAX_SAFE_INTEGER);
        return Number(row.id);
    }
    makeFnodeMetadata(type, rmtime, mtime, modifiedFromId) {
        this.db.prepare(`
            INSERT INTO fnodes_metadata
            (type, rmtime, mtime, previous_version_id)
            VALUES (?, ?, ?, ?, 0)
        ;`).run(type, rmtime, mtime, modifiedFromId !== undefined ? modifiedFromId : null);
        const id = this.getFnodeMetadataLastInsertRowid();
        this.db.prepare(`
            UPDATE fnodes_metadata SET
                first_version_id = ?
            WHERE id = ?
        ;`).run(modifiedFromId !== undefined
            ? this.getFnodeMetadata(modifiedFromId).firstVersionId
            : id, id);
        return id;
    }
    makeRegularFileFnode(rmtime, mtime, content, modifiedFromId) {
        const id = this.makeFnodeMetadata('-', rmtime, mtime, modifiedFromId);
        this.db.prepare(`
            INSERT INTO regular_file_fnodes_contents
            (id, content)
            VALUES (?, ?)
        ;`).run(id, content);
        return id;
    }
    makeDirectoryFnode(rmtime, mtime, content, modifiedFromId) {
        const id = this.makeFnodeMetadata('d', rmtime, mtime, modifiedFromId);
        for (const child of content) {
            this.db.prepare(`
                INSERT INTO directory_fnodes_contents
                (parent_id, child_id, child_name, btime)
                VALUES (?, ?, ?, ?)
            ;`).run(id, child.id, child.name, child.btime);
        }
        return id;
    }
    getFnodeMetadata(id) {
        const row = this.db.prepare(`
            SELECT
                id,
                type,
                mtime,
                rmtime,
                previous_version_id AS previousVersionId,
                first_version_id AS firstVersionId
            FROM fnodes_metadata
            WHERE id = ?
        ;`).get(id);
        assert(row, new exceptions_1.FileNotFound());
        return row;
    }
    getDirectoryFnodeContentItemByName(parentId, childName) {
        const row = this.db.prepare(`
            SELECT
                child_id AS childId,
                btime
            FROM directory_fnodes_contents
            WHERE parent_id = ? AND child_name = ?
        ;`).get(parentId, childName);
        assert(row, new exceptions_1.FileNotFound());
        return {
            id: row.childId,
            name: childName,
            btime: row.btime,
        };
    }
    /**
     * @param id requires the fnode exists and is a directory.
     */
    getDirectoryFnodeContentUnsafe(id) {
        const rows = this.db.prepare(`
            SELECT
                child_id AS childId,
                child_name AS childName,
                btime
            FROM directory_fnodes_contents
            WHERE parent_id = ?
        ;`).all(id);
        return rows.map(row => ({
            id: row.childId,
            name: row.childName,
            btime: row.btime,
        }));
    }
    getRegularFileFnodeContent(id) {
        const row = this.db.prepare(`
            SELECT content
            FROM regular_file_fnodes_contents
            WHERE id = ?
        ;`).get(id);
        assert(row, new exceptions_1.FileNotFound());
        return row.content;
    }
    getDirectoryFnode(id) {
        const fileMetadata = this.getFnodeMetadata(id);
        assert(fileMetadata.type === 'd', new exceptions_1.FileNotFound());
        return {
            ...fileMetadata,
            content: this.getDirectoryFnodeContentUnsafe(id),
        };
    }
    getRegularFileFnode(id) {
        const row = this.db.prepare(`
        SELECT
            type,
            mtime,
            rmtime,
            previous_version_id AS previousVersionId,
            first_version_id AS firstVersionId,
            content
        FROM fnodes_metadata, regular_file_fnodes_contents
        WHERE id = ?
    ;`).get(id);
        assert(row, new exceptions_1.FileNotFound());
        return {
            id,
            ...row,
        };
    }
    getDirectoryFnodeViewUnsafe(id) {
        const rows = this.db.prepare(`
            SELECT
                child_name AS name,
                type,
                rmtime,
                btime
            FROM directory_fnodes_contents, fnodes_metadata
            WHERE parent_id = ? AND child_id = id
        ;`).all(id);
        return rows;
    }
    getRegularFileFnodeView(id) {
        return this.getRegularFileFnodeContent(id);
    }
}
exports.PhysicalModel = PhysicalModel;
//# sourceMappingURL=physical.js.map