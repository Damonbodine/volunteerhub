# Express.js Patterns Reference

Reference for working with Express.js codebases. Before making changes, read `package.json` for installed packages, check whether TypeScript is used, and look at the existing router structure to understand conventions.

## Project Structure

```
src/                         # TypeScript source (or root for JS)
  index.ts                   # app entry point — creates Express app
  app.ts                     # Express app setup (separate from server start)
  routes/                    # route definitions
    index.ts                 # root router, mounts sub-routers
    orders.ts                # /orders routes
    users.ts                 # /users routes
  controllers/               # request handlers
    orders.controller.ts
  services/                  # business logic
    orders.service.ts
  middleware/                 # custom middleware
    auth.ts
    errorHandler.ts
    validate.ts
  models/                    # data models (Mongoose schemas, Prisma types, etc.)
    order.model.ts
  types/                     # TypeScript interfaces
    express.d.ts             # extend Express Request type
  db/                        # database connection
    index.ts
dist/                        # compiled output (TypeScript projects)
package.json
tsconfig.json
```

## Adding a New Model/Entity

### With Prisma

```typescript
// prisma/schema.prisma — add model here
model Order {
  id         String      @id @default(cuid())
  customerId String
  status     OrderStatus @default(PENDING)
  total      Float
  notes      String?     @default("")
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
  customer   User        @relation(fields: [customerId], references: [id])

  @@index([customerId])
  @@index([status])
}

enum OrderStatus {
  PENDING
  PROCESSING
  COMPLETED
  CANCELLED
}
```

```bash
npx prisma migrate dev --name add_orders
npx prisma generate
```

### With Mongoose

```typescript
// src/models/order.model.ts
import { Schema, model, Types } from "mongoose";

export interface IOrder {
  customerId: Types.ObjectId;
  status: "pending" | "processing" | "completed" | "cancelled";
  total: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    total: { type: Number, required: true, min: 0 },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Order = model<IOrder>("Order", orderSchema);
```

## Adding a New API Endpoint/Route

### Router

```typescript
// src/routes/orders.ts
import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  listOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
} from "../controllers/orders.controller";

const router = Router();

router.use(authenticate);               // auth on all order routes

router.get("/", listOrders);
router.get("/:id", getOrder);
router.post("/", createOrder);
router.patch("/:id", updateOrder);
router.delete("/:id", deleteOrder);

export default router;
```

```typescript
// src/routes/index.ts
import { Router } from "express";
import ordersRouter from "./orders";
import usersRouter from "./users";

const router = Router();

router.use("/orders", ordersRouter);
router.use("/users", usersRouter);

export default router;
```

```typescript
// src/app.ts — mount root router
import express from "express";
import router from "./routes";

const app = express();
app.use(express.json());
app.use("/api/v1", router);

export default app;
```

### Controller

```typescript
// src/controllers/orders.controller.ts
import { Request, Response, NextFunction } from "express";
import { OrderService } from "../services/orders.service";

const service = new OrderService();

export async function listOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const orders = await service.findAll(req.user!.id, req.query);
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

export async function getOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await service.findById(req.params.id, req.user!.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await service.create({ ...req.body, customerId: req.user!.id });
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

export async function updateOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await service.update(req.params.id, req.user!.id, req.body);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function deleteOrder(req: Request, res: Response, next: NextFunction) {
  try {
    await service.remove(req.params.id, req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
```

### Service Layer

```typescript
// src/services/orders.service.ts
import { prisma } from "../db";

export class OrderService {
  async findAll(userId: string, query: Record<string, unknown>) {
    return prisma.order.findMany({
      where: {
        customerId: userId,
        ...(query.status ? { status: query.status as string } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string, userId: string) {
    return prisma.order.findFirst({ where: { id, customerId: userId } });
  }

  async create(data: { customerId: string; total: number; notes?: string }) {
    return prisma.order.create({ data });
  }

  async update(id: string, userId: string, data: Partial<{ status: string; notes: string }>) {
    const exists = await this.findById(id, userId);
    if (!exists) return null;
    return prisma.order.update({ where: { id }, data });
  }

  async remove(id: string, userId: string) {
    const exists = await this.findById(id, userId);
    if (!exists) throw new Error("Not found");
    return prisma.order.delete({ where: { id } });
  }
}
```

## Adding a New UI Component/Page

Express primarily serves JSON APIs. For server-rendered HTML:

```typescript
// src/app.ts — add template engine
import express from "express";
import path from "path";

const app = express();
app.set("view engine", "ejs");                        // or "pug", "handlebars"
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
```

```typescript
// Route that renders a template
router.get("/", async (req, res) => {
  const orders = await service.findAll(req.user!.id, {});
  res.render("orders/index", { orders, user: req.user });
});
```

## Running Migrations

```bash
# Prisma
npx prisma migrate dev --name add_orders_table
npx prisma migrate deploy          # production
npx prisma migrate reset           # wipe and re-run all (dev only)
npx prisma studio                  # GUI

# Drizzle
npx drizzle-kit generate
npx drizzle-kit migrate

# node-pg-migrate / db-migrate
npx db-migrate up
npx db-migrate down
```

## Writing Tests

```bash
npm install -D jest @types/jest ts-jest supertest @types/supertest
# or
npm install -D vitest supertest @types/supertest
```

```typescript
// src/__tests__/orders.test.ts
import request from "supertest";
import app from "../app";
import { prisma } from "../db";

// Mock auth middleware
jest.mock("../middleware/auth", () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: "user_123" };
    next();
  },
}));

describe("Orders API", () => {
  afterEach(async () => {
    await prisma.order.deleteMany();
  });

  it("GET /api/v1/orders — returns empty array", async () => {
    const res = await request(app).get("/api/v1/orders");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("POST /api/v1/orders — creates an order", async () => {
    const res = await request(app)
      .post("/api/v1/orders")
      .send({ total: 99.99 });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("PENDING");
  });
});
```

```bash
npm test
npm run test:watch
npm run test -- --coverage
```

## Adding Middleware/Auth

### JWT Authentication Middleware

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload { id: string; email: string; }

// Extend Express Request type
declare global {
  namespace Express {
    interface Request { user?: JwtPayload; }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
```

### Global Error Handler (must be last middleware)

```typescript
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(err.stack);
  const status = (err as any).status ?? 500;
  res.status(status).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
}
```

```typescript
// src/app.ts — register after all routes
app.use(errorHandler);
```

### Input Validation Middleware

```typescript
// src/middleware/validate.ts
import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.flatten() });
    }
    req.body = result.data;
    next();
  };
}

// Usage:
const createOrderSchema = z.object({
  total: z.number().positive(),
  notes: z.string().optional(),
});
router.post("/", validate(createOrderSchema), createOrder);
```

## Common Commands

```bash
# Development
npm run dev                        # nodemon/ts-node-dev hot reload
npx ts-node src/index.ts           # run directly with ts-node
node dist/index.js                 # run compiled output

# Build (TypeScript)
npm run build                      # tsc
npx tsc --watch                    # watch mode

# Linting
npm run lint
npx eslint src/ --fix

# Type checking
npx tsc --noEmit

# Database
npx prisma migrate dev
npx prisma studio
npx prisma generate

# Tests
npm test
npm run test:coverage
```
