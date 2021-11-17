"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionalFileSystem = void 0;
const assert = require("assert");
const _ = require("lodash");
class FunctionalFileSystem {
    constructor(db) {
        this.db = db;
    }
    getFileMetadata(id) {
        const row = this.db.prepare(`
            SELECT
                id,
                type,
                mtime,
                rtime,
                previous_version_id AS previousVersionId,
                first_version_id AS firstVersionId,
            FROM files_metadata
            WHERE id = ?
        ;`).safeIntegers(true).get(id);
        assert(row);
        return {
            ...row,
            mtime: Number(row.mtime),
            rtime: Number(row.rtime),
        };
    }
    getDirectoryContentItemByName(parentId, childName) {
        const row = this.db.prepare(`
            SELECT
                child_id AS childId,
                ctime
            FROM directories_contents
            WHERE parent_id = ? AND child_name = ?
        ;`).safeIntegers(true).get(parentId, childName);
        assert(row);
        return {
            id: row.childId,
            name: childName,
            ctime: Number(row.ctime),
        };
    }
    makeUniqueFileId() {
        const stmt = this.db.prepare(`
            SELECT COUNT(*) AS fileCount
            FROM files_metadata
        ;`).safeIntegers(true);
        const row = stmt.get();
        return row.fileCount + 1n;
    }
    getFirstVersionId(id) {
        const stmt = this.db.prepare(`
            SELECT first_version_id AS firstVersionId
            FROM files_metadata
            WHERE id = ?
        ;`).safeIntegers(true);
        const row = stmt.get(id);
        assert(row);
        return row.firstVersionId;
    }
    makeRegularFile(rtime, mtime, content, modifiedFromId) {
        const id = this.makeUniqueFileId();
        const firstVersionId = this.getFirstVersionId(id);
        {
            const stmt = this.db.prepare(`
                INSERT INTO files_metadata
                (id, type, rtime, mtime, previous_version_id, first_version_id)
                VALUES (?, ?, ?, ?, ?, ?)
            ;`);
            stmt.run(id, '-', rtime, mtime, modifiedFromId !== undefined ? modifiedFromId : null, firstVersionId);
        }
        {
            const stmt = this.db.prepare(`
                INSERT INTO regular_files_contents
                (id, content)
                VALUES (?, ?)
            ;`);
            stmt.run(id, content);
        }
        return id;
    }
    makeDirectory(rtime, mtime, content, modifiedFromId) {
        const id = this.makeUniqueFileId();
        const firstVersionId = this.getFirstVersionId(id);
        {
            const stmt = this.db.prepare(`
                INSERT INTO files_metadata
                (id, type, rtime, mtime, previous_version_id, first_version_id)
                VALUES (?, ?, ?, ?, ?, ?)
            ;`);
            stmt.run(id, 'd', rtime, mtime, modifiedFromId !== undefined ? modifiedFromId : null, firstVersionId);
        }
        {
            for (const child of content) {
                const stmt = this.db.prepare(`
                    INSERT INTO directories_contents
                    (parent_id, child_id, child_name, ctime)
                    VALUES (?, ?, ?, ?)
                ;`);
                stmt.run(id, child.id, child.name, child.ctime);
            }
        }
        return id;
    }
    getDirectoryContentUnsafe(id) {
        const stmt = this.db.prepare(`
            SELECT
                child_id AS childId,
                child_name AS childName,
                ctime
            FROM directories_contents
            WHERE parent_id = ?
        ;`).safeIntegers(true);
        const rows = stmt.all(id);
        return rows.map(row => ({
            id: row.childId,
            name: row.childName,
            ctime: Number(row.ctime),
        }));
    }
    getDirectory(id) {
        const fileMetadata = this.getFileMetadata(id);
        assert(fileMetadata.type === 'd');
        return {
            ...fileMetadata,
            content: this.getDirectoryContentUnsafe(id),
        };
    }
    getRegularFileContent(id) {
        const stmt = this.db.prepare(`
            SELECT content
            FROM regular_files_contents
            WHERE id = ?
        ;`);
        const row = stmt.get(id);
        assert(row);
        return row.content;
    }
    getRegularFile(id) {
        const stmt = this.db.prepare(`
            SELECT
                type,
                mtime,
                rtime,
                previous_version_id AS previousVersionId,
                first_version_id AS firstVersionId,
                content
            FROM files_metadata, regular_files_contents
            WHERE id = ?
        ;`).safeIntegers(true);
        const row = stmt.get(id);
        assert(row);
        return {
            id,
            ...row,
            mtime: Number(row.mtime),
            rtime: Number(row.rtime),
        };
    }
    getDirectoryViewUnsafe(id) {
        const rows = this.db.prepare(`
            SELECT
                child_name AS name,
                type,
                mtime,
                ctime
            FROM subdirectories, files_metadata
            WHERE parent_id = ? AND child_id = id
        ;`).all(id);
        return rows;
    }
    getRegularFileView(id) {
        return this.getRegularFileContent(id);
    }
    retrieveFile(rootId, pathIter) {
        const iterResult = pathIter.next();
        if (iterResult.done) {
            return rootId;
        }
        else {
            const parentId = rootId;
            const childName = iterResult.value;
            const childId = this.getDirectoryContentItemByName(parentId, childName).id;
            return this.retrieveFile(childId, pathIter);
        }
    }
    createFile(rootId, dirPathIter, newFileId, newFileName, ctime) {
        const iterResult = dirPathIter.next();
        if (iterResult.done) {
            const parentId = rootId;
            const parentMetadata = this.getFileMetadata(parentId);
            assert(parentMetadata.type === 'd');
            const parentContent = this.getDirectoryContentUnsafe(parentId);
            const child = parentContent.find(child => child.name === newFileName);
            assert(child === undefined);
            const newChild = {
                id: newFileId, name: newFileName, ctime,
            };
            const newParentContent = _(parentContent)
                .push(newChild)
                .value();
            const newParentId = this.makeDirectory(ctime, ctime, newParentContent, parentId);
            return newParentId;
        }
        else {
            const parentId = rootId;
            const childName = iterResult.value;
            const parentMetadata = this.getFileMetadata(parentId);
            const parentContent = this.getDirectoryContentUnsafe(parentId);
            const child = parentContent.find(child => child.name === childName);
            assert(child !== undefined);
            const newChild = {
                id: this.createFile(child.id, dirPathIter, newFileId, newFileName, ctime),
                name: child.name,
                ctime: child.ctime
            };
            const newParentContent = _(parentContent)
                .without(child)
                .push(newChild)
                .value();
            const newParentId = this.makeDirectory(ctime, parentMetadata.mtime, newParentContent, parentId);
            return newParentId;
        }
    }
    deleteFile(rootId, pathIter, dtime) {
        const iterResult = pathIter.next();
        if (iterResult.done) {
            return null;
        }
        else {
            const parentId = rootId;
            const childName = iterResult.value;
            const parentMetadata = this.getFileMetadata(parentId);
            const parentContent = this.getDirectoryContentUnsafe(parentId);
            const child = parentContent.find(child => child.name === childName);
            assert(child !== undefined);
            const newChildId = this.deleteFile(child.id, pathIter, dtime);
            if (newChildId !== null) {
                const newChild = {
                    id: newChildId,
                    name: child.name,
                    ctime: child.ctime,
                };
                const newParentContent = _(parentContent)
                    .without(child)
                    .push(newChild)
                    .value();
                const newParentId = this.makeDirectory(dtime, parentMetadata.mtime, newParentContent, parentId);
                return newParentId;
            }
            else {
                const newParentContent = _(parentContent)
                    .without(child)
                    .value();
                const newParentId = this.makeDirectory(dtime, dtime, newParentContent, parentId);
                return newParentId;
            }
        }
    }
    updateFile(rootId, pathIter, newFileId, mtime) {
        const iterResult = pathIter.next();
        if (iterResult.done) {
            return newFileId;
        }
        else {
            const parentId = rootId;
            const newChildName = iterResult.value;
            const parentMetadata = this.getFileMetadata(parentId);
            const parentContent = this.getDirectoryContentUnsafe(parentId);
            const child = parentContent.find(child => child.name === newChildName);
            assert(child !== undefined);
            const newChild = {
                id: this.updateFile(child.id, pathIter, newFileId, mtime),
                name: child.name,
                ctime: child.ctime,
            };
            const newParentContent = _(parentContent)
                .without(child)
                .push(newChild)
                .value();
            const newParentId = this.makeDirectory(mtime, parentMetadata.mtime, newParentContent, parentId);
            return newParentId;
        }
    }
}
exports.FunctionalFileSystem = FunctionalFileSystem;
//# sourceMappingURL=ffs.js.map