import { createTRPCProxyClient, httpLink } from "@trpc/client";
import superjson from "superjson";

const client = createTRPCProxyClient({
  links: [
    httpLink({
      url: "http://127.0.0.1:3101/api/trpc",
      transformer: superjson,
      methodOverride: "POST",
    }),
  ],
});

const rows = await client.dataSources.marketNews.query({
  limit: 3,
  channel: "a-stock-channel",
});

console.log(JSON.stringify(rows, null, 2));
