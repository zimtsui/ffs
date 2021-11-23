export class ExternalError extends Error { }

export class FileNotFound extends ExternalError { }
export class FileAlreadyExists extends ExternalError { }
