import "https://deno.land/x/indexeddb@1.3.5/polyfill_memory.ts";
import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.192.0/testing/asserts.ts";

import * as idbx from "https://esm.sh/idbx@v2.0.0";

import { IDBPaging } from "./mod.ts";

interface TestStore {
  id?: string;
  name: string;
}

function createDB() {
  return idbx.openDB("test", {
    version: 1,
    upgrade(db) {
      db.createObjectStore("test", { keyPath: "id", autoIncrement: true });
      const store = db.createObjectStore("test2", {
        keyPath: "id",
        autoIncrement: true,
      });
      store.createIndex("name", "name", { unique: false });
    },
  });
}

function clearDB(db: IDBDatabase) {
  // close database
  db.close();
  // delete database
  indexedDB.deleteDatabase("testdb");
}

function fillDB(db: IDBDatabase, count: number) {
  const store = idbx.getStore(db, "test", "readwrite");
  for (let i = 0; i < count; i++) {
    store.add({ name: `name${i}` });
  }

  const store2 = idbx.getStore(db, "test2", "readwrite");
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < 2; j++) {
      store2.add({ name: `name${j}` });
    }
  }
}

Deno.test("IDBPaging.constructor(db, storeName, options)", async () => {
  const db = await createDB();
  fillDB(db, 10);

  const paging = new IDBPaging<TestStore>(db, "test");
  assertEquals(paging.pageNumber, 1);
  assertEquals(paging.pageSize, 10);
  assertEquals(paging.totalPages, 0);
  assertEquals(paging.list.length, 0);

  clearDB(db);
});

Deno.test("IDBPaging.setPageSize(pageSize)", async () => {
  const db = await createDB();
  fillDB(db, 10);

  const paging = new IDBPaging<TestStore>(db, "test");
  assertEquals(paging.pageNumber, 1);
  assertEquals(paging.pageSize, 10);
  assertEquals(paging.totalPages, 0);
  assertEquals(paging.list.length, 0, "list is not filled yet");

  await paging.setPageSize(5);
  assertEquals(paging.pageNumber, 1);
  assertEquals(paging.pageSize, 5);
  assertEquals(paging.totalPages, 2, "more than 1 page");
  assertEquals(paging.list.length, 5, "pageSize is equal to list.length");
  assertEquals(paging.list[0].name, "name0");
  assertEquals(paging.list[4].name, "name4");

  await paging.setPageSize(15);
  assertEquals(paging.pageNumber, 1);
  assertEquals(paging.pageSize, 15);
  assertEquals(paging.totalPages, 1);
  assertEquals(paging.list.length, 10, "pageSize is greater than list.length");
  assertEquals(paging.list[0].name, "name0");
  assertEquals(paging.list[9].name, "name9");

  assertRejects(() => paging.setPageSize(0), "pageSize must be greater than 0");

  clearDB(db);
});

Deno.test("IDBPaging.calculatePageNumber(pageNumber)", async () => {
  const db = await createDB();
  fillDB(db, 10);

  const paging = new IDBPaging<TestStore>(db, "test", 5);

  await paging.calculatePageNumber(2);
  assertEquals(paging.pageNumber, 2);
  assertEquals(paging.pageSize, 5);
  assertEquals(paging.totalPages, 2);
  assertEquals(paging.list.length, 0, "list is not loaded, yet");

  await paging.calculatePageNumber(1);
  assertEquals(paging.pageNumber, 1);
  assertEquals(paging.pageSize, 5);
  assertEquals(paging.totalPages, 2);
  assertEquals(paging.list.length, 0, "list is not loaded, yet");

  // pageNumber defaults to 1, because
  // circularPaging is false on default
  await paging.calculatePageNumber(0);
  assertEquals(paging.pageNumber, 1);
  assertEquals(paging.pageSize, 5);
  assertEquals(paging.totalPages, 2);
  assertEquals(paging.list.length, 0, "list is not loaded, yet");

  // pageNumber defaults to the last page, because
  // circularPaging is false on default
  await paging.calculatePageNumber(3);
  assertEquals(paging.pageNumber, 2);
  assertEquals(paging.pageSize, 5);
  assertEquals(paging.totalPages, 2);
  assertEquals(paging.list.length, 0, "list is not loaded, yet");

  clearDB(db);
});

