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

const res = await client.causal.analyze.mutate({
  message: "宇树科技上市进展更新，合作方理工光科签署新阶段项目协议。",
  sourceType: "manual",
});
console.log(JSON.stringify({ evidenceId: res.evidenceId, decision: res.decision, confidence: res.confidence }, null, 2));
