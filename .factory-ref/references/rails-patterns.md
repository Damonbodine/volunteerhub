# Ruby on Rails Patterns Reference

Reference for working with Rails codebases. Before making changes, check `Gemfile` for the Rails version, `config/routes.rb` for existing routes, and `db/schema.rb` for the current database schema.

## Project Structure

```
app/
  models/              # ActiveRecord models
    user.rb
    order.rb
  controllers/         # request handling
    application_controller.rb
    api/
      v1/
        orders_controller.rb
  views/               # ERB templates
    orders/
      index.html.erb
      show.html.erb
      _order.html.erb  # partial (underscore prefix)
    layouts/
      application.html.erb
  helpers/             # view helpers
  jobs/                # ActiveJob background jobs
  mailers/
  serializers/         # (if using jsonapi-serializer or active_model_serializers)
config/
  routes.rb            # URL routing
  database.yml
  environments/
    development.rb
    production.rb
db/
  schema.rb            # current schema state — don't edit directly
  migrate/             # migration files
    20240115_create_orders.rb
  seeds.rb             # seed data
spec/ or test/         # tests (RSpec or Minitest)
Gemfile
```

## Adding a New Model/Entity

Use the generator, then customize:

```bash
# Generate model + migration
rails generate model Order customer:references status:string total:decimal notes:text
```

Edit the generated migration:

```ruby
# db/migrate/20240115120000_create_orders.rb
class CreateOrders < ActiveRecord::Migration[7.1]
  def change
    create_table :orders do |t|
      t.references :customer, null: false, foreign_key: true
      t.string :status, null: false, default: "pending"
      t.decimal :total, precision: 10, scale: 2, null: false
      t.text :notes, default: ""
      t.timestamps                     # adds created_at and updated_at
    end

    add_index :orders, :status
    add_index :orders, [:customer_id, :status]
  end
end
```

Edit the model:

```ruby
# app/models/order.rb
class Order < ApplicationRecord
  belongs_to :customer, class_name: "User"
  has_many :order_items, dependent: :destroy

  STATUSES = %w[pending processing completed cancelled].freeze

  validates :status, inclusion: { in: STATUSES }
  validates :total, numericality: { greater_than: 0 }

  scope :pending,   -> { where(status: "pending") }
  scope :recent,    -> { order(created_at: :desc) }
  scope :for_user,  ->(user) { where(customer: user) }

  def complete!
    update!(status: "completed")
  end
end
```

## Adding a New API Endpoint/Route

### Routes

```ruby
# config/routes.rb
Rails.application.routes.draw do
  # JSON API namespace
  namespace :api do
    namespace :v1 do
      resources :orders do
        member do
          post :complete
        end
        collection do
          get :pending
        end
      end
    end
  end

  # HTML resources
  resources :orders, only: [:index, :show, :new, :create]
end
```

### Controller

```ruby
# app/controllers/api/v1/orders_controller.rb
class Api::V1::OrdersController < ApplicationController
  before_action :authenticate_user!
  before_action :set_order, only: [:show, :update, :destroy, :complete]

  def index
    @orders = current_user.orders.recent.page(params[:page])
    render json: @orders
  end

  def show
    render json: @order
  end

  def create
    @order = current_user.orders.build(order_params)
    if @order.save
      render json: @order, status: :created
    else
      render json: { errors: @order.errors }, status: :unprocessable_entity
    end
  end

  def update
    if @order.update(order_params)
      render json: @order
    else
      render json: { errors: @order.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    @order.destroy
    head :no_content
  end

  def complete
    @order.complete!
    render json: @order
  end

  private

  def set_order
    @order = current_user.orders.find(params[:id])
  end

  def order_params
    params.require(:order).permit(:total, :notes, :status)
  end
end
```

## Adding a New UI Component/Page

### Controller + Views

```ruby
# app/controllers/orders_controller.rb
class OrdersController < ApplicationController
  before_action :authenticate_user!

  def index
    @orders = current_user.orders.recent
  end

  def show
    @order = current_user.orders.find(params[:id])
  end

  def new
    @order = Order.new
  end

  def create
    @order = current_user.orders.build(order_params)
    if @order.save
      redirect_to @order, notice: "Order created."
    else
      render :new, status: :unprocessable_entity
    end
  end
end
```

```erb
<!-- app/views/orders/index.html.erb -->
<h1>Orders</h1>
<%= link_to "New Order", new_order_path, class: "btn btn-primary" %>

<table>
  <thead>
    <tr><th>ID</th><th>Status</th><th>Total</th><th>Actions</th></tr>
  </thead>
  <tbody>
    <% @orders.each do |order| %>
      <tr>
        <td><%= order.id %></td>
        <td><%= order.status %></td>
        <td><%= number_to_currency(order.total) %></td>
        <td><%= link_to "View", order_path(order) %></td>
      </tr>
    <% end %>
  </tbody>
</table>
```