Deno.test("IDBPaging.calculatePageNumber(pageNumber, {circularPaging:true})", async () => {
  const db = await createDB();
  fillDB(db, 10);

  const paging = new IDBPaging<TestStore>(db, "test", 5);

  await paging.calculatePageNumber(2, { circularPaging: true });
  assertEquals(paging.pageNumber, 2);
  assertEquals(paging.pageSize, 5);
  assertEquals(paging.totalPages, 2);
  assertEquals(paging.list.length, 0, "list is not loaded, yet");

  await paging.calculatePageNumber(1, { circularPaging: true });
  assertEquals(paging.pageNumber, 1);
  assertEquals(paging.pageSize, 5);
  assertEquals(paging.totalPages, 2);
  assertEquals(paging.list.length, 0, "list is not loaded, yet");

  await paging.calculatePageNumber(0, { circularPaging: true });
  assertEquals(paging.pageNumber, 2);
  assertEquals(paging.pageSize, 5);
  assertEquals(paging.totalPages, 2);
  assertEquals(paging.list.length, 0, "list is not loaded, yet");

  await paging.calculatePageNumber(3, { circularPaging: true });
  assertEquals(paging.pageNumber, 1);
  assertEquals(paging.pageSize, 5);
  assertEquals(paging.totalPages, 2);
  assertEquals(paging.list.length, 0, "list is not loaded, yet");

  clearDB(db);
});

Deno.test("IDBPaging.calculatePageNumber(pageNumber, {noCheck:true})", async () => {
  const db = await createDB();
  fillDB(db, 10);

  const paging = new IDBPaging<TestStore>(db, "test", 5);

  await paging.calculatePageNumber(2, { noCheck: true });
  assertEquals(paging.pageNumber, 2);
  assertEquals(paging.pageSize, 5);
  assertEquals(paging.totalPages, 0);
  assertEquals(paging.list.length, 0, "list is not loaded, yet");

  await paging.calculatePageNumber(1, { noCheck: true });
  assertEquals(paging.pageNumber, 1);
  assertEquals(paging.pageSize, 5);
  assertEquals(paging.totalPages, 0);
  assertEquals(paging.list.length, 0, "list is not loaded, yet");

  await paging.calculatePageNumber(0, { noCheck: true });
  assertEquals(paging.pageNumber, 0);
  assertEquals(paging.pageSize, 5);
  assertEquals(paging.totalPages, 0);
  assertEquals(paging.list.length, 0, "list is not loaded, yet");

  await paging.calculatePageNumber(3, { noCheck: true });
  assertEquals(paging.pageNumber, 3);
  assertEquals(paging.pageSize, 5);
  assertEquals(paging.totalPages, 0);
  assertEquals(paging.list.length, 0, "list is not loaded, yet");

  clearDB(db);
});

Deno.test("IDBPaging.calculateLastPageNumber()", async () => {
  const db = await createDB();
  fillDB(db, 10);

  const paging = new IDBPaging<TestStore>(db, "test", 5);
  assertEquals(paging.totalPages, 0, "totalPages is not known at this point");

  assertEquals(await paging.calculateLastPageNumber(), 2);
  assertEquals(paging.totalPages, 2, "totalPages must be known at this point");

  clearDB(db);
});

Deno.test("IDBPaging.go(pageNumber)", async () => {
  const db = await createDB();
  fillDB(db, 10);

  const paging = new IDBPaging<TestStore>(db, "test");

  await paging.go(0);
  assertEquals(paging.pageNumber, 1);
  assertEquals(paging.pageSize, 10);
  assertEquals(paging.totalPages, 1);
  assertEquals(paging.list.length, 10);
  assertEquals(paging.list[0].name, "name0");
  assertEquals(paging.list[9].name, "name9");

  await paging.go(1);
  assertEquals(paging.pageNumber, 1);
  assertEquals(paging.pageSize, 10);
  assertEquals(paging.totalPages, 1);
  assertEquals(paging.list.length, 10);
  assertEquals(paging.list[0].name, "name0");
  assertEquals(paging.list[9].name, "name9");

  await paging.go(2);
  assertEquals(paging.pageNumber, 1);
  assertEquals(paging.pageSize, 10);
  assertEquals(paging.totalPages, 1);
  assertEquals(paging.list.length, 10);

  clearDB(db);
});

