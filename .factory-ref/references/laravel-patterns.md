# Laravel Patterns Reference

Reference for working with Laravel codebases. Before making changes, check `composer.json` for the Laravel version, read `routes/api.php` and `routes/web.php` for existing routes, and look at `app/Models/` to understand data relationships.

## Project Structure

```
app/
  Console/
    Commands/         # Artisan commands
  Http/
    Controllers/      # Request handlers
      Api/
        OrderController.php
      OrderController.php
    Middleware/        # HTTP middleware
      Authenticate.php
      EnsureIsAdmin.php
    Requests/          # Form requests (validation)
      StoreOrderRequest.php
      UpdateOrderRequest.php
  Models/              # Eloquent models
    Order.php
    User.php
  Services/            # Business logic classes
    OrderService.php
  Policies/            # Authorization policies
    OrderPolicy.php
bootstrap/
config/
  app.php
  auth.php
  database.php
database/
  factories/           # model factories for tests/seeding
    OrderFactory.php
  migrations/          # migration files
    2024_01_15_create_orders_table.php
  seeders/
    DatabaseSeeder.php
    OrderSeeder.php
resources/
  views/               # Blade templates
    orders/
      index.blade.php
      show.blade.php
      create.blade.php
routes/
  api.php              # API routes (prefix: /api)
  web.php              # Web routes
tests/
  Feature/             # HTTP/integration tests
    OrderTest.php
  Unit/                # Unit tests
    OrderServiceTest.php
```

## Adding a New Model/Entity

Use Artisan to generate model + migration + factory + seeder at once:

```bash
php artisan make:model Order -mfs    # model, migration, factory, seeder
# or individually:
php artisan make:model Order
php artisan make:migration create_orders_table
php artisan make:factory OrderFactory
```

Edit the migration:

```php
// database/migrations/2024_01_15_000000_create_orders_table.php
public function up(): void
{
    Schema::create('orders', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        $table->enum('status', ['pending', 'processing', 'completed', 'cancelled'])
              ->default('pending');
        $table->decimal('total', 10, 2);
        $table->text('notes')->nullable();
        $table->timestamps();         // created_at + updated_at

        $table->index('status');
        $table->index(['user_id', 'status']);
    });
}

public function down(): void
{
    Schema::dropIfExists('orders');
}
```

Edit the model:

```php
// app/Models/Order.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'status', 'total', 'notes'];

    protected $casts = [
        'total' => 'decimal:2',
    ];

    const STATUSES = ['pending', 'processing', 'completed', 'cancelled'];

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
}
```

## Adding a New API Endpoint/Route

### Routes

```php
// routes/api.php
use App\Http\Controllers\Api\OrderController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('orders', OrderController::class);
    Route::post('orders/{order}/complete', [OrderController::class, 'complete']);
});
```

```bash
# List all routes
php artisan route:list --path=api/orders
```

### API Controller

```php
// app/Http/Controllers/Api/OrderController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderRequest;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = Order::forUser($request->user()->id)
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->latest()
            ->paginate(20);

        return response()->json($orders);
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        $this->authorize('view', $order);
        return response()->json($order);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $order = Order::create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
        ]);

        return response()->json($order, 201);
    }

    public function update(UpdateOrderRequest $request, Order $order): JsonResponse
    {
        $this->authorize('update', $order);
        $order->update($request->validated());
        return response()->json($order);
    }

    public function destroy(Request $request, Order $order): JsonResponse
    {
        $this->authorize('delete', $order);
        $order->delete();
        return response()->json(null, 204);
    }

    public function complete(Request $request, Order $order): JsonResponse
    {
        $this->authorize('update', $order);
        $order->update(['status' => 'completed']);
        return response()->json($order);
    }
}
```

### Form Request (Validation)

```php
// app/Http/Requests/StoreOrderRequest.php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;  // auth is handled by middleware
    }

    public function rules(): array
    {
        return [
            'total' => ['required', 'numeric', 'min:0.01'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
```

## Adding a New UI Component/Page

### Web Controller + Blade Views

```php
// routes/web.php
use App\Http\Controllers\OrderController;
Route::middleware('auth')->group(function () {
    Route::resource('orders', OrderController::class);
});
```

```php
// app/Http/Controllers/OrderController.php
public function index()
{
    $orders = auth()->user()->orders()->latest()->paginate(15);
    return view('orders.index', compact('orders'));
}

public function create()
{
    return view('orders.create');
}

public function store(StoreOrderRequest $request)
{
    Order::create([...$request->validated(), 'user_id' => auth()->id()]);
    return redirect()->route('orders.index')->with('success', 'Order created.');
}
```

