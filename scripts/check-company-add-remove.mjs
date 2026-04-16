import { createTRPCProxyClient, httpLink } from "@trpc/client";
import superjson from "superjson";

const client = createTRPCProxyClient({
  links: [
    httpLink({
      url: "http://127.0.0.1:3100/api/trpc",
      transformer: superjson,
      methodOverride: "POST",
    }),
  ],
});

const symbol = "TST001";

const addRes = await client.companies.add.mutate({
  symbol,
  name: "测试公司",
  sector: "测试行业",
  chainPosition: "中游",
  weight: 5,
  tags: ["测试"],
});

const company = await client.companies.getBySymbol.query({ symbol });

const removeRes = await client.companies.remove.mutate({ symbol });

console.log(JSON.stringify({ addRes, company, removeRes }, null, 2));
