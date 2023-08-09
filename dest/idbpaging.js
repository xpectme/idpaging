import*as s from"npm:idbx";var n=Symbol("pageNumber"),h=class{db;storeName;indexName;query;direction;pageSize;[n]=null;get pageNumber(){return this[n]===null?1:this[n]}totalPages;list;constructor(t,e,a=10){this.db=t,this.storeName=e,typeof a=="number"?this.pageSize=a:(this.pageSize=a.pageSize??10,this[n]=a.startPage??1,this.indexName=a.index,this.query=a.query,this.direction=a.direction),this.totalPages=0,this.list=[]}async setPageSize(t,e=1){if(t<1)throw new Error("pageSize must be greater than 0");let a=typeof e=="number"?e:e.startPage??1;e=typeof e=="number"?{}:e,this.pageSize=t,await this.go(a,e)}async calculateLastPageNumber(t){let e=await this.count(t);return this.totalPages=Math.ceil(e/this.pageSize),this.totalPages}async calculatePageNumber(t,e={}){let a=e.noCheck===void 0?!1:e.noCheck,g=e.circularPaging===void 0?!1:e.circularPaging;if(this[n]=parseInt(t.toString(),10)??this.pageNumber,!a||g){let i=await this.calculateLastPageNumber(e);if(this.pageNumber<1)if(g){let r=Math.abs(this.pageNumber)%i;this[n]=r>=0?i-r:1}else this[n]=1;else if(this.pageNumber>i)if(g){let r=this.pageNumber%i;this[n]=r>0?r:i}else this[n]=i}}async go(t,e={noCheck:!1,circularPaging:!1}){await this.calculatePageNumber(t,e);let a=(this.pageNumber-1)*this.pageSize,g=!0,i=e.index??this.indexName,r=e.query??this.query,c=e.direction??this.direction;return this.list=await new Promise(l=>{let u=[],m=(i!==void 0?s.getIndex(this.db,this.storeName,i):s.getStore(this.db,this.storeName)).openCursor(r,c);s.cursorHandler(m,o=>{if(g&&a>0)g=!1,o.advance(a);else{if(this.pageSize>=u.length&&u.push(o.value),this.pageSize===u.length)return!0;o.continue()}},()=>l(u))}),this.list}next(t=1,e=!1){typeof e=="boolean"&&(e={circularPaging:e});let a=this.pageNumber+Math.abs(t);return this.go(a,e)}prev(t=1,e=!1){typeof e=="boolean"&&(e={circularPaging:e});let a=this.pageNumber-Math.abs(t);return this.go(a,e)}first(t){return this.go(1,t)}async last(t){let e=this.totalPages===0?await this.calculateLastPageNumber(t):this.totalPages;return this.go(e,{...t,noCheck:!0})}count(t){let e=t?.index??this.indexName,a=t?.query??this.query,i=(e!==void 0?s.getIndex(this.db,this.storeName,e):s.getStore(this.db,this.storeName)).count(a);return new Promise((r,c)=>{i.onsuccess=()=>{r(i.result)},i.onerror=()=>{c("Error retrieving data from IndexedDB")}})}};export{h as IDBPaging};
//# sourceMappingURL=idbpaging.js.map
