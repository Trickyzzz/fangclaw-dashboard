export function createInMemoryDedupeStore() {
  const seen = new Map<string, number>();

  return {
    has(key: string) {
      return seen.has(key);
    },
    add(key: string) {
      seen.set(key, Date.now());
    },
    snapshot() {
      return Array.from(seen.keys());
    },
  };
}
