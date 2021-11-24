// Fnode basic
export type FnodeType = '-' | 'd';
export type FnodeId = number;
export type PathIterator = Iterator<string>;


// Fnode metadata
interface FnodeGenericMetadata {
    id: FnodeId;
    mtime: number;
    rmtime: number;
    previousVersionId: FnodeId;
    firstVersionId: FnodeId;
}
export interface RegularFileFnodeMetadata extends FnodeGenericMetadata {
    type: '-';
}
export interface DirectoryFnodeMetadata extends FnodeGenericMetadata {
    type: 'd';
}
export type FnodeMetadata = RegularFileFnodeMetadata | DirectoryFnodeMetadata;


// Fnode content
export type RegularFileFnodeContent = Buffer;
export interface DirectoryFnodeContentItem {
    id: FnodeId,
    name: string;
    btime: number;
}
export type DirectoryFnodeContent = DirectoryFnodeContentItem[];
export type FnodeContent = RegularFileFnodeContent | DirectoryFnodeContent;


// Fnode
export interface RegularFileFnode extends RegularFileFnodeMetadata {
    content: RegularFileFnodeContent;
}
export interface DirectoryFnode extends DirectoryFnodeMetadata {
    content: DirectoryFnodeContent;
}
export type Fnode = RegularFileFnode | DirectoryFnode;


// Fnode view
export type RegularFileFnodeView = RegularFileFnodeContent;
interface DirectoryFnodeViewItem {
    name: string;
    type: FnodeType;
    btime: number;
    rmtime: number;
}
export type DirectoryFnodeView = DirectoryFnodeViewItem[];
export type FnodeView = RegularFileFnodeView | DirectoryFnodeView;
