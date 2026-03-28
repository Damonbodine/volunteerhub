# Flask Patterns Reference

Reference for working with Flask codebases. Before making changes, read `requirements.txt` or `pyproject.toml` for installed packages, check `config.py` for database and auth configuration, and look at the app factory pattern to understand how blueprints are registered.

## Project Structure

```
app/                         # application package
  __init__.py                # app factory (create_app())
  config.py                  # configuration classes
  extensions.py              # Flask extension instances (db, login_manager, etc.)
  models/                    # SQLAlchemy models
    __init__.py
    order.py
    user.py
  routes/                    # Blueprint route files
    __init__.py
    orders.py
    users.py
    auth.py
  schemas/                   # Marshmallow or Pydantic schemas
    order.py
  services/                  # business logic
    order_service.py
  templates/                 # Jinja2 templates
    base.html
    orders/
      index.html
      detail.html
  static/
migrations/                  # Flask-Migrate / Alembic migration files
  versions/
tests/
  conftest.py
  test_orders.py
wsgi.py                      # production entry point
run.py                       # development entry point
requirements.txt
```

## Adding a New Model/Entity

```python
# app/models/order.py
from app.extensions import db
from datetime import datetime, timezone

class Order(db.Model):
    __tablename__ = "orders"
    __table_args__ = (
        db.Index("ix_orders_customer_status", "customer_id", "status"),
    )

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = db.Column(
        db.String(20),
        nullable=False,
        default="pending",
        index=True,
    )
    total = db.Column(db.Numeric(10, 2), nullable=False)
    notes = db.Column(db.Text, default="")
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationship
    customer = db.relationship("User", back_populates="orders")

    STATUSES = ("pending", "processing", "completed", "cancelled")

    def __repr__(self):
        return f"<Order {self.id} {self.status}>"

    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "status": self.status,
            "total": float(self.total),
            "notes": self.notes,
            "created_at": self.created_at.isoformat(),
        }
```

Register in `app/models/__init__.py`:

```python
# app/models/__init__.py
from .user import User      # noqa: F401
from .order import Order    # noqa: F401  — import so Flask-Migrate sees it
```

## Adding a New API Endpoint/Route

### Blueprint

```python
# app/routes/orders.py
from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.order import Order
from app.routes.auth import login_required

orders_bp = Blueprint("orders", __name__, url_prefix="/api/orders")

@orders_bp.route("/", methods=["GET"])
@login_required
def list_orders():
    status = request.args.get("status")
    query = Order.query.filter_by(customer_id=g.current_user.id)
    if status:
        query = query.filter_by(status=status)
    orders = query.order_by(Order.created_at.desc()).all()
    return jsonify([o.to_dict() for o in orders])

@orders_bp.route("/<int:order_id>", methods=["GET"])
@login_required
def get_order(order_id):
    order = Order.query.filter_by(
        id=order_id, customer_id=g.current_user.id
    ).first_or_404()
    return jsonify(order.to_dict())

@orders_bp.route("/", methods=["POST"])
@login_required
def create_order():
    data = request.get_json()
    if not data or "total" not in data:
        return jsonify({"error": "total is required"}), 400

    if float(data["total"]) <= 0:
        return jsonify({"error": "total must be positive"}), 400

    order = Order(
        customer_id=g.current_user.id,
        total=data["total"],
        notes=data.get("notes", ""),
    )
    db.session.add(order)
    db.session.commit()
    return jsonify(order.to_dict()), 201

@orders_bp.route("/<int:order_id>", methods=["PATCH"])
@login_required
def update_order(order_id):
    order = Order.query.filter_by(
        id=order_id, customer_id=g.current_user.id
    ).first_or_404()
    data = request.get_json()

    if "status" in data:
        if data["status"] not in Order.STATUSES:
            return jsonify({"error": "Invalid status"}), 400
        order.status = data["status"]
    if "notes" in data:
        order.notes = data["notes"]

    db.session.commit()
    return jsonify(order.to_dict())

@orders_bp.route("/<int:order_id>", methods=["DELETE"])
@login_required
def delete_order(order_id):
    order = Order.query.filter_by(
        id=order_id, customer_id=g.current_user.id
    ).first_or_404()
    db.session.delete(order)
    db.session.commit()
    return "", 204
```

Register blueprint in app factory:

```python
# app/__init__.py
from flask import Flask
from app.extensions import db, migrate
from app.routes.orders import orders_bp

def create_app(config_name="development"):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    db.init_app(app)
    migrate.init_app(app, db)

    app.register_blueprint(orders_bp)        # register blueprint here
    # app.register_blueprint(users_bp)

    return app
```

## Adding a New UI Component/Page

### Template-Rendered Blueprint

