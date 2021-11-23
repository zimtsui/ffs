/// <reference types="node" />
export declare type FnodeType = '-' | 'd';
export declare type FnodeId = bigint;
export declare type PathIterator = Iterator<string>;
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
export declare type FnodeMetadata = RegularFileFnodeMetadata | DirectoryFnodeMetadata;
export declare type RegularFileFnodeContent = Buffer;
export interface DirectoryFnodeContentItem {
    id: FnodeId;
    name: string;
    btime: number;
}
export declare type DirectoryFnodeContent = DirectoryFnodeContentItem[];
export declare type FnodeContent = RegularFileFnodeContent | DirectoryFnodeContent;
export interface RegularFileFnode extends RegularFileFnodeMetadata {
    content: RegularFileFnodeContent;
}
export interface DirectoryFnode extends DirectoryFnodeMetadata {
    content: DirectoryFnodeContent;
}
export declare type Fnode = RegularFileFnode | DirectoryFnode;
export declare type RegularFileFnodeView = RegularFileFnodeContent;
interface DirectoryFnodeViewItem {
    name: string;
    type: FnodeType;
    btime: number;
    rmtime: number;
}
export declare type DirectoryFnodeView = DirectoryFnodeViewItem[];
export declare type FnodeView = RegularFileFnodeView | DirectoryFnodeView;
declare global {
    export interface BigInt {
        toJSON(): string;
    }
}
export {};
