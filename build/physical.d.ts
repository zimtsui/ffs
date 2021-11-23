import Sqlite = require('better-sqlite3');
import { RegularFileFnodeContent, DirectoryFnodeContent, DirectoryFnodeContentItem, DirectoryFnode, RegularFileFnode, DirectoryFnodeView, RegularFileFnodeView, FnodeMetadata, FnodeId } from './interfaces';
export declare abstract class PhysicalModel {
    protected db: Sqlite.Database;
    constructor(db: Sqlite.Database);
    private getFnodeMetadataLastInsertRowid;
    private makeFnodeMetadata;
    protected makeRegularFileFnode(rmtime: number, mtime: number, content: RegularFileFnodeContent, modifiedFromId?: FnodeId): FnodeId;
    protected makeDirectoryFnode(rmtime: number, mtime: number, content: DirectoryFnodeContent, modifiedFromId?: FnodeId): FnodeId;
    protected getFnodeMetadata(id: FnodeId): FnodeMetadata;
    protected getDirectoryFnodeContentItemByName(parentId: FnodeId, childName: string): DirectoryFnodeContentItem;
    /**
     * @param id requires the fnode exists and is a directory.
     */
    protected getDirectoryFnodeContentUnsafe(id: FnodeId): DirectoryFnodeContent;
    protected getRegularFileFnodeContent(id: FnodeId): RegularFileFnodeContent;
    protected getDirectoryFnode(id: FnodeId): DirectoryFnode;
    protected getRegularFileFnode(id: FnodeId): RegularFileFnode;
    protected getDirectoryFnodeViewUnsafe(id: FnodeId): DirectoryFnodeView;
    protected getRegularFileFnodeView(id: FnodeId): RegularFileFnodeView;
}
