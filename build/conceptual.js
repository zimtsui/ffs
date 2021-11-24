"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConceptualModel = void 0;
const assert = require("assert");
const _ = require("lodash");
const physical_1 = require("./physical");
const exceptions_1 = require("./exceptions");
class ConceptualModel extends physical_1.PhysicalModel {
    getFnodeIdByPath(rootId, pathIter) {
        const iterResult = pathIter.next();
        if (iterResult.done) {
            return rootId;
        }
        else {
            const parentId = rootId;
            const childName = iterResult.value;
            const childId = this.getDirectoryFnodeContentItemByName(parentId, childName).id;
            return this.getFnodeIdByPath(childId, pathIter);
        }
    }
    getFnodeView(rootId, pathIter) {
        const fileId = this.getFnodeIdByPath(rootId, pathIter);
        try {
            const content = this.getRegularFileFnodeView(fileId);
            return content;
        }
        catch (err) {
            if (!(err instanceof exceptions_1.ExternalError))
                throw err;
            const content = this.getDirectoryFnodeViewUnsafe(fileId);
            return content;
        }
    }
    makeFileByFnodeId(rootId, dirPathIter, newFileName, newFileId, creationTime) {
        const iterResult = dirPathIter.next();
        if (iterResult.done) {
            const parentId = rootId;
            const parentContent = this.getDirectoryFnode(parentId).content;
            const childItem = parentContent.find(child => child.name === newFileName);
            assert(childItem === undefined, new exceptions_1.FileAlreadyExists());
            const newChild = {
                id: newFileId, name: newFileName, btime: creationTime,
            };
            const newParentContent = _(parentContent).push(newChild).value();
            const newParentId = this.makeDirectoryFnode(creationTime, creationTime, newParentContent, parentId);
            return newParentId;
        }
        else {
            const parentId = rootId;
            const childName = iterResult.value;
            const parentDirectory = this.getDirectoryFnode(parentId);
            const parentContent = parentDirectory.content;
            const childItem = parentContent.find(child => child.name === childName);
            assert(childItem !== undefined, new exceptions_1.FileNotFound());
            const newChild = {
                id: this.makeFileByFnodeId(childItem.id, dirPathIter, newFileName, newFileId, creationTime),
                name: childItem.name,
                btime: childItem.btime
            };
            const newParentContent = _(parentContent)
                .without(childItem)
                .push(newChild)
                .value();
            const newParentId = this.makeDirectoryFnode(creationTime, parentDirectory.mtime, newParentContent, parentId);
            return newParentId;
        }
    }
    makeEmptyDirectory(rootId, pathIter, fileName, creationTime) {
        const fileId = this.makeDirectoryFnode(creationTime, creationTime, []);
        return this.makeFileByFnodeId(rootId, pathIter, fileName, fileId, creationTime);
    }
    makeRegularFileByContent(rootId, dirPathIter, fileName, content, creationTime) {
        const fileId = this.makeRegularFileFnode(creationTime, creationTime, content);
        return this.makeFileByFnodeId(rootId, dirPathIter, fileName, fileId, creationTime);
    }
    removeFile(rootId, pathIter, deletionTime) {
        const iterResult = pathIter.next();
        if (iterResult.done) {
            return null;
        }
        else {
            const parentId = rootId;
            const childName = iterResult.value;
            const parentDirectory = this.getDirectoryFnode(parentId);
            const parentContent = parentDirectory.content;
            const childItem = parentContent.find(child => child.name === childName);
            assert(childItem !== undefined, new exceptions_1.FileNotFound());
            const newChildId = this.removeFile(childItem.id, pathIter, deletionTime);
            if (newChildId !== null) {
                const newChildItem = {
                    id: newChildId,
                    name: childItem.name,
                    btime: childItem.btime,
                };
                const newParentContent = _(parentContent)
                    .without(childItem)
                    .push(newChildItem)
                    .value();
                const newParentId = this.makeDirectoryFnode(deletionTime, parentDirectory.mtime, newParentContent, parentId);
                return newParentId;
            }
            else {
                const newParentContent = _(parentContent)
                    .without(childItem)
                    .value();
                const newParentId = this.makeDirectoryFnode(deletionTime, deletionTime, newParentContent, parentId);
                return newParentId;
            }
        }
    }
    modifyRegularFileContent(rootId, pathIter, newFileContent, updatingTime) {
        const iterResult = pathIter.next();
        if (iterResult.done) {
            const newFileId = this.makeRegularFileFnode(updatingTime, updatingTime, newFileContent, rootId);
            return newFileId;
        }
        else {
            const parentId = rootId;
            const newChildName = iterResult.value;
            const parentMetadata = this.getFnodeMetadata(parentId);
            const parentContent = this.getDirectoryFnodeContentUnsafe(parentId);
            const child = parentContent.find(child => child.name === newChildName);
            assert(child !== undefined, new exceptions_1.FileNotFound());
            const newChild = {
                id: this.modifyRegularFileContent(child.id, pathIter, newFileContent, updatingTime),
                name: child.name,
                btime: child.btime,
            };
            const newParentContent = _(parentContent)
                .without(child)
                .push(newChild)
                .value();
            const newParentId = this.makeDirectoryFnode(updatingTime, parentMetadata.mtime, newParentContent, parentId);
            return newParentId;
        }
    }
}
exports.ConceptualModel = ConceptualModel;
//# sourceMappingURL=conceptual.js.map