export interface IDBPagingCalculatePageNumberOptions {
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
    setPageSize(pageSize: number, startPageNumber?: number): Promise<void>;
    calculateLastPageNumber(): Promise<number>;
    calculatePageNumber(pageNumber: number | string, options?: IDBPagingCalculatePageNumberOptions): Promise<void>;
    go(pageNumber: number, options?: IDBPagingCalculatePageNumberOptions): Promise<T[]>;
    next(pages?: number, circularPaging?: boolean): Promise<T[]>;
    prev(pages?: number, circularPaging?: boolean): Promise<T[]>;
    first(): Promise<T[]>;
    last(): Promise<T[]>;
    count(): Promise<number>;
}
export {};
