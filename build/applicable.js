"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Applicable = void 0;
const conceptual_1 = require("./conceptual");
class Applicable {
    constructor(db) {
        this.db = db;
        this.kernel = new conceptual_1.ConceptualModel(db);
    }
    getFileView(rootId, pathIter) {
        return this.db.transaction(() => {
            return this.kernel.getFnodeView(rootId, pathIter);
        })();
    }
    makeFileByFnodeId(rootId, dirPathIter, fileName, newFileId, birthTime) {
        return this.db.transaction(() => {
            return this.kernel.makeFileByFnodeId(rootId, dirPathIter, fileName, newFileId, birthTime);
        })();
    }
    makeRegularFileByContent(rootId, dirPathIter, fileName, content, brithTime) {
        return this.db.transaction(() => {
            return this.kernel.makeRegularFileByContent(rootId, dirPathIter, fileName, content, brithTime);
        })();
    }
    makeEmptyDirectory(rootId, pathIter, fileName, brithTime) {
        return this.db.transaction(() => {
            return this.kernel.makeEmptyDirectory(rootId, pathIter, fileName, brithTime);
        })();
    }
    removeFile(rootId, pathIter, deletionTime) {
        return this.db.transaction(() => {
            return this.kernel.removeFile(rootId, pathIter, deletionTime);
        })();
    }
    modifyRegularFileContent(rootId, pathIter, newFileContent, modificationTime) {
        return this.db.transaction(() => {
            return this.kernel.modifyRegularFileContent(rootId, pathIter, newFileContent, modificationTime);
        })();
    }
}
exports.Applicable = Applicable;
//# sourceMappingURL=applicable.js.map