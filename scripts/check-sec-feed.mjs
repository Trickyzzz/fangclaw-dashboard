import { getRecentSecFilings } from "../server/data-sources/secEdgar.ts";

const rows = await getRecentSecFilings(3);
console.log(JSON.stringify(rows, null, 2));
