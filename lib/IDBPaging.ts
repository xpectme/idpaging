import * as idbx from "npm:idbx";

export interface IDBPagingCalculatePageNumberOptions {
  noCheck?: boolean;
  circularPaging?: boolean;
}

export class IDBPaging<T> {
  db: IDBDatabase;
  storeName: string;
  pageSize: number;
  #pageNumber: number | null = null;
  get pageNumber() {
    return this.#pageNumber === null ? 1 : this.#pageNumber;
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

  async setPageSize(pageSize: number, startPageNumber = 1) {
    if (pageSize < 1) {
      throw new Error("pageSize must be greater than 0");
    }
    this.pageSize = pageSize;
    await this.go(startPageNumber);
  }

  async calculateLastPageNumber() {
    const count = await this.count();
    this.totalPages = Math.ceil(count / this.pageSize);
    return this.totalPages;
  }

  async calculatePageNumber(
    pageNumber: number | string,
    options: IDBPagingCalculatePageNumberOptions = {},
  ): Promise<void> {
    const noCheck = options.noCheck === undefined ? false : options.noCheck;
    const circularPaging = options.circularPaging === undefined
      ? false
      : options.circularPaging;

    this.#pageNumber = parseInt(pageNumber.toString(), 10) ?? this.pageNumber;
    if (!noCheck || circularPaging) {
      const lastPageNumber = await this.calculateLastPageNumber();
      if (this.pageNumber < 1) {
        if (circularPaging) {
          const flipPages = Math.abs(this.pageNumber) % lastPageNumber;
          this.#pageNumber = flipPages >= 0 ? lastPageNumber - flipPages : 1;
        } else {
          this.#pageNumber = 1;
        }
      } else {
        if (this.pageNumber > lastPageNumber) {
          if (circularPaging) {
            const flipPages = this.pageNumber % lastPageNumber;
            this.#pageNumber = flipPages > 0 ? flipPages : lastPageNumber;
          } else {
            this.#pageNumber = lastPageNumber;
          }
        }
      }
    }
  }

  async go(pageNumber: number, options: IDBPagingCalculatePageNumberOptions = {
    noCheck: false,
    circularPaging: false,
  }): Promise<T[]> {
    await this.calculatePageNumber(pageNumber, options);
    const offset = (this.pageNumber - 1) * this.pageSize;
    let advancing = true;

    this.list = await new Promise((resolve) => {
      const list: T[] = [];
      const store = idbx.getStore(this.db, this.storeName);
      idbx.cursorHandler(store, (cursor) => {
        if (advancing && offset > 0) {
          advancing = false;
          cursor.advance(offset);
        } else {
          if (this.pageSize >= list.length) {
            list.push(cursor.value);
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

  next(pages = 1, circularPaging = false) {
    const pageNumber = this.pageNumber + Math.abs(pages);
    return this.go(pageNumber, { circularPaging });
  }

  prev(pages = 1, circularPaging = false) {
    const pageNumber = this.pageNumber - Math.abs(pages);
    return this.go(pageNumber, { circularPaging });
  }

  first() {
    return this.go(1);
  }

  async last() {
    const lastPageNumber = this.totalPages === 0
      ? await this.calculateLastPageNumber()
      : this.totalPages;

    // noCheck is true because we already know the last page number
    return this.go(lastPageNumber, { noCheck: true });
  }

  count() {
    const transaction = this.db.transaction([this.storeName], "readonly");
    const objectStore = transaction.objectStore(this.storeName);
    const req = objectStore.count();
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
