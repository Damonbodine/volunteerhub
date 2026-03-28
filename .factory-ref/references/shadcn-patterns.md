# shadcn/ui Patterns Reference

Reference for working with shadcn/ui component libraries in brownfield codebases. Check `components/ui/` to see which components are already installed before adding new ones.

## Project Structure

```
src/
  components/
    ui/              # shadcn primitives — installed via CLI, don't edit directly
      button.tsx
      card.tsx
      input.tsx
      table.tsx
      ...
    [feature]/       # composed components using ui primitives
      UserCard.tsx
      OrderTable.tsx
  app/               # Next.js App Router pages
    layout.tsx
    page.tsx
    [feature]/
      page.tsx
  lib/
    utils.ts         # cn() helper (auto-installed by shadcn)
```

## Adding a New Model/Entity (Component Conventions)

shadcn is a UI library — "entities" map to composed components. Follow this pattern:

```tsx
// components/orders/OrderCard.tsx
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Order {
  id: string;
  customerName: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  total: number;
  createdAt: Date;
}

const STATUS_VARIANTS = {
  pending: "secondary",
  processing: "default",
  completed: "default",    // use className for green
  cancelled: "destructive",
} as const;

export function OrderCard({ order, onEdit }: { order: Order; onEdit?: (id: string) => void }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{order.customerName}</CardTitle>
        <Badge variant={STATUS_VARIANTS[order.status]}>{order.status}</Badge>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">${order.total.toFixed(2)}</div>
        <p className="text-xs text-muted-foreground">
          {order.createdAt.toLocaleDateString()}
        </p>
      </CardContent>
      {onEdit && (
        <CardFooter>
          <Button variant="outline" size="sm" onClick={() => onEdit(order.id)}>
            Edit
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
```

## Adding a New UI Component/Page

### Installing a New Component

```bash
# Check if component exists first
ls src/components/ui/dialog.tsx 2>/dev/null || npx shadcn@latest add dialog

# Common components
npx shadcn@latest add button card input label select table badge
npx shadcn@latest add dialog sheet drawer form
npx shadcn@latest add dropdown-menu context-menu command
npx shadcn@latest add toast sonner alert alert-dialog
npx shadcn@latest add tabs accordion collapsible
npx shadcn@latest add avatar skeleton separator
```

### Page with Data Table

```tsx
// app/orders/page.tsx
import { OrderTable } from "@/components/orders/OrderTable";

export default function OrdersPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Orders</h1>
        <Button asChild>
          <Link href="/orders/new">New Order</Link>
        </Button>
      </div>
      <OrderTable />
    </div>
  );
}
```

### Data Table Component

```tsx
// components/orders/OrderTable.tsx
"use client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

export function OrderTable({ orders }: { orders: Order[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                No orders found.
              </TableCell>
            </TableRow>
          )}
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.customerName}</TableCell>
              <TableCell>
                <Badge variant="outline">{order.status}</Badge>
              </TableCell>
              <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### Form with Validation

```tsx
// components/orders/OrderForm.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

const orderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  total: z.coerce.number().positive("Must be positive"),
  status: z.enum(["pending", "processing", "completed", "cancelled"]),
});

type OrderFormValues = z.infer<typeof orderSchema>;

export function OrderForm({ onSubmit }: { onSubmit: (values: OrderFormValues) => void }) {
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { customerName: "", total: 0, status: "pending" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="customerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer Name</FormLabel>
              <FormControl>
                <Input placeholder="Acme Corp" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </Form>
  );
}
```

## Running Migrations

shadcn is a UI library — no migrations needed. For component updates:

```bash
# Update a specific component to latest
npx shadcn@latest add button --overwrite

# Check shadcn version
npx shadcn@latest --version

# Initialize shadcn in an existing project
npx shadcn@latest init
```

## Writing Tests

```tsx
// __tests__/OrderCard.test.tsx
import { render, screen } from "@testing-library/react";
import { OrderCard } from "@/components/orders/OrderCard";

const mockOrder = {
  id: "1",
  customerName: "Acme Corp",
  status: "pending" as const,
  total: 99.99,
  createdAt: new Date("2024-01-15"),
};

test("renders order details", () => {
  render(<OrderCard order={mockOrder} />);
  expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  expect(screen.getByText("$99.99")).toBeInTheDocument();
  expect(screen.getByText("pending")).toBeInTheDocument();
});

test("calls onEdit when edit button clicked", async () => {
  const onEdit = vi.fn();
  const { user } = render(<OrderCard order={mockOrder} onEdit={onEdit} />);
  await user.click(screen.getByRole("button", { name: /edit/i }));
  expect(onEdit).toHaveBeenCalledWith("1");
});
```

## Adding Middleware/Auth

Auth wraps at the layout level in Next.js App Router:

```tsx
// app/(protected)/layout.tsx
import { auth } from "@/lib/auth";  // your auth provider
import { redirect } from "next/navigation";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return <>{children}</>;
}
```

For route-level protection with Clerk:

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) await auth.protect();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

## Common Commands

```bash
# Install shadcn in a new project
npx shadcn@latest init

# Add components
npx shadcn@latest add [component-name]
npx shadcn@latest add button card table form input label select

# List available components
npx shadcn@latest add --help

# Update existing component
npx shadcn@latest add button --overwrite

# Add multiple at once
npx shadcn@latest add dialog sheet toast badge avatar skeleton

# Install dependencies for forms
npm install react-hook-form @hookform/resolvers zod
```

## Key Rules

1. `"use client"` on every component that uses hooks (`useState`, `useEffect`, etc.)
2. Import from `@/components/ui/` for shadcn primitives — never copy-paste component code
3. Use the `cn()` helper from `@/lib/utils` to merge classNames: `cn("base-class", conditional && "extra")`
4. Use CSS variables for colors — never hardcode hex values: `text-foreground`, `bg-background`, `border-border`
5. `className` with Tailwind — never inline `style={{}}`
6. Check `components/ui/` before installing a component that might already exist
7. Use `variant` prop on Button/Badge instead of custom color classes
8. `asChild` prop allows Button to render as Link: `<Button asChild><Link href="/foo">Go</Link></Button>`
