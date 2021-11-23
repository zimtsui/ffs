import Sqlite = require('better-sqlite3');
import assert = require('assert');
import {
    RegularFileFnodeContent, DirectoryFnodeContent, DirectoryFnodeContentItem,
    DirectoryFnode, RegularFileFnode,
    DirectoryFnodeView, RegularFileFnodeView,
    FnodeMetadata,
    FnodeType, FnodeId,
} from './interfaces';
import {
    FileNotFound,
} from './exceptions';


export abstract class PhysicalModel {
    constructor(protected db: Sqlite.Database) { }

    private getFnodeMetadataLastInsertRowid(): bigint {
        const row = <{
            id: bigint;
        } | undefined>this.db.prepare(`
            SELECT last_insert_rowid()
            FROM fnode_metadata
        ;`).get();
        assert(row);
        return row.id;
    }

    private makeFnodeMetadata(
        type: FnodeType,
        rmtime: number,
        mtime: number,
        modifiedFromId?: FnodeId,
    ): FnodeId {
        this.db.prepare(`
            INSERT INTO fnode_metadata
            (type, rmtime, mtime, previous_version_id)
            VALUES (?, ?, ?, ?, 0)
        ;`).run(
            type,
            rmtime,
            mtime,
            modifiedFromId !== undefined ? modifiedFromId : null,
        );
        const id = this.getFnodeMetadataLastInsertRowid();
        this.db.prepare(`
            UPDATE fnode_metadata SET
                first_version_id = ?
            WHERE id = ?
        ;`).run(
            modifiedFromId !== undefined
                ? this.getFnodeMetadata(modifiedFromId).firstVersionId
                : id,
            id,
        );
        return id;
    }

    protected makeRegularFileFnode(
        rmtime: number,
        mtime: number,
        content: RegularFileFnodeContent,
        modifiedFromId?: FnodeId,
    ): FnodeId {
        const id = this.makeFnodeMetadata(
            '-',
            rmtime,
            mtime,
            modifiedFromId,
        )
        this.db.prepare(`
            INSERT INTO regular_file_fnodes_contents
            (id, content)
            VALUES (?, ?)
        ;`).run(id, content);
        return id;
    }

    protected makeDirectoryFnode(
        rmtime: number,
        mtime: number,
        content: DirectoryFnodeContent,
        modifiedFromId?: FnodeId,
    ): FnodeId {
        const id = this.makeFnodeMetadata(
            'd',
            rmtime,
            mtime,
            modifiedFromId,
        );
        for (const child of content) {
            const stmt = this.db.prepare(`
                INSERT INTO directory_fnodes_contents
                (parent_id, child_id, child_name, btime)
                VALUES (?, ?, ?, ?)
            ;`);
            stmt.run(id, child.id, child.name, child.btime);
        }
        return id;
    }

    protected getFnodeMetadata(id: FnodeId): FnodeMetadata {
        const row = <{
            id: bigint;
            type: '-' | 'd',
            mtime: bigint,
            rmtime: bigint,
            previousVersionId: bigint,
            firstVersionId: bigint,
        } | undefined>this.db.prepare(`
            SELECT
                id,
                type,
                mtime,
                rmtime,
                previous_version_id AS previousVersionId,
                first_version_id AS firstVersionId
            FROM fnode_metadata
            WHERE id = ?
        ;`).safeIntegers(true).get(id);
        assert(row, new FileNotFound());
        return {
            ...row,
            mtime: Number(row.mtime),
            rmtime: Number(row.rmtime),
        };
    }

    protected getDirectoryFnodeContentItemByName(
        parentId: FnodeId,
        childName: string,
    ): DirectoryFnodeContentItem {
        const row = <{
            childId: bigint;
            btime: bigint;
        } | undefined>this.db.prepare(`
            SELECT
                child_id AS childId,
                btime
            FROM directory_fnodes_contents
            WHERE parent_id = ? AND child_name = ?
        ;`).safeIntegers(true).get(parentId, childName);
        assert(row, new FileNotFound());
        return {
            id: row.childId,
            name: childName,
            btime: Number(row.btime),
        };
    }

    /**
     * @param id requires the fnode exists and is a directory.
     */
    protected getDirectoryFnodeContentUnsafe(id: FnodeId): DirectoryFnodeContent {
        const rows = <{
            childId: bigint,
            childName: string,
            btime: bigint,
        }[]>this.db.prepare(`
            SELECT
                child_id AS childId,
                child_name AS childName,
                btime
            FROM directory_fnodes_contents
            WHERE parent_id = ?
        ;`).safeIntegers(true).all(id);
        return rows.map(row => ({
            id: row.childId,
            name: row.childName,
            btime: Number(row.btime),
        }));
    }

    protected getRegularFileFnodeContent(id: FnodeId): RegularFileFnodeContent {
        const stmt = this.db.prepare(`
            SELECT content
            FROM regular_file_fnodes_contents
            WHERE id = ?
        ;`);
        const row = <{ content: Buffer } | undefined>stmt.get(id);
        assert(row, new FileNotFound());
        return row.content;
    }

    protected getDirectoryFnode(id: FnodeId): DirectoryFnode {
        const fileMetadata = this.getFnodeMetadata(id);
        assert(fileMetadata.type === 'd', new FileNotFound());
        return {
            ...fileMetadata,
            content: this.getDirectoryFnodeContentUnsafe(id),
        };
    }

    protected getRegularFileFnode(id: FnodeId): RegularFileFnode {
        const stmt = this.db.prepare(`
            SELECT
                type,
                mtime,
                rmtime,
                previous_version_id AS previousVersionId,
                first_version_id AS firstVersionId,
                content
            FROM fnode_metadata, regular_file_fnodes_contents
            WHERE id = ?
        ;`).safeIntegers(true);
        const row = <{
            type: '-';
            mtime: bigint;
            rmtime: bigint;
            previousVersionId: bigint;
            firstVersionId: bigint;
            content: Buffer;
        } | undefined>stmt.get(id);
        assert(row, new FileNotFound());
        return {
            id,
            ...row,
            mtime: Number(row.mtime),
            rmtime: Number(row.rmtime),
        };
    }

    protected getDirectoryFnodeViewUnsafe(id: FnodeId): DirectoryFnodeView {
        const rows = <{
            name: string;
            type: FnodeType;
            rmtime: number;
            btime: number;
        }[]>this.db.prepare(`
            SELECT
                child_name AS name,
                type,
                rmtime,
                btime
            FROM directory_fnodes_contents, fnode_metadata
            WHERE parent_id = ? AND child_id = id
        ;`).all(id);
        return rows;
    }

    protected getRegularFileFnodeView(id: FnodeId): RegularFileFnodeView {
        return this.getRegularFileFnodeContent(id);
    }
}