```erb
<!-- app/views/orders/new.html.erb -->
<h1>New Order</h1>
<%= form_with model: @order do |f| %>
  <% if @order.errors.any? %>
    <div class="errors">
      <% @order.errors.full_messages.each do |msg| %>
        <p><%= msg %></p>
      <% end %>
    </div>
  <% end %>

  <div>
    <%= f.label :total %>
    <%= f.number_field :total, step: "0.01" %>
  </div>

  <div>
    <%= f.label :notes %>
    <%= f.text_area :notes %>
  </div>

  <%= f.submit "Create Order" %>
<% end %>
```

## Running Migrations

```bash
# Run all pending migrations
rails db:migrate

# Roll back last migration
rails db:rollback

# Roll back N steps
rails db:rollback STEP=3

# Migrate to specific version
rails db:migrate VERSION=20240115120000

# Show migration status
rails db:migrate:status

# Reset database (drop, create, migrate, seed)
rails db:reset

# Drop and recreate
rails db:drop db:create db:migrate

# Seed database
rails db:seed

# Schema only (no migrations, for test db)
rails db:schema:load
```

## Writing Tests

### RSpec (common in modern Rails)

```ruby
# spec/models/order_spec.rb
require "rails_helper"

RSpec.describe Order, type: :model do
  let(:user) { create(:user) }
  subject(:order) { build(:order, customer: user) }

  it { is_expected.to be_valid }
  it { is_expected.to validate_numericality_of(:total).is_greater_than(0) }

  describe "#complete!" do
    it "changes status to completed" do
      order.save!
      expect { order.complete! }.to change(order, :status).to("completed")
    end
  end
end
```

```ruby
# spec/requests/api/v1/orders_spec.rb
require "rails_helper"

RSpec.describe "Api::V1::Orders", type: :request do
  let(:user) { create(:user) }
  let(:headers) { user.create_new_auth_token }  # or JWT headers

  describe "GET /api/v1/orders" do
    it "returns user orders" do
      create(:order, customer: user)
      get "/api/v1/orders", headers: headers
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).size).to eq(1)
    end
  end
end
```

```bash
bundle exec rspec
bundle exec rspec spec/models/order_spec.rb
bundle exec rspec spec/requests/
```

### Minitest

```ruby
# test/models/order_test.rb
require "test_helper"

class OrderTest < ActiveSupport::TestCase
  test "defaults to pending status" do
    order = Order.new(customer: users(:one), total: 50)
    assert_equal "pending", order.status
  end
end
```

## Adding Middleware/Auth

### Devise (most common auth gem)

```ruby
# Gemfile
gem "devise"

# After bundle install:
# rails generate devise:install
# rails generate devise User
# rails db:migrate
```

Controller protection:

```ruby
class OrdersController < ApplicationController
  before_action :authenticate_user!           # Devise helper

  # Role-based:
  before_action :require_admin, only: [:destroy]

  private

  def require_admin
    redirect_to root_path unless current_user.admin?
  end
end
```

### Custom Rack Middleware

```ruby
# app/middleware/request_logger.rb
class RequestLogger
  def initialize(app)
    @app = app
  end

  def call(env)
    start = Time.now
    status, headers, response = @app.call(env)
    duration = ((Time.now - start) * 1000).round
    Rails.logger.info "#{env["REQUEST_METHOD"]} #{env["PATH_INFO"]} #{status} (#{duration}ms)"
    [status, headers, response]
  end
end
```

```ruby
# config/application.rb
config.middleware.use RequestLogger
config.middleware.insert_before ActionDispatch::Static, RequestLogger  # insert at specific position
```

### JWT API Auth

```ruby
# app/controllers/application_controller.rb
class ApplicationController < ActionController::API
  before_action :authenticate_request

  private

  def authenticate_request
    header = request.headers["Authorization"]
    token = header&.split(" ")&.last
    @current_user = User.find_by_token(token)
    render json: { error: "Unauthorized" }, status: :unauthorized unless @current_user
  end
end
```

## Common Commands

```bash
# Server
rails server                    # start dev server (port 3000)
rails s -p 4000                 # custom port
rails s -b 0.0.0.0              # bind to all interfaces

# Generators
rails generate model Order name:string
rails generate controller Orders index show
rails generate scaffold Order name:string total:decimal
rails generate migration AddStatusToOrders status:string
rails destroy model Order        # undo a generator

# Console
rails console                   # interactive Ruby console with app loaded
rails c --sandbox               # rollback all changes on exit

# Routes
rails routes                    # list all routes
rails routes --grep orders      # filter routes

# Tests
rails test                      # Minitest
bundle exec rspec               # RSpec

# Assets
rails assets:precompile         # compile assets for production

# Credentials
rails credentials:edit          # edit encrypted credentials
```
