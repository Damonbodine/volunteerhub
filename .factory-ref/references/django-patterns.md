# Django Patterns Reference

Reference for working with Django codebases. Before making changes, read `settings.py` to understand installed apps, database config, and auth setup. Check `requirements.txt` or `pyproject.toml` for the Django version.

## Project Structure

```
project_name/              # Django project root (contains settings)
  settings.py              # or settings/ for split config
  urls.py                  # root URL conf — register app URLs here
  wsgi.py
  asgi.py
app_name/                  # each Django app
  models.py                # data models (ORM)
  views.py                 # views (function-based or class-based)
  urls.py                  # app-level URL patterns
  serializers.py           # DRF serializers (if using REST framework)
  admin.py                 # register models for Django admin
  forms.py                 # Django forms
  tests.py                 # tests (or tests/ directory)
  migrations/              # auto-generated migration files
    0001_initial.py
    0002_add_status.py
  templates/               # app-level templates
    app_name/
      list.html
      detail.html
  static/                  # app-level static files
manage.py                  # Django management CLI
requirements.txt
```

## Adding a New Model/Entity

Edit `app_name/models.py`:

```python
# app_name/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Order(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    customer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="orders",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
        db_index=True,  # index fields used in filters
    )
    total = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["customer", "status"]),
        ]

    def __str__(self):
        return f"Order #{self.pk} ({self.status})"
```

Register in `admin.py`:

```python
# app_name/admin.py
from django.contrib import admin
from .models import Order

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["id", "customer", "status", "total", "created_at"]
    list_filter = ["status"]
    search_fields = ["customer__email"]
```

Then run migrations (see below).

## Adding a New API Endpoint/Route

### With Django REST Framework

```python
# app_name/serializers.py
from rest_framework import serializers
from .models import Order

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ["id", "customer", "status", "total", "notes", "created_at"]
        read_only_fields = ["id", "created_at"]
```

```python
# app_name/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Order
from .serializers import OrderSerializer

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user)

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        order = self.get_object()
        order.status = "completed"
        order.save()
        return Response({"status": "completed"})
```

```python
# app_name/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"orders", views.OrderViewSet, basename="order")

urlpatterns = [
    path("", include(router.urls)),
]
```

```python
# project_name/urls.py  — register the app's URLs
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("app_name.urls")),
]
```

### Function-Based View (without DRF)

```python
# app_name/views.py
import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from .models import Order

@login_required
@require_http_methods(["GET"])
def order_list(request):
    orders = Order.objects.filter(customer=request.user).values(
        "id", "status", "total", "created_at"
    )
    return JsonResponse(list(orders), safe=False)

@login_required
@require_http_methods(["POST"])
def order_create(request):
    data = json.loads(request.body)
    order = Order.objects.create(
        customer=request.user,
        total=data["total"],
        notes=data.get("notes", ""),
    )
    return JsonResponse({"id": order.id, "status": order.status}, status=201)
```

## Adding a New UI Component/Page

### Template-Based View

```python
# app_name/views.py
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from .models import Order
from .forms import OrderForm

@login_required
def order_list(request):
    orders = Order.objects.filter(customer=request.user)
    return render(request, "app_name/order_list.html", {"orders": orders})

@login_required
def order_create(request):
    if request.method == "POST":
        form = OrderForm(request.POST)
        if form.is_valid():
            order = form.save(commit=False)
            order.customer = request.user
            order.save()
            return redirect("order_list")
    else:
        form = OrderForm()
    return render(request, "app_name/order_form.html", {"form": form})
```

```html
<!-- app_name/templates/app_name/order_list.html -->
{% extends "base.html" %}
{% block content %}
<h1>Orders</h1>
<table>
  <thead>
    <tr><th>ID</th><th>Status</th><th>Total</th></tr>
  </thead>
  <tbody>
    {% for order in orders %}
    <tr>
      <td>{{ order.id }}</td>
      <td>{{ order.get_status_display }}</td>
      <td>${{ order.total }}</td>
    </tr>
    {% empty %}
    <tr><td colspan="3">No orders found.</td></tr>
    {% endfor %}
  </tbody>
</table>
{% endblock %}
```

## Running Migrations

```bash
# Create migration after editing models.py
python manage.py makemigrations app_name

# Apply all pending migrations
python manage.py migrate

# Apply migrations for a specific app
python manage.py migrate app_name

# Show migration status
python manage.py showmigrations

# Preview SQL without applying
python manage.py sqlmigrate app_name 0002

# Roll back to previous migration
python manage.py migrate app_name 0001

# Create empty migration for data migrations
python manage.py makemigrations app_name --empty --name backfill_status
```

Data migration example:

```python
# app_name/migrations/0003_backfill_status.py
from django.db import migrations

def backfill_status(apps, schema_editor):
    Order = apps.get_model("app_name", "Order")
    Order.objects.filter(status="").update(status="pending")

class Migration(migrations.Migration):
    dependencies = [("app_name", "0002_add_status")]
    operations = [migrations.RunPython(backfill_status, migrations.RunPython.noop)]
```

## Writing Tests

```python
# app_name/tests.py
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from .models import Order

User = get_user_model()

class OrderModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", password="testpass"
        )

    def test_creates_with_pending_status(self):
        order = Order.objects.create(customer=self.user, total=99.99)
        self.assertEqual(order.status, "pending")

    def test_str_representation(self):
        order = Order.objects.create(customer=self.user, total=50)
        self.assertIn("pending", str(order))


class OrderAPITest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username="u", password="p")
        self.client.login(username="u", password="p")

    def test_list_orders(self):
        Order.objects.create(customer=self.user, total=100)
        response = self.client.get("/api/orders/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["results"]), 1)
```

```bash
# Run all tests
python manage.py test

# Run specific app
python manage.py test app_name

# Run specific test class/method
python manage.py test app_name.tests.OrderAPITest.test_list_orders

# With coverage
pip install coverage
coverage run manage.py test && coverage report
```

## Adding Middleware/Auth

### Login Required (function-based)

```python
from django.contrib.auth.decorators import login_required, permission_required

@login_required                                    # redirect to settings.LOGIN_URL
@login_required(login_url="/custom-login/")        # custom redirect
@permission_required("app_name.change_order")      # permission check
def my_view(request): ...
```

### Class-Based View Mixin

```python
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.views.generic import ListView

class OrderListView(LoginRequiredMixin, ListView):
    model = Order
    template_name = "app_name/order_list.html"

    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user)
```

### Custom Middleware

```python
# app_name/middleware.py
class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # before view
        response = self.get_response(request)
        # after view
        print(f"{request.method} {request.path} → {response.status_code}")
        return response
```

Register in `settings.py`:

```python
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    # ... existing middleware
    "app_name.middleware.RequestLoggingMiddleware",  # add here
]
```

### DRF Authentication

```python
# settings.py
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}
```

## Common Commands

```bash
# Start development server
python manage.py runserver
python manage.py runserver 0.0.0.0:8000  # expose to network

# Database
python manage.py makemigrations
python manage.py migrate
python manage.py dbshell             # raw SQL shell

# Django shell
python manage.py shell               # interactive Python shell with Django loaded
python manage.py shell_plus          # (django-extensions) auto-imports models

# Static files
python manage.py collectstatic       # gather static files for production

# Create superuser
python manage.py createsuperuser

# Load/dump fixtures
python manage.py loaddata fixtures/orders.json
python manage.py dumpdata app_name.Order --indent 2 > fixtures/orders.json

# Check for issues
python manage.py check
python manage.py check --deploy      # production readiness check
```
