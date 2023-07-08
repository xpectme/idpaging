import * as idbx from "npm:idbx";

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

const PAGE_NUMBER = Symbol("pageNumber");

export class IDBPaging<T> {
  db: IDBDatabase;
  storeName: string;
  pageSize: number;
  [PAGE_NUMBER]: number | null = null;
  get pageNumber() {
    return this[PAGE_NUMBER] === null ? 1 : this[PAGE_NUMBER];
  }
  totalPages: number;
  list: T[];

  constructor(
    db: IDBDatabase,
    storeName: string,
    pageSize = 10,
  ) {
    this.db = db;
    this.storeName = storeName;
    this.pageSize = pageSize ?? 10;
    this.totalPages = 0;
    this.list = [];
  }

  async setPageSize(
    pageSize: number,
    options: number | IDBPagingPageSizeOptions = 1,
  ) {
    if (pageSize < 1) {
      throw new Error("pageSize must be greater than 0");
    }

    const startPageNumber = typeof options === "number"
      ? options
      : options.startPage ?? 1;
    options = typeof options === "number" ? {} : options;

    this.pageSize = pageSize;
    await this.go(startPageNumber, options);
  }

  async calculateLastPageNumber(options?: IDBPagingIndexOptions) {
    const count = await this.count(options);
    this.totalPages = Math.ceil(count / this.pageSize);
    return this.totalPages;
  }

  async calculatePageNumber(
    pageNumber: number | string,
    options: IDBPagingCommandOptions = {},
  ): Promise<void> {
    const noCheck = options.noCheck === undefined ? false : options.noCheck;
    const circularPaging = options.circularPaging === undefined
      ? false
      : options.circularPaging;

    this[PAGE_NUMBER] = parseInt(pageNumber.toString(), 10) ?? this.pageNumber;
    if (!noCheck || circularPaging) {
      const lastPageNumber = await this.calculateLastPageNumber(options);
      if (this.pageNumber < 1) {
        if (circularPaging) {
          const flipPages = Math.abs(this.pageNumber) % lastPageNumber;
          this[PAGE_NUMBER] = flipPages >= 0 ? lastPageNumber - flipPages : 1;
        } else {
          this[PAGE_NUMBER] = 1;
        }
      } else {
        if (this.pageNumber > lastPageNumber) {
          if (circularPaging) {
            const flipPages = this.pageNumber % lastPageNumber;
            this[PAGE_NUMBER] = flipPages > 0 ? flipPages : lastPageNumber;
          } else {
            this[PAGE_NUMBER] = lastPageNumber;
          }
        }
      }
    }
  }

  async go(pageNumber: number, options: IDBPagingCommandOptions = {
    noCheck: false,
    circularPaging: false,
  }): Promise<T[]> {
    await this.calculatePageNumber(pageNumber, options);
    const offset = (this.pageNumber - 1) * this.pageSize;
    let advancing = true;

    this.list = await new Promise((resolve) => {
      const list: T[] = [];

      let store: IDBObjectStore | IDBIndex = idbx.getStore(
        this.db,
        this.storeName,
      );
      const index = options?.indexName !== undefined
        ? store.index(options.indexName)
        : null;

      store = index !== null ? index : store;
      idbx.cursorHandler(store as any, (cursor) => {
        if (advancing && offset > 0) {
          advancing = false;
          cursor.advance(offset);
        } else {
          if (this.pageSize >= list.length) {
            if (!options?.indexKey || cursor.key === options?.indexKey) {
              list.push(cursor.value);
            }
          }
          if (this.pageSize === list.length) {
            // early exit
            return true;
          } else {
            cursor.continue();
          }
        }
      }, () => resolve(list));
    });

    return this.list;
  }

  next(
    pages = 1,
    options: boolean | IDBPagingCommandOptions = false,
  ) {
    if (typeof options === "boolean") {
      options = { circularPaging: options };
    }
    const pageNumber = this.pageNumber + Math.abs(pages);
    return this.go(pageNumber, options);
  }

  prev(
    pages = 1,
    options: boolean | IDBPagingCommandOptions = false,
  ) {
    if (typeof options === "boolean") {
      options = { circularPaging: options };
    }
    const pageNumber = this.pageNumber - Math.abs(pages);
    return this.go(pageNumber, options);
  }

  first(options?: IDBPagingIndexOptions) {
    return this.go(1, options);
  }

  async last(
    options?: IDBPagingIndexOptions,
  ) {
    const lastPageNumber = this.totalPages === 0
      ? await this.calculateLastPageNumber(options)
      : this.totalPages;

    // noCheck is true because we already know the last page number
    return this.go(lastPageNumber, { ...options, noCheck: true });
  }

  count(options?: IDBPagingIndexOptions) {
    let store: IDBObjectStore | IDBIndex = idbx.getStore(
      this.db,
      this.storeName,
    );
    const index = options?.indexName !== undefined
      ? store.index(options.indexName)
      : null;
    store = index !== null ? index : store;
    const req = store.count(options?.indexKey);
    return new Promise<number>((resolve, reject) => {
      req.onsuccess = () => {
        resolve(req.result);
      };
      req.onerror = () => {
        reject("Error retrieving data from IndexedDB");
      };
    });
  }
}
