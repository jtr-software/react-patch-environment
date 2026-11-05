export function formatCount(count: number): string {
  return `${count} ${count === 1 ? "interaction" : "interactions"}`;
}
