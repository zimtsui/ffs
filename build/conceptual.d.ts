import { RegularFileFnodeContent, FnodeId, PathIterator, FnodeView } from './interfaces';
import { PhysicalModel } from './physical';
export declare class ConceptualModel extends PhysicalModel {
    private getFnodeIdByPath;
    getFnodeView(rootId: FnodeId, pathIter: PathIterator): FnodeView;
    makeFileByFnodeId(rootId: FnodeId, dirPathIter: PathIterator, newFileName: string, newFileId: FnodeId, birthTime: number): FnodeId;
    makeEmptyDirectory(rootId: FnodeId, pathIter: PathIterator, fileName: string, birthTime: number): FnodeId;
    makeRegularFileByContent(rootId: FnodeId, dirPathIter: PathIterator, fileName: string, content: RegularFileFnodeContent, birthTime: number): FnodeId;
    removeFile(rootId: FnodeId, pathIter: PathIterator, deletionTime: number): FnodeId | null;
    modifyRegularFileContent(rootId: FnodeId, pathIter: PathIterator, newFileContent: RegularFileFnodeContent, modificationTime: number): FnodeId;
}