Deno.test("IDBPaging.next()", async () => {
  const db = await createDB();
  fillDB(db, 20);

  const paging = new IDBPaging<TestStore>(db, "test");

  await paging.setPageSize(10);
  assertEquals(paging.pageNumber, 1);
  assertEquals(paging.pageSize, 10);
  assertEquals(paging.totalPages, 2);
  assertEquals(paging.list.length, 10);
  assertEquals(paging.list[0].name, "name0");
  assertEquals(paging.list[9].name, "name9");

  await paging.next();
  assertEquals(paging.pageNumber, 2);
  assertEquals(paging.pageSize, 10);
  assertEquals(paging.totalPages, 2);
  assertEquals(paging.list.length, 10);
  assertEquals(paging.list[0].name, "name10");
  assertEquals(paging.list[9].name, "name19");

  // next(1) with circular paging
  await paging.next(1, true);
  assertEquals(paging.pageNumber, 1);
  assertEquals(paging.pageSize, 10);
  assertEquals(paging.totalPages, 2);
  assertEquals(paging.list.length, 10);
  assertEquals(paging.list[0].name, "name0");
  assertEquals(paging.list[9].name, "name9");

  clearDB(db);
});

Deno.test("IDBPaging.next(x)", async () => {
  const db = await createDB();
  fillDB(db, 50);

  const paging = new IDBPaging<TestStore>(db, "test");

  await paging.setPageSize(10);
  assertEquals(paging.pageNumber, 1);
  assertEquals(paging.pageSize, 10);
  assertEquals(paging.totalPages, 5);
  assertEquals(paging.list.length, 10);
  assertEquals(paging.list[0].name, "name0");
  assertEquals(paging.list[9].name, "name9");

  await paging.next(4);
  assertEquals(paging.pageNumber, 5);
  assertEquals(paging.pageSize, 10);
  assertEquals(paging.totalPages, 5);
  assertEquals(paging.list.length, 10);
  assertEquals(paging.list[0].name, "name40");
  assertEquals(paging.list[9].name, "name49");

  // next(3) with circular paging
  await paging.next(3, true);
  assertEquals(paging.pageNumber, 3);
  assertEquals(paging.pageSize, 10);
  assertEquals(paging.totalPages, 5);
  assertEquals(paging.list.length, 10);
  assertEquals(paging.list[0].name, "name20");
  assertEquals(paging.list[9].name, "name29");

  clearDB(db);
});

Deno.test("IDBPaging.prev()", async () => {
  const db = await createDB();
  fillDB(db, 20);

  const paging = new IDBPaging<TestStore>(db, "test");

  await paging.setPageSize(10, 2);
  assertEquals(paging.pageNumber, 2);
  assertEquals(paging.pageSize, 10);
  assertEquals(paging.totalPages, 2);
  assertEquals(paging.list.length, 10);
  assertEquals(paging.list[0].name, "name10");
  assertEquals(paging.list[9].name, "name19");

  await paging.prev();
  assertEquals(paging.pageNumber, 1);
  assertEquals(paging.pageSize, 10);
  assertEquals(paging.totalPages, 2);
  assertEquals(paging.list.length, 10);
  assertEquals(paging.list[0].name, "name0");
  assertEquals(paging.list[9].name, "name9");

  // prev(1) with circular paging
  await paging.prev(1, true);
  assertEquals(paging.pageNumber, 2);
  assertEquals(paging.pageSize, 10);
  assertEquals(paging.totalPages, 2);
  assertEquals(paging.list.length, 10);
  assertEquals(paging.list[0].name, "name10");
  assertEquals(paging.list[9].name, "name19");

  clearDB(db);
});

