import { RegularFileFnodeContent, FnodeView, FnodeId, PathIterator } from './interfaces';
import { Database } from 'better-sqlite3';
export declare class Applicable {
    private db;
    private kernel;
    constructor(db: Database);
    getFileView(rootId: FnodeId, pathIter: PathIterator): FnodeView;
    makeFileByFnodeId(rootId: FnodeId, dirPathIter: PathIterator, fileName: string, newFileId: FnodeId, birthTime: number): FnodeId;
    makeRegularFileByContent(rootId: FnodeId, dirPathIter: PathIterator, fileName: string, content: RegularFileFnodeContent, brithTime: number): FnodeId;
    removeFile(rootId: FnodeId, pathIter: PathIterator, deletionTime: number): FnodeId | null;
    modifyRegularFileContent(rootId: FnodeId, pathIter: PathIterator, newFileContent: RegularFileFnodeContent, modificationTime: number): FnodeId;
}
