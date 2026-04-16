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

const status = await client.system.ingestion.status.query();
console.log(JSON.stringify(status, null, 2));
