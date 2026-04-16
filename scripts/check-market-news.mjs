import { getRecentMarketNewsFromWallstreetcn } from "../server/data-sources/wallstreetcn.ts";

const rows = await getRecentMarketNewsFromWallstreetcn(3, "a-stock-channel");
console.log(JSON.stringify(rows, null, 2));
