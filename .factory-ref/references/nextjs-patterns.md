# Next.js Patterns Reference

Reference for working with Next.js codebases (App Router). Before making changes, check `next.config.ts` and `package.json` to confirm the Next.js version and whether App Router or Pages Router is used.

## Project Structure

```
src/                         # or root — check tsconfig.json paths
  app/                       # App Router (Next.js 13+)
    layout.tsx               # root layout — providers go here
    page.tsx                 # home page "/"
    globals.css
    (auth)/                  # route group — no URL segment
      sign-in/page.tsx       # "/sign-in"
      sign-up/page.tsx       # "/sign-up"
    (protected)/             # route group with shared layout
      layout.tsx             # auth guard
      dashboard/page.tsx     # "/dashboard"
      [id]/page.tsx          # "/[id]" — dynamic segment
  components/
    ui/                      # primitives (shadcn or custom)
    [feature]/               # composed feature components
  lib/
    utils.ts
  hooks/                     # custom React hooks
  types/                     # TypeScript interfaces
public/                      # static assets
next.config.ts
```

## Adding a New Model/Entity

Next.js is not an ORM — models live in your data layer (Prisma, Drizzle, Convex, etc.). The pattern for defining a TypeScript type:

```typescript
// types/order.ts
export interface Order {
  id: string;
  customerId: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

// If using Prisma, add to prisma/schema.prisma instead:
// model Order {
//   id         String   @id @default(cuid())
//   status     OrderStatus @default(PENDING)
//   total      Float
//   createdAt  DateTime @default(now())
//   customer   Customer @relation(fields: [customerId], references: [id])
//   customerId String
// }
// enum OrderStatus { PENDING PROCESSING COMPLETED CANCELLED }
```

## Adding a New API Endpoint/Route

### Route Handler (App Router)

```typescript
// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";

// GET /api/orders
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  // fetch from DB here
  const orders = await db.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

// POST /api/orders
export async function POST(request: NextRequest) {
  const body = await request.json();

  // validate input
  if (!body.customerId || !body.total) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const order = await db.order.create({ data: body });
  return NextResponse.json(order, { status: 201 });
}
```

```typescript
// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // async in Next.js 15+
) {
  const { id } = await params;
  const order = await db.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const order = await db.order.update({ where: { id }, data: body });
  return NextResponse.json(order);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.order.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
```

### Server Action

```typescript
// app/orders/actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createOrder(formData: FormData) {
  const customerId = formData.get("customerId") as string;
  const total = parseFloat(formData.get("total") as string);

  await db.order.create({ data: { customerId, total, status: "pending" } });
  revalidatePath("/orders");
  redirect("/orders");
}
```

## Adding a New UI Component/Page

### Server Component Page (default)

```tsx
// app/orders/page.tsx
import { Suspense } from "react";
import { OrderList } from "@/components/orders/OrderList";
import { OrderListSkeleton } from "@/components/orders/OrderListSkeleton";

export default function OrdersPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Orders</h1>
      <Suspense fallback={<OrderListSkeleton />}>
        <OrderList />
      </Suspense>
    </div>
  );
}
```

```tsx
// components/orders/OrderList.tsx  — Server Component (no "use client")
import { db } from "@/lib/db";

export async function OrderList() {
  const orders = await db.order.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <ul className="space-y-2">
      {orders.map((order) => (
        <li key={order.id}>{order.id} — {order.status}</li>
      ))}
    </ul>
  );
}
```

### Client Component (interactive)

```tsx
// components/orders/OrderFilter.tsx
"use client";
import { useRouter, useSearchParams } from "next/navigation";

export function OrderFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", status);
    router.push(`/orders?${params.toString()}`);
  };

  return (
    <select onChange={(e) => handleChange(e.target.value)}>
      <option value="">All</option>
      <option value="pending">Pending</option>
      <option value="completed">Completed</option>
    </select>
  );
}
```

## Running Migrations

Next.js itself has no migrations. Run migrations via your ORM:

```bash
# Prisma
npx prisma migrate dev --name add_orders_table
npx prisma migrate deploy          # production
npx prisma generate                # regenerate client after schema change
npx prisma studio                  # GUI browser

# Drizzle
npx drizzle-kit generate
npx drizzle-kit migrate

# View current schema
npx prisma db pull
```

## Writing Tests

```bash
# Install
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event jsdom
npm install -D @playwright/test   # E2E
```

```typescript
// __tests__/orders-api.test.ts
import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/orders/route";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  db: { order: { findMany: vi.fn().mockResolvedValue([]) } },
}));

describe("GET /api/orders", () => {
  it("returns empty array when no orders", async () => {
    const req = new NextRequest("http://localhost/api/orders");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });
});
```

```typescript
// e2e/orders.spec.ts
import { test, expect } from "@playwright/test";

test("orders page loads", async ({ page }) => {
  await page.goto("/orders");
  await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible();
});
```

## Adding Middleware/Auth

```typescript
// middleware.ts (project root or src/)
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith("/sign-in");

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

For protected route groups (App Router):

```tsx
// app/(protected)/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  return <>{children}</>;
}
```

## Common Commands

```bash
# Development
npm run dev                        # start dev server (default: localhost:3000)
npm run build                      # production build
npm run start                      # start production server
npm run lint                       # ESLint

# Type checking
npx tsc --noEmit

# Analyze bundle
ANALYZE=true npm run build

# Clear Next.js cache
rm -rf .next

# Update Next.js
npm install next@latest react@latest react-dom@latest
```

## Key Gotchas for Brownfield Work

- Check `app/` vs `pages/` — different routing conventions
- In Next.js 15+, `params` and `searchParams` are async Promises — must `await` them
- Server Components cannot use `useState`, `useEffect`, event handlers — add `"use client"` if needed
- `cookies()` and `headers()` are async in Next.js 15+: `const cookieStore = await cookies()`
- Route Handlers in same directory as `page.tsx` conflict with GET — use separate directory
- `revalidatePath()` must be called in Server Actions or Route Handlers, not components
- `redirect()` throws — don't call it inside try/catch
