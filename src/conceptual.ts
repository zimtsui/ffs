import assert = require('assert');
import {
    RegularFileFnodeContent, DirectoryFnodeContentItem,
    FnodeId, PathIterator,
    FnodeView,
} from './interfaces';
import _ = require('lodash');
import { PhysicalModel } from './physical';
import {
    FileAlreadyExists,
    FileNotFound,
    ExternalError,
} from './exceptions';


export class ConceptualModel extends PhysicalModel {
    private getFnodeIdByPath(
        rootId: FnodeId,
        pathIter: PathIterator,
    ): FnodeId {
        const iterResult = pathIter.next();
        if (iterResult.done) {
            return rootId;
        } else {
            const parentId = rootId;
            const childName = iterResult.value;
            const childId = this.getDirectoryFnodeContentItemByName(parentId, childName).id;
            return this.getFnodeIdByPath(childId, pathIter);
        }
    }

    public getFnodeView(
        rootId: FnodeId,
        pathIter: PathIterator,
    ): FnodeView {
        const fileId = this.getFnodeIdByPath(rootId, pathIter);
        try {
            const content = this.getRegularFileFnodeView(fileId);
            return content;
        } catch (err) {
            if (!(err instanceof ExternalError)) throw err;
            const content = this.getDirectoryFnodeViewUnsafe(fileId);
            return content;
        }
    }

    public makeFileByFnodeId(
        rootId: FnodeId, dirPathIter: PathIterator,
        newFileName: string, newFileId: FnodeId,
        birthTime: number,
    ): FnodeId {
        const iterResult = dirPathIter.next();
        if (iterResult.done) {
            const parentId = rootId;

            const parentContent = this.getDirectoryFnode(parentId).content;
            const childItem = parentContent.find(child => child.name === newFileName);
            assert(childItem === undefined, new FileAlreadyExists());

            const newChild: DirectoryFnodeContentItem = {
                id: newFileId, name: newFileName, btime: birthTime,
            };
            const newParentContent = _(parentContent).push(newChild).value();
            const newParentId = this.makeDirectoryFnode(
                birthTime, birthTime, newParentContent, parentId,
            );
            return newParentId;
        } else {
            const parentId = rootId;
            const childName = iterResult.value;

            const parentDirectory = this.getDirectoryFnode(parentId);
            const parentContent = parentDirectory.content;
            const childItem = parentContent.find(child => child.name === childName);
            assert(childItem !== undefined, new FileNotFound());

            const newChild: DirectoryFnodeContentItem = {
                id: this.makeFileByFnodeId(
                    childItem.id, dirPathIter,
                    newFileName, newFileId,
                    birthTime,
                ),
                name: childItem.name,
                btime: childItem.btime
            };
            const newParentContent = _(parentContent)
                .without(childItem)
                .push(newChild)
                .value();
            const newParentId = this.makeDirectoryFnode(
                birthTime,
                parentDirectory.mtime,
                newParentContent, parentId,
            );
            return newParentId;
        }
    }

    public makeEmptyDirectory(
        rootId: FnodeId, pathIter: PathIterator,
        fileName: string,
        birthTime: number,
    ): FnodeId {
        const fileId = this.makeDirectoryFnode(
            birthTime, birthTime, [],
        );
        return this.makeFileByFnodeId(
            rootId, pathIter,
            fileName, fileId,
            birthTime,
        );
    }

    public makeRegularFileByContent(
        rootId: FnodeId, dirPathIter: PathIterator,
        fileName: string, content: RegularFileFnodeContent,
        birthTime: number,
    ): FnodeId {
        const fileId = this.makeRegularFileFnode(
            birthTime, birthTime, content,
        );
        return this.makeFileByFnodeId(
            rootId, dirPathIter,
            fileName, fileId,
            birthTime,
        );
    }

    public removeFile(
        rootId: FnodeId, pathIter: PathIterator,
        deletionTime: number,
    ): FnodeId | null {
        const iterResult = pathIter.next();
        if (iterResult.done) {
            return null;
        } else {
            const parentId = rootId;
            const childName = iterResult.value;

            const parentDirectory = this.getDirectoryFnode(parentId);
            const parentContent = parentDirectory.content;
            const childItem = parentContent.find(child => child.name === childName);
            assert(childItem !== undefined, new FileNotFound());

            const newChildId = this.removeFile(childItem.id, pathIter, deletionTime);
            if (newChildId !== null) {
                const newChildItem: DirectoryFnodeContentItem = {
                    id: newChildId,
                    name: childItem.name,
                    btime: childItem.btime,
                };
                const newParentContent = _(parentContent)
                    .without(childItem)
                    .push(newChildItem)
                    .value();
                const newParentId = this.makeDirectoryFnode(
                    deletionTime, parentDirectory.mtime,
                    newParentContent, parentId,
                );
                return newParentId;
            } else {
                const newParentContent = _(parentContent)
                    .without(childItem)
                    .value();
                const newParentId = this.makeDirectoryFnode(
                    deletionTime, deletionTime,
                    newParentContent, parentId,
                );
                return newParentId;
            }
        }
    }

    public modifyRegularFileContent(
        rootId: FnodeId, pathIter: PathIterator,
        newFileContent: RegularFileFnodeContent,
        modificationTime: number,
    ): FnodeId {
        const iterResult = pathIter.next();
        if (iterResult.done) {
            const newFileId = this.makeRegularFileFnode(
                modificationTime, modificationTime,
                newFileContent, rootId,
            );
            return newFileId;
        } else {
            const parentId = rootId;
            const newChildName = iterResult.value;
            const parentMetadata = this.getFnodeMetadata(parentId);

            const parentContent = this.getDirectoryFnodeContentUnsafe(parentId);
            const child = parentContent.find(
                child => child.name === newChildName
            );
            assert(child !== undefined, new FileNotFound());

            const newChild: DirectoryFnodeContentItem = {
                id: this.modifyRegularFileContent(child.id, pathIter, newFileContent, modificationTime),
                name: child.name,
                btime: child.btime,
            }
            const newParentContent = _(parentContent)
                .without(child)
                .push(newChild)
                .value();
            const newParentId = this.makeDirectoryFnode(
                modificationTime, parentMetadata.mtime,
                newParentContent, parentId,
            );
            return newParentId;
        }
    }
}
