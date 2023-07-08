export interface IDBPagingIndexOptions {
    indexName?: string;
    indexKey?: IDBValidKey;
}
export interface IDBPagingPageSizeOptions extends IDBPagingIndexOptions {
    startPage?: number;
}
export interface IDBPagingCommandOptions extends IDBPagingIndexOptions {
    noCheck?: boolean;
    circularPaging?: boolean;
}
declare const PAGE_NUMBER: unique symbol;
export declare class IDBPaging<T> {
    db: IDBDatabase;
    storeName: string;
    pageSize: number;
    [PAGE_NUMBER]: number | null;
    get pageNumber(): number;
    totalPages: number;
    list: T[];
    constructor(db: IDBDatabase, storeName: string, pageSize?: number);
    setPageSize(pageSize: number, options?: number | IDBPagingPageSizeOptions): Promise<void>;
    calculateLastPageNumber(options?: IDBPagingIndexOptions): Promise<number>;
    calculatePageNumber(pageNumber: number | string, options?: IDBPagingCommandOptions): Promise<void>;
    go(pageNumber: number, options?: IDBPagingCommandOptions): Promise<T[]>;
    next(pages?: number, options?: boolean | IDBPagingCommandOptions): Promise<T[]>;
    prev(pages?: number, options?: boolean | IDBPagingCommandOptions): Promise<T[]>;
    first(options?: IDBPagingIndexOptions): Promise<T[]>;
    last(options?: IDBPagingIndexOptions): Promise<T[]>;
    count(options?: IDBPagingIndexOptions): Promise<number>;
}
export {};
