"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileAlreadyExists = exports.FileNotFound = exports.ExternalError = void 0;
class ExternalError extends Error {
}
exports.ExternalError = ExternalError;
class FileNotFound extends ExternalError {
}
exports.FileNotFound = FileNotFound;
class FileAlreadyExists extends ExternalError {
}
exports.FileAlreadyExists = FileAlreadyExists;
//# sourceMappingURL=exceptions.js.map