```html
{{-- resources/views/orders/index.blade.php --}}
@extends('layouts.app')

@section('content')
<div class="container">
    <h1>Orders</h1>
    <a href="{{ route('orders.create') }}" class="btn btn-primary">New Order</a>

    <table class="table mt-4">
        <thead>
            <tr><th>ID</th><th>Status</th><th>Total</th></tr>
        </thead>
        <tbody>
            @forelse($orders as $order)
            <tr>
                <td>{{ $order->id }}</td>
                <td>{{ $order->status }}</td>
                <td>${{ number_format($order->total, 2) }}</td>
            </tr>
            @empty
            <tr><td colspan="3">No orders found.</td></tr>
            @endforelse
        </tbody>
    </table>

    {{ $orders->links() }}
</div>
@endsection
```

## Running Migrations

```bash
# Run all pending migrations
php artisan migrate

# Roll back last batch
php artisan migrate:rollback

# Roll back N batches
php artisan migrate:rollback --step=3

# Show migration status
php artisan migrate:status

# Fresh migration (drop all, re-run)  — dev only
php artisan migrate:fresh
php artisan migrate:fresh --seed

# Seed database
php artisan db:seed
php artisan db:seed --class=OrderSeeder
```

## Writing Tests

```php
// tests/Feature/OrderTest.php
<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_lists_orders_for_authenticated_user(): void
    {
        Order::factory(3)->create(['user_id' => $this->user->id]);
        Order::factory(2)->create();  // other user's orders

        $response = $this->actingAs($this->user)
            ->getJson('/api/orders');

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_creates_order(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/orders', ['total' => 99.99]);

        $response->assertCreated()
            ->assertJsonPath('status', 'pending')
            ->assertJsonPath('total', '99.99');

        $this->assertDatabaseHas('orders', [
            'user_id' => $this->user->id,
            'total' => 99.99,
        ]);
    }

    public function test_cannot_view_other_users_order(): void
    {
        $other = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $other->id]);

        $this->actingAs($this->user)
            ->getJson("/api/orders/{$order->id}")
            ->assertForbidden();
    }
}
```

```bash
php artisan test
php artisan test --filter=OrderTest
php artisan test --coverage          # requires Xdebug or PCOV
```

## Adding Middleware/Auth

### Laravel Sanctum (API tokens)

```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('orders', OrderController::class);
});

// Login route to get token
Route::post('/auth/token', function (Request $request) {
    $user = User::where('email', $request->email)->first();
    if (!$user || !Hash::check($request->password, $user->password)) {
        return response()->json(['error' => 'Invalid credentials'], 401);
    }
    return response()->json(['token' => $user->createToken('api')->plainTextToken]);
});
```

### Policy (Row-Level Auth)

```bash
php artisan make:policy OrderPolicy --model=Order
```

```php
// app/Policies/OrderPolicy.php
public function view(User $user, Order $order): bool
{
    return $user->id === $order->user_id;
}

public function update(User $user, Order $order): bool
{
    return $user->id === $order->user_id;
}
```

```php
// Register in AuthServiceProvider (Laravel < 11) or bootstrap/app.php (Laravel 11+)
Gate::policy(Order::class, OrderPolicy::class);
```

### Custom Middleware

```bash
php artisan make:middleware EnsureIsAdmin
```

```php
// app/Http/Middleware/EnsureIsAdmin.php
public function handle(Request $request, Closure $next): Response
{
    if (!$request->user()?->is_admin) {
        return response()->json(['error' => 'Forbidden'], 403);
    }
    return $next($request);
}
```

Register in `bootstrap/app.php` (Laravel 11+) or `app/Http/Kernel.php`:

```php
// bootstrap/app.php (Laravel 11+)
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias(['admin' => EnsureIsAdmin::class]);
})

// Usage in routes:
Route::middleware(['auth:sanctum', 'admin'])->group(...);
```

## Common Commands

```bash
# Development
php artisan serve                   # start dev server (localhost:8000)
php artisan serve --port=8001

# Code generation
php artisan make:model Post -mfsc   # model + migration + factory + seeder + controller
php artisan make:controller Api/OrderController --api --model=Order
php artisan make:request StoreOrderRequest
php artisan make:policy OrderPolicy --model=Order
php artisan make:middleware EnsureIsAdmin
php artisan make:job ProcessOrder
php artisan make:event OrderCompleted
php artisan make:command SendDailyReport

# Database
php artisan migrate
php artisan migrate:fresh --seed
php artisan db:seed
php artisan tinker               # REPL with app loaded

# Cache
php artisan config:clear
php artisan cache:clear
php artisan route:clear

# Queue
php artisan queue:work
php artisan queue:listen

# View all routes
php artisan route:list
php artisan route:list --path=api
```
