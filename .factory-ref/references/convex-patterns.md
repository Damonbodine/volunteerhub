# Convex Patterns Reference

Reference for working with Convex backends in brownfield codebases. Read the existing `convex/schema.ts` to understand the current data model before making changes.

## Project Structure

```
convex/
  schema.ts          # ALL table definitions — edit this to add models
  [entity].ts        # queries + mutations per domain (e.g. users.ts, posts.ts)
  seed.ts            # seed data (optional)
  crons.ts           # scheduled jobs (optional)
  _generated/        # auto-generated — never edit directly
    api.ts
    server.d.ts
```

## Adding a New Model/Entity

Edit `convex/schema.ts` to add the table:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // existing tables...

  // New table — always add createdAt
  orders: defineTable({
    customerId: v.id("customers"),   // foreign key: v.id(), not v.string()
    status: v.union(                 // enum: v.union(v.literal()), not v.string()
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    total: v.number(),
    notes: v.optional(v.string()),
    createdAt: v.number(),           // REQUIRED on every table
  })
    .index("by_customerId", ["customerId"])  // index every FK
    .index("by_status", ["status"]),         // index every filtered field
});
```

Then create `convex/orders.ts` with queries and mutations (see patterns below).

**Rules:**
- `v.id("tableName")` for references, never `v.string()`
- `v.union(v.literal(...))` for enums, never `v.string()`
- `createdAt: v.number()` on every table, set to `Date.now()`
- Index every FK and every field used in `.withIndex()` queries

## Adding a New API Endpoint/Route

Create or edit a file in `convex/` (one file per domain):

```typescript
// convex/orders.ts
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// READ — use query()
export const list = query({
  args: { customerId: v.optional(v.id("customers")) },
  handler: async (ctx, args) => {
    if (args.customerId) {
      return ctx.db
        .query("orders")
        .withIndex("by_customerId", (q) => q.eq("customerId", args.customerId!))
        .order("desc")
        .collect();
    }
    return ctx.db.query("orders").order("desc").take(50);
  },
});

export const getById = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

// WRITE — use mutation()
export const create = mutation({
  args: {
    customerId: v.id("customers"),
    total: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return ctx.db.insert("orders", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Order not found");
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const remove = mutation({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Order not found");
    await ctx.db.delete(args.id);
  },
});
```

**Rules:**
- Always include `args` validator even if empty: `args: {}`
- Use `.withIndex()` for filtered queries, never `.filter()` alone on large tables
- Use `.take(N)` or `.collect()` — never leave a query dangling
- `ctx.db.patch(id, fields)` for partial updates, not `ctx.db.replace()`
- Validate existence before patch/delete

## Adding a New UI Component/Page

Frontend calls use `useQuery` / `useMutation` from `convex/react`:

```tsx
// app/orders/page.tsx or components/OrderList.tsx
"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function OrderList() {
  const orders = useQuery(api.orders.list, {});
  const updateStatus = useMutation(api.orders.updateStatus);

  if (orders === undefined) return <div>Loading...</div>;
  if (orders.length === 0) return <div>No orders</div>;

  return (
    <ul>
      {orders.map((order) => (
        <li key={order._id}>
          #{order._id.slice(-6)} — {order.status} — ${order.total}
        </li>
      ))}
    </ul>
  );
}
```

- `"use client"` required on any component using Convex hooks
- `useQuery` returns `undefined` while loading, `null` if not found
- `api.[module].[function]` — generated from file/export names automatically

## Running Migrations

Convex does not use traditional migrations. Schema changes are applied by editing `convex/schema.ts` and deploying:

```bash
# Push schema changes to dev deployment
npx convex dev

# Deploy to production
npx convex deploy

# For data migrations, use an internalMutation run once:
npx convex run migrations:backfillField
```

For data backfills, write a one-time `internalMutation`:

```typescript
// convex/migrations.ts
import { internalMutation } from "./_generated/server";

export const backfillField = internalMutation({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db.query("orders").collect();
    for (const record of records) {
      if (record.notes === undefined) {
        await ctx.db.patch(record._id, { notes: "" });
      }
    }
  },
});
```

## Writing Tests

Convex provides a test environment via `convex-test`:

```typescript
// convex/orders.test.ts
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

test("create and list orders", async () => {
  const t = convexTest(schema);

  const orderId = await t.mutation(api.orders.create, {
    customerId: "customers_id" as any,
    total: 99.99,
  });

  const orders = await t.query(api.orders.list, {});
  expect(orders).toHaveLength(1);
  expect(orders[0]._id).toBe(orderId);
  expect(orders[0].status).toBe("pending");
});
```

```bash
npx vitest run
```

## Adding Middleware/Auth

Auth is checked inside each function — there is no global middleware layer:

```typescript
// Check auth in any mutation/query
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error("Not authenticated");

// Get user from your users table
const user = await ctx.db
  .query("users")
  .withIndex("by_tokenIdentifier", (q) =>
    q.eq("tokenIdentifier", identity.tokenIdentifier)
  )
  .first();
if (!user) throw new Error("User not found");
if (user.role !== "admin") throw new Error("Forbidden");
```

For row-level ownership checks:

```typescript
const record = await ctx.db.get(args.id);
if (!record) throw new Error("Not found");
if (record.ownerId !== identity.subject) throw new Error("Forbidden");
```

## Common Commands

```bash
# Start dev server (watches schema + functions, hot reloads)
npx convex dev

# Deploy to production
npx convex deploy

# Open Convex dashboard
npx convex dashboard

# Run a one-off function
npx convex run orders:list '{}'
npx convex run seed:seedAll '{}'

# View logs
npx convex logs

# Check deployment status
npx convex status

# Generate TypeScript types (usually automatic)
npx convex codegen
```

## Key Gotchas for Brownfield Work

- Never edit anything in `convex/_generated/` — it's auto-generated
- After editing `schema.ts`, run `npx convex dev` to apply changes
- Indexes must be declared in schema; you cannot add them dynamically
- `_id` and `_creationTime` are auto-added by Convex — don't declare them
- Convex functions are not HTTP endpoints — they use a binary RPC protocol
- To expose HTTP: use `httpAction` in `convex/http.ts`
