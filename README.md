<div align="center" id="top"> 
  <img src="./.github/app.gif" alt="IDBPaging" />

  &#xa0;

  <!-- <a href="https://idbpaging.netlify.app">Demo</a> -->
</div>

<h1 align="center">IDBPaging</h1>

<p align="center">
  <img alt="Github top language" src="https://img.shields.io/github/languages/top/xpectme/idbpaging?color=56BEB8">

  <img alt="Github language count" src="https://img.shields.io/github/languages/count/xpectme/idbpaging?color=56BEB8">

  <img alt="Repository size" src="https://img.shields.io/github/repo-size/xpectme/idbpaging?color=56BEB8">

  <img alt="License" src="https://img.shields.io/github/license/xpectme/idbpaging?color=56BEB8">
</p>

<hr>

<p align="center">
  <a href="#dart-about">About</a> &#xa0; | &#xa0; 
  <a href="#rocket-technologies">Technologies</a> &#xa0; | &#xa0;
  <a href="#white_check_mark-requirements">Requirements</a> &#xa0; | &#xa0;
  <a href="#checkered_flag-starting">Getting started</a> &#xa0; | &#xa0;
  <a href="#memo-license">License</a> &#xa0; | &#xa0;
  <a href="https://github.com/xpectme" target="_blank">Author</a>
</p>

<br>

## About ##

Pagination based on the indexeddb module idbx.

## Technologies ##

The following tools were used in this project:

- [idbx](https://github.com/xpectme/idbx) - an indexedDB wrapper

## Getting started ##

Deno:
```ts
import * as idbx from "https://deno.land/x/idbpaging/mod.ts";
```

NodeJS/Deno (same thing):
```ts
import * as idbx from "npm:idbpaging";
```

Browser:
```js
import * as idbx from "https://esm.sh/idbpaging";
```

## Usage ##

Pages start by 1.

```ts
const pageSize = 10;
const paging = new IDBPaging(db, storeName, pageSize);

// get first page
var list = await paging.first();

// get last page
var list = await paging.last();

// get next page
var list = await paging.next();

// get previous page
var list = await paging.prev();

// get page by index
var list = await paging.go(1);

// count pages
var totalPages = await paging.count();

// list of items for the current page
var list = await paging.list;

// current page number
var pageNumber = await paging.pageNumber;

// items per page
var pageSize = await paging.pageSize;

// total number of pages
var totalPages = await paging.totalPages;
```

You can enable circular paging on-the-fly:
```ts
await paging.first();
// go to the last page by circular paging
await paging.prev(1, true);

await paging.first();
// you can even go further back or forth by circular paging
// If you have 10 pages, this will go to page 7
await paging.prev(3, true);

await paging.last();
// go to the first page by circular paging
await paging.next(1, true);

await paging.last();
// you can even go further back or forth by circular paging
// If you have 10 pages, this will go to page 3
await paging.next(3, true);
```

## ToDo ##

- [ ] Proper documentation

## License ##

This project is under license from MIT. For more details, see the [LICENSE](LICENSE) file.


Made by <a href="https://github.com/mstoecklein" target="_blank">Mario Stöcklein</a>

&#xa0;

<a href="#top">Back to top</a>
