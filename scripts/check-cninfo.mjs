const response = await fetch("https://www.cninfo.com.cn/new/hisAnnouncement/query", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
    Referer: "https://www.cninfo.com.cn/new/commonUrl/pageOfSearch?url=disclosure/list/search",
    Accept: "application/json, text/plain, */*",
  },
  body: new URLSearchParams({
    pageNum: "1",
    pageSize: "5",
    column: "",
    tabName: "fulltext",
    plate: "",
    stock: "",
    searchkey: "半导体",
    secid: "",
    category: "",
    trade: "",
    seDate: "",
    sortName: "time",
    sortType: "desc",
    isHLtitle: "true",
  }),
});

console.log("status", response.status);
console.log(await response.text());