Deno.test("IDBPaging.prev(x)", async () => {
  const db = await createDB();
  fillDB(db, 50);

  const paging = new IDBPaging<TestStore>(db, "test");

  await paging.setPageSize(10, 5);
  assertEquals(paging.pageNumber, 5);
  assertEquals(paging.pageSize, 10);
  assertEquals(paging.totalPages, 5);
  assertEquals(paging.list.length, 10);
  assertEquals(paging.list[0].name, "name40");
  assertEquals(paging.list[9].name, "name49");

  await paging.prev(4);
  assertEquals(paging.pageNumber, 1);
  assertEquals(paging.pageSize, 10);
  assertEquals(paging.totalPages, 5);
  assertEquals(paging.list.length, 10);
  assertEquals(paging.list[0].name, "name0");
  assertEquals(paging.list[9].name, "name9");

  // prev(3) with circular paging to last page
  await paging.prev(3, true);
  assertEquals(paging.pageNumber, 3);
  assertEquals(paging.pageSize, 10);
  assertEquals(paging.totalPages, 5);
  assertEquals(paging.list.length, 10);
  assertEquals(paging.list[0].name, "name20");
  assertEquals(paging.list[9].name, "name29");

  clearDB(db);
});

Deno.test("IDBPaging.first()", async () => {
  const db = await createDB();
  fillDB(db, 50);

  const paging = new IDBPaging<TestStore>(db, "test");

  await paging.setPageSize(10, 5);
  assertEquals(paging.pageNumber, 5);
  assertEquals(paging.pageSize, 10);
  assertEquals(paging.totalPages, 5);
  assertEquals(paging.list.length, 10);
  assertEquals(paging.list[0].name, "name40");
  assertEquals(paging.list[9].name, "name49");

  await paging.first();
  assertEquals(paging.pageNumber, 1);
  assertEquals(paging.pageSize, 10);
  assertEquals(paging.totalPages, 5);
  assertEquals(paging.list.length, 10);
  assertEquals(paging.list[0].name, "name0");
  assertEquals(paging.list[9].name, "name9");

  clearDB(db);
});

Deno.test("IDBPaging.last()", async () => {
  const db = await createDB();
  fillDB(db, 50);

  const paging = new IDBPaging<TestStore>(db, "test");

  await paging.setPageSize(10);
  assertEquals(paging.pageNumber, 1);
  assertEquals(paging.pageSize, 10);
  assertEquals(paging.totalPages, 5);
  assertEquals(paging.list.length, 10);
  assertEquals(paging.list[0].name, "name0");
  assertEquals(paging.list[9].name, "name9");

  await paging.last();
  assertEquals(paging.pageNumber, 5);
  assertEquals(paging.pageSize, 10);
  assertEquals(paging.totalPages, 5);
  assertEquals(paging.list.length, 10);
  assertEquals(paging.list[0].name, "name40");
  assertEquals(paging.list[9].name, "name49");

  clearDB(db);
});

Deno.test("IDBPaging.count() with index", async () => {
  const db = await createDB();
  fillDB(db, 10);

  const paging = new IDBPaging<TestStore>(db, "test2");
  const count = await paging.count({ indexName: "name", indexKey: "name0" });
  assertEquals(count, 10);

  clearDB(db);
});

Deno.test("IDBPaging.go() with index", async () => {
  const db = await createDB();
  fillDB(db, 20);

  const paging = new IDBPaging<TestStore>(db, "test2");

  await paging.setPageSize(10, { indexName: "name", indexKey: "name0" });
  assertEquals(paging.pageNumber, 1);
  assertEquals(paging.pageSize, 10);
  assertEquals(paging.totalPages, 2);
  assertEquals(paging.list.length, 10);
  assertEquals(paging.list[0].name, "name0");
  assertEquals(paging.list[9].name, "name0");

  await paging.go(2, { indexName: "name", indexKey: "name0" });
  assertEquals(paging.pageNumber, 2);
  assertEquals(paging.pageSize, 10);
  assertEquals(paging.totalPages, 2);
  assertEquals(paging.list.length, 10);
  assertEquals(paging.list[0].name, "name0");
  assertEquals(paging.list[9].name, "name0");
});