```python
# app/routes/orders_ui.py
from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required, current_user
from app.extensions import db
from app.models.order import Order

orders_ui_bp = Blueprint("orders_ui", __name__, url_prefix="/orders")

@orders_ui_bp.route("/")
@login_required
def index():
    orders = Order.query.filter_by(customer_id=current_user.id)\
        .order_by(Order.created_at.desc()).all()
    return render_template("orders/index.html", orders=orders)

@orders_ui_bp.route("/new", methods=["GET", "POST"])
@login_required
def create():
    if request.method == "POST":
        total = request.form.get("total", type=float)
        if not total or total <= 0:
            flash("Total must be positive", "error")
            return render_template("orders/new.html")
        order = Order(customer_id=current_user.id, total=total,
                      notes=request.form.get("notes", ""))
        db.session.add(order)
        db.session.commit()
        flash("Order created!", "success")
        return redirect(url_for("orders_ui.index"))
    return render_template("orders/new.html")
```

```html
<!-- app/templates/orders/index.html -->
{% extends "base.html" %}
{% block content %}
<h1>Orders</h1>
<a href="{{ url_for('orders_ui.create') }}">New Order</a>
<table>
  {% for order in orders %}
  <tr>
    <td>{{ order.id }}</td>
    <td>{{ order.status }}</td>
    <td>${{ "%.2f"|format(order.total) }}</td>
  </tr>
  {% else %}
  <tr><td colspan="3">No orders yet.</td></tr>
  {% endfor %}
</table>
{% endblock %}
```

## Running Migrations

Flask-Migrate wraps Alembic:

```bash
# Initialize migrations (first time only)
flask db init

# Generate a migration after changing models
flask db migrate -m "add orders table"

# Apply pending migrations
flask db upgrade

# Roll back one step
flask db downgrade

# Roll back to specific revision
flask db downgrade abc123

# Show migration history
flask db history

# Show current revision
flask db current

# Auto-generate and apply in one step (dev only)
flask db migrate -m "my change" && flask db upgrade
```

## Writing Tests

```python
# tests/conftest.py
import pytest
from app import create_app
from app.extensions import db as _db
from app.models.user import User

@pytest.fixture(scope="session")
def app():
    app = create_app("testing")
    with app.app_context():
        _db.create_all()
        yield app
        _db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_client(client, app):
    """Client with a logged-in user."""
    with app.app_context():
        user = User(email="test@example.com")
        user.set_password("password")
        _db.session.add(user)
        _db.session.commit()
    client.post("/auth/login", json={"email": "test@example.com", "password": "password"})
    return client
```

```python
# tests/test_orders.py
def test_list_orders_empty(auth_client):
    res = auth_client.get("/api/orders/")
    assert res.status_code == 200
    assert res.json == []

def test_create_order(auth_client):
    res = auth_client.post("/api/orders/", json={"total": 99.99})
    assert res.status_code == 201
    assert res.json["status"] == "pending"
    assert res.json["total"] == 99.99

def test_create_order_invalid(auth_client):
    res = auth_client.post("/api/orders/", json={"total": -1})
    assert res.status_code == 400
```

```bash
# Run tests
pytest
pytest tests/test_orders.py
pytest -v --tb=short
pytest --cov=app --cov-report=term-missing
```

## Adding Middleware/Auth

### JWT Auth (Flask-JWT-Extended)

```python
# app/extensions.py
from flask_jwt_extended import JWTManager
jwt = JWTManager()

# app/__init__.py
jwt.init_app(app)
```

```python
# app/routes/auth.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models.user import User
from functools import wraps

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data["email"]).first()
    if not user or not user.check_password(data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401
    token = create_access_token(identity=user.id)
    return jsonify({"access_token": token})

# Decorator for protected routes
def login_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        from flask import g
        from app.models.user import User
        g.current_user = User.query.get(get_jwt_identity())
        return fn(*args, **kwargs)
    return wrapper
```

### Session-Based Auth (Flask-Login)

```python
# app/extensions.py
from flask_login import LoginManager
login_manager = LoginManager()
login_manager.login_view = "auth.login"

@login_manager.user_loader
def load_user(user_id):
    from app.models.user import User
    return User.query.get(int(user_id))
```

```python
# Protect a route
from flask_login import login_required, current_user

@orders_ui_bp.route("/")
@login_required
def index():
    orders = Order.query.filter_by(customer_id=current_user.id).all()
    return render_template("orders/index.html", orders=orders)
```

### Request Hooks (before/after)

```python
# app/__init__.py or a blueprint
@app.before_request
def check_maintenance():
    if app.config.get("MAINTENANCE_MODE"):
        return jsonify({"error": "Maintenance in progress"}), 503

@app.after_request
def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response
```

## Common Commands

```bash
# Run development server
flask run
flask run --port 5001 --debug

# Set environment
export FLASK_APP=wsgi.py
export FLASK_ENV=development       # or production

# Database migrations
flask db init
flask db migrate -m "description"
flask db upgrade
flask db downgrade

# Shell with app context
flask shell

# Run tests
pytest
pytest --cov=app

# List routes
flask routes

# Install dependencies
pip install -r requirements.txt
pip freeze > requirements.txt

# Create virtual environment
python -m venv venv
source venv/bin/activate           # macOS/Linux
venv\Scripts\activate              # Windows
```
