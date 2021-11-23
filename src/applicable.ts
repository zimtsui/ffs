import {
    RegularFileFnodeContent,
    FnodeView,
    FnodeId, PathIterator,
} from './interfaces';
import { ConceptualModel } from './conceptual';
import { Database } from 'better-sqlite3';


export class Applicable {
    private kernel: ConceptualModel;

    constructor(private db: Database) {
        this.kernel = new ConceptualModel(db);
    }

    public getFileView(
        rootId: FnodeId,
        pathIter: PathIterator,
    ): FnodeView {
        return this.db.transaction(() => {
            return this.kernel.getFnodeView(rootId, pathIter);
        })();
    }

    public makeFileByFnodeId(
        rootId: FnodeId, dirPathIter: PathIterator,
        fileName: string, newFileId: FnodeId,
        birthTime: number,
    ): FnodeId {
        return this.db.transaction(() => {
            return this.kernel.makeFileByFnodeId(
                rootId, dirPathIter,
                fileName, newFileId,
                birthTime,
            );
        })();
    }

    public makeRegularFileByContent(
        rootId: FnodeId, dirPathIter: PathIterator,
        fileName: string, content: RegularFileFnodeContent,
        brithTime: number,
    ): FnodeId {
        return this.db.transaction(() => {
            return this.kernel.makeRegularFileByContent(
                rootId, dirPathIter,
                fileName, content,
                brithTime,
            );
        })();
    }

    public removeFile(
        rootId: FnodeId, pathIter: PathIterator,
        deletionTime: number,
    ): FnodeId | null {
        return this.db.transaction(() => {
            return this.kernel.removeFile(
                rootId, pathIter,
                deletionTime,
            );
        })();
    }

    public modifyRegularFileContent(
        rootId: FnodeId, pathIter: PathIterator,
        newFileContent: RegularFileFnodeContent,
        modificationTime: number,
    ): FnodeId {
        return this.db.transaction(() => {
            return this.kernel.modifyRegularFileContent(
                rootId, pathIter,
                newFileContent,
                modificationTime,
            );
        })();
    }
}
