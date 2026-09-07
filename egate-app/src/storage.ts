import { Visitor } from "./types";

/** In-memory store for the first release scaffold. Replace with API later. */
let visitors: Visitor[] = [];

export function listVisitors(): Visitor[] {
  return [...visitors].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function addVisitor(
  input: Omit<Visitor, "id" | "createdAt" | "status">
): Visitor {
  const visitor: Visitor = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  visitors = [visitor, ...visitors];
  return visitor;
}

export function updateStatus(
  id: string,
  status: Visitor["status"]
): Visitor | undefined {
  visitors = visitors.map((v) => (v.id === id ? { ...v, status } : v));
  return visitors.find((v) => v.id === id);
}
