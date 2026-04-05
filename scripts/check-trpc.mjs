const endpoint = "http://127.0.0.1:3000/api/trpc/companies.list";

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({}),
});

console.log("status", response.status);
console.log(await response.text());
