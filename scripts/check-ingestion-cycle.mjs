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

const run = await client.dataSources.runIngestionCycle.mutate();
await new Promise(resolve => setTimeout(resolve, 8000));
const status = await client.system.ingestion.status.query();

console.log("run:", JSON.stringify(run, null, 2));
console.log("status:", JSON.stringify(status, null, 2));
