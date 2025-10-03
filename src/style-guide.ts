/**
 * Simple Style Guide for AI Code Review
 * Just add your company's coding standards here and they'll be included in reviews
 */

/**
 * Your company's style guide text
 * Add your coding standards, conventions, and best practices here
 */
export const STYLE_GUIDE = `
**Company Coding Standards:**
# Truss Code Style Guide

This comprehensive style guide defines the coding standards, conventions, and best practices for the Truss codebase. It serves as a reference for developers and AI code reviewers to ensure consistency, maintainability, and quality across the entire application.

## Table of Contents

1. [General Principles](#general-principles)
2. [Ruby Style Guidelines](#ruby-style-guidelines)
3. [Rails Conventions](#rails-conventions)
4. [ActiveRecord Patterns](#activerecord-patterns)
5. [Controller Guidelines](#controller-guidelines)
6. [View and ERB Conventions](#view-and-erb-conventions)
7. [View Components](#view-components)
8. [JavaScript and Stimulus](#javascript-and-stimulus)
9. [Background Jobs](#background-jobs)
10. [Service Objects](#service-objects)
12. [Security Guidelines](#security-guidelines)
13. [Performance Considerations](#performance-considerations)
14. [Database Guidelines](#database-guidelines)
15. [API Design](#api-design)
16. [Error Handling](#error-handling)
17. [Documentation Standards](#documentation-standards)

## General Principles

### Code Quality
- **Readability over cleverness**: Write code that is easy to understand and maintain
- **Consistency**: Follow established patterns throughout the codebase
- **DRY (Don't Repeat Yourself)**: Extract common functionality into reusable components
- **Single Responsibility**: Each class, method, and component should have one clear purpose
- **Fail Fast**: Validate inputs early and provide clear error messages

### Ruby Conventions
- Use **double quotes** for string literals consistently
- Prefer **string interpolation** over \`.to_s\` method calls
- Use **Rails' \`.blank?\`** method instead of \`.nil?\` or \`.empty?\`
- Avoid spaces inside \`{ }\` when writing map functions or expressions involving brackets
- Use **Active Record** scoping with \`current_user.firm\` to scope queries to the firm

## Ruby Style Guidelines

### String Handling
\`\`\`ruby
# ✅ Good - Use double quotes
name = "John Doe"
message = "Hello, #{name}!"

# ❌ Bad - Single quotes
name = 'John Doe'
message = 'Hello, ' + name + '!'
\`\`\`

### Method Definitions
\`\`\`ruby
# ✅ Good - Clear method names and parameters
def create_project_with_tasks(project_params, task_templates)
  # Implementation
end

# ❌ Bad - Unclear naming
def cp(pt, tt)
  # Implementation
end
\`\`\`

### Conditional Logic
\`\`\`ruby
# ✅ Good - Use Rails' blank? method
return if user.blank?
return if params[:name].present?

# ❌ Bad - Manual nil/empty checks
return if user.nil? || user.empty?
return if params[:name].nil? || params[:name] != ""
\`\`\`

### Hash and Array Syntax
\`\`\`ruby
# ✅ Good - No spaces inside brackets
users.map { |user| user.name }
projects.select { |project| project.active? }

# ❌ Bad - Spaces inside brackets
users.map { | user | user.name }
projects.select { | project | project.active? }
\`\`\`

## Rails Conventions

### Model Organization
\`\`\`ruby
class Project < ApplicationRecord
  # Include concerns first
  include Discard::Model
  include PgSearch::Model

  # Constants
  STATUS_TYPES = %w[draft active completed].freeze

  # Associations
  belongs_to :firm
  has_many :tasks, dependent: :destroy

  # Validations
  validates :name, presence: true

  # Scopes
  scope :active, -> { where(archived_at: nil) }

  # Callbacks
  before_validation :set_due_date

  # Instance methods
  def display_name
    "#{name} (#{year})"
  end

  # Private methods
  private

  def set_due_date
    self.due_date ||= Time.zone.today + 3.days
  end
end
\`\`\`

### Controller Structure
\`\`\`ruby
class ProjectsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_project, only: [:show, :edit, :update, :destroy]

  def index
    @projects = current_user.firm.projects.includes(:tasks)
    @projects = @projects.search(params[:search]) if params[:search].present?
  end

  def show
    # Implementation
  end

  private

  def set_project
    @project = current_user.firm.projects.find(params[:id])
  end

  def project_params
    params.require(:project).permit(:name, :due_date, :description)
  end
end
\`\`\`

## ActiveRecord Patterns

### Tenant Scoping
\`\`\`ruby
# ✅ Good - Always scope to firm
def projects_for_user(user)
  user.firm.projects.active
end

# ❌ Bad - Direct model access (violates tenant scoping)
def projects_for_user(user)
  Project.active  # This will be caught by CustomRubocops/EnforceTenantScopes
end
\`\`\`

### Associations and Scopes
\`\`\`ruby
class Project < ApplicationRecord
  # Use descriptive scope names
  scope :with_tasks, -> { joins(:tasks).distinct }
  scope :due_this_week, -> { where(due_date: 1.week.from_now..1.week.from_now.end_of_week) }
  
  # Use counter_cache for performance
  belongs_to :firm, counter_cache: true
  
  # Use dependent: :destroy appropriately
  has_many :tasks, dependent: :destroy
  has_many :comments, dependent: :destroy
end
\`\`\`

### Query Optimization
\`\`\`ruby
# ✅ Good - Use includes for N+1 prevention
projects = current_user.firm.projects.includes(:tasks, :assignees)

# ✅ Good - Use select for specific fields
users = User.select(:id, :name, :email)

# ❌ Bad - N+1 queries
projects.each do |project|
  puts project.tasks.count  # This will cause N+1 queries
end
\`\`\`

### JSONB Accessor Usage
\`\`\`ruby
class Project < ApplicationRecord
  jsonb_accessor :metadata,
    first_sent_for_review_at: :datetime,
    reminder_email_draft_title: :string,
    custom_settings: [:string, array: true, default: []]

  # Use the accessor methods
  def reminder_sent?
    first_sent_for_review_at.present?
  end
end
\`\`\`

## Controller Guidelines

### Action Organization
\`\`\`ruby
class ProjectsController < ApplicationController
  # Authentication and authorization
  before_action :authenticate_user!
  before_action :set_project, only: [:show, :edit, :update, :destroy]
  before_action :authorize_project_access, only: [:show, :edit, :update, :destroy]

  # Standard CRUD actions
  def index
    @projects = current_user.firm.projects.includes(:tasks)
    @projects = apply_filters(@projects)
  end

  def show
    # Implementation
  end

  def new
    @project = current_user.firm.projects.build
  end

  def create
    @project = current_user.firm.projects.build(project_params)
    
    if @project.save
      redirect_to @project, notice: "Project created successfully."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    # Implementation
  end

  def update
    if @project.update(project_params)
      redirect_to @project, notice: "Project updated successfully."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @project.destroy
    redirect_to projects_path, notice: "Project deleted successfully."
  end

  private

  def set_project
    @project = current_user.firm.projects.find(params[:id])
  end

  def authorize_project_access
    # Authorization logic
  end

  def project_params
    params.require(:project).permit(:name, :due_date, :description)
  end

  def apply_filters(projects)
    projects = projects.search(params[:search]) if params[:search].present?
    projects = projects.by_status(params[:status]) if params[:status].present?
    projects
  end
end
\`\`\`

### Strong Parameters
\`\`\`ruby
# ✅ Good - Explicit parameter permitting
def project_params
  params.require(:project).permit(
    :name, :due_date, :description,
    task_attributes: [:name, :description, :_destroy, :id]
  )
end

# ❌ Bad - Permitting all parameters
def project_params
  params.require(:project).permit!
end
\`\`\`

### Response Handling
\`\`\`ruby
# ✅ Good - Proper status codes and responses
def create
  @project = current_user.firm.projects.build(project_params)
  
  if @project.save
    respond_to do |format|
      format.html { redirect_to @project, notice: "Project created successfully." }
      format.json { render json: @project, status: :created }
    end
  else
    respond_to do |format|
      format.html { render :new, status: :unprocessable_entity }
      format.json { render json: { errors: @project.errors }, status: :unprocessable_entity }
    end
  end
end
\`\`\`

## View and ERB Conventions

### ERB Structure
\`\`\`erb
<%# app/views/projects/index.html.erb %>
<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Projects</h1>
    <%= link_to "New Project", new_project_path, 
        class: "btn btn-primary" %>
  </div>

  <% if @projects.any? %>
    <div class="grid gap-4">
      <% @projects.each do |project| %>
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold">
            <%= link_to project.name, project_path(project), 
                class: "text-blue-600 hover:text-blue-800" %>
          </h2>
          <p class="text-gray-600"><%= project.description %></p>
          <div class="mt-4 flex justify-between items-center">
            <span class="text-sm text-gray-500">
              Due: <%= project.due_date.strftime("%B %d, %Y") %>
            </span>
            <div class="flex gap-2">
              <%= link_to "Edit", edit_project_path(project), 
                  class: "btn btn-sm btn-outline" %>
              <%= link_to "Delete", project_path(project), 
                  method: :delete, 
                  data: { confirm: "Are you sure?" },
                  class: "btn btn-sm btn-danger" %>
            </div>
          </div>
        </div>
      <% end %>
    </div>
  <% else %>
    <div class="text-center py-12">
      <p class="text-gray-500">No projects found.</p>
      <%= link_to "Create your first project", new_project_path, 
          class: "btn btn-primary mt-4" %>
    </div>
  <% end %>
</div>
\`\`\`

### Partial Organization
\`\`\`erb
<%# app/views/projects/_project_card.html.erb %>
<div class="bg-white rounded-lg shadow p-6">
  <h2 class="text-lg font-semibold">
    <%= link_to project.name, project_path(project), 
        class: "text-blue-600 hover:text-blue-800" %>
  </h2>
  <p class="text-gray-600"><%= project.description %></p>
  <div class="mt-4 flex justify-between items-center">
    <span class="text-sm text-gray-500">
      Due: <%= project.due_date.strftime("%B %d, %Y") %>
    </span>
    <div class="flex gap-2">
      <%= render "project_actions", project: project %>
    </div>
  </div>
</div>
\`\`\`

### Form Conventions
\`\`\`erb
<%# app/views/projects/_form.html.erb %>
<%= form_with(model: project, local: true, class: "space-y-6") do |form| %>
  <% if project.errors.any? %>
    <div class="bg-red-50 border border-red-200 rounded-md p-4">
      <h3 class="text-sm font-medium text-red-800">
        <%= pluralize(project.errors.count, "error") %> prohibited this project from being saved:
      </h3>
      <ul class="mt-2 text-sm text-red-700">
        <% project.errors.full_messages.each do |message| %>
          <li><%= message %></li>
        <% end %>
      </ul>
    </div>
  <% end %>

  <div>
    <%= form.label :name, class: "block text-sm font-medium text-gray-700" %>
    <%= form.text_field :name, 
        class: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" %>
  </div>

  <div>
    <%= form.label :due_date, class: "block text-sm font-medium text-gray-700" %>
    <%= form.date_field :due_date, 
        class: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" %>
  </div>

  <div>
    <%= form.label :description, class: "block text-sm font-medium text-gray-700" %>
    <%= form.text_area :description, rows: 3,
        class: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" %>
  </div>

  <div class="flex justify-end space-x-3">
    <%= link_to "Cancel", projects_path, 
        class: "btn btn-outline" %>
    <%= form.submit "Save Project", 
        class: "btn btn-primary" %>
  </div>
<% end %>
\`\`\`

## View Components

### Component Structure
\`\`\`ruby
# app/components/project_card_component.rb
class ProjectCardComponent < ApplicationViewComponent
  def initialize(project:, show_actions: true)
    @project = project
    @show_actions = show_actions
  end

  private

  attr_reader :project, :show_actions

  def project_status_class
    case project.status
    when "active"
      "bg-green-100 text-green-800"
    when "completed"
      "bg-blue-100 text-blue-800"
    else
      "bg-gray-100 text-gray-800"
    end
  end
end
\`\`\`

### Component Template
\`\`\`erb
<%# app/components/project_card_component.html.erb %>
<div class="bg-white rounded-lg shadow p-6">
  <div class="flex justify-between items-start">
    <div>
      <h2 class="text-lg font-semibold text-gray-900">
        <%= project.name %>
      </h2>
      <p class="text-sm text-gray-600 mt-1">
        <%= project.description %>
      </p>
    </div>
    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium <%= project_status_class %>">
      <%= project.status.titleize %>
    </span>
  </div>

  <div class="mt-4 flex justify-between items-center">
    <span class="text-sm text-gray-500">
      Due: <%= project.due_date.strftime("%B %d, %Y") %>
    </span>
    
    <% if show_actions %>
      <div class="flex gap-2">
        <%= link_to "View", project_path(project), 
            class: "btn btn-sm btn-outline" %>
        <%= link_to "Edit", edit_project_path(project), 
            class: "btn btn-sm btn-primary" %>
      </div>
    <% end %>
  </div>
</div>
\`\`\`

### Component Usage
\`\`\`erb
<%# In a view %>
<%= render ProjectCardComponent.new(project: project, show_actions: true) %>

<%# In a collection %>
<% @projects.each do |project| %>
  <%= render ProjectCardComponent.new(project: project) %>
<% end %>
\`\`\`

## JavaScript and Stimulus

### Stimulus Controller Structure
\`\`\`javascript
// app/javascript/controllers/project_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["name", "description", "form"]
  static values = { 
    projectId: Number,
    updateUrl: String 
  }

  connect() {
    console.log("Project controller connected")
  }

  async updateProject(event) {
    event.preventDefault()
    
    const formData = new FormData(this.formTarget)
    
    try {
      const response = await fetch(this.updateUrlValue, {
        method: "PATCH",
        body: formData,
        headers: {
          "X-CSRF-Token": document.querySelector("[name='csrf-token']").content
        }
      })
      
      if (response.ok) {
        this.showSuccessMessage("Project updated successfully")
      } else {
        this.showErrorMessage("Failed to update project")
      }
    } catch (error) {
      console.error("Error updating project:", error)
      this.showErrorMessage("An error occurred")
    }
  }

  showSuccessMessage(message) {
    // Implementation for success message
  }

  showErrorMessage(message) {
    // Implementation for error message
  }
}
\`\`\`

### Stimulus HTML Integration
\`\`\`erb
<%# In ERB template %>
<div data-controller="project" 
     data-project-project-id-value="<%= @project.id %>"
     data-project-update-url-value="<%= project_path(@project) %>">
  
  <form data-project-target="form" data-action="submit->project#updateProject">
    <input type="text" 
           data-project-target="name" 
           value="<%= @project.name %>"
           class="form-input">
    
    <textarea data-project-target="description"
              class="form-textarea"><%= @project.description %></textarea>
    
    <button type="submit" class="btn btn-primary">
      Update Project
    </button>
  </form>
</div>
\`\`\`

### Turbo Integration
\`\`\`erb
<%# Using Turbo Frames %>
<%= turbo_frame_tag "project_#{project.id}" do %>
  <%= render ProjectCardComponent.new(project: project) %>
<% end %>

<%# Using Turbo Streams %>
<%= turbo_stream.replace "project_#{project.id}" do %>
  <%= render ProjectCardComponent.new(project: project) %>
<% end %>
\`\`\`

## Background Jobs

### Job Structure
\`\`\`ruby
# app/jobs/process_project_job.rb
class ProcessProjectJob < ApplicationJob
  queue_as :default

  def perform(project_id, user_id)
    project = Project.find(project_id)
    user = User.find(user_id)
    
    # Perform the work
    process_project_tasks(project)
    send_notification(user, project)
  end

  private

  def process_project_tasks(project)
    project.tasks.each do |task|
      # Process each task
      task.process!
    end
  end

  def send_notification(user, project)
    ProjectMailer.processing_complete(user, project).deliver_now
  end
end
\`\`\`

### Job Usage
\`\`\`ruby
# In a controller or service
class ProjectsController < ApplicationController
  def create
    @project = current_user.firm.projects.build(project_params)
    
    if @project.save
      ProcessProjectJob.perform_later(@project.id, current_user.id)
      redirect_to @project, notice: "Project created and processing started."
    else
      render :new, status: :unprocessable_entity
    end
  end
end
\`\`\`

### Error Handling in Jobs
\`\`\`ruby
class ProcessProjectJob < ApplicationJob
  retry_on StandardError, wait: :exponentially_longer, attempts: 3

  def perform(project_id, user_id)
    # Job implementation
  rescue StandardError => e
    Rails.logger.error "ProcessProjectJob failed: #{e.message}"
    raise e
  end
end
\`\`\`

## Service Objects

### Service Structure
\`\`\`ruby
# app/services/project_creation_service.rb
class ProjectCreationService
  include Dry::Initializer.define -> do
    option :project_params, type: Types::Hash
    option :user, type: Types.Instance(User)
    option :task_templates, type: Types::Array, default: -> { [] }
  end

  def call
    ActiveRecord::Base.transaction do
      create_project
      create_tasks
      send_notifications
      
      project
    end
  end

  private

  attr_reader :project

  def create_project
    @project = user.firm.projects.create!(project_params)
  end

  def create_tasks
    task_templates.each do |template|
      project.tasks.create!(
        name: template.name,
        description: template.description
      )
    end
  end

  def send_notifications
    ProjectMailer.project_created(project).deliver_later
  end
end
\`\`\`

### Service Usage
\`\`\`ruby
# In a controller
class ProjectsController < ApplicationController
  def create
    service = ProjectCreationService.new(
      project_params: project_params,
      user: current_user,
      task_templates: selected_templates
    )
    
    if service.call
      redirect_to service.project, notice: "Project created successfully."
    else
      render :new, status: :unprocessable_entity
    end
  end
end
\`\`\`

## Security Guidelines

### Authentication and Authorization
\`\`\`ruby
# In controllers
class ProjectsController < ApplicationController
  before_action :authenticate_user!
  before_action :authorize_project_access, only: [:show, :edit, :update, :destroy]

  private

  def authorize_project_access
    unless current_user.can_access_project?(@project)
      redirect_to root_path, alert: "Access denied."
    end
  end
end
\`\`\`

### Input Validation
\`\`\`ruby
# Strong parameters
def project_params
  params.require(:project).permit(
    :name, :due_date, :description,
    task_attributes: [:name, :description, :_destroy, :id]
  )
end

# Model validations
class Project < ApplicationRecord
  validates :name, presence: true, length: { maximum: 255 }
  validates :due_date, presence: true
  validate :due_date_not_in_past

  private

  def due_date_not_in_past
    return unless due_date.present?
    
    if due_date < Date.current
      errors.add(:due_date, "cannot be in the past")
    end
  end
end
\`\`\`

### SQL Injection Prevention
\`\`\`ruby
# ✅ Good - Use parameterized queries
Project.where("name ILIKE ?", "%#{params[:search]}%")

# ❌ Bad - String interpolation
Project.where("name ILIKE '%#{params[:search]}%'")
\`\`\`

### CSRF Protection
\`\`\`erb
<!-- In forms -->
<%= form_with(model: project, local: true) do |form| %>
  <!-- Form fields -->
<% end %>

<!-- In AJAX requests -->
<%= link_to "Delete", project_path(project), 
    method: :delete, 
    data: { 
      confirm: "Are you sure?",
      "turbo-method": "delete"
    } %>
\`\`\`

## Performance Considerations

### Database Optimization
\`\`\`ruby
# Use includes to prevent N+1 queries
projects = current_user.firm.projects.includes(:tasks, :assignees)

# Use select for specific fields
users = User.select(:id, :name, :email)

# Use counter_cache for counts
class Project < ApplicationRecord
  belongs_to :firm, counter_cache: true
end

# Use database indexes
add_index :projects, [:firm_id, :archived_at]
add_index :tasks, [:project_id, :status]
\`\`\`

### Caching Strategies
\`\`\`ruby
# Fragment caching
<% cache project do %>
  <%= render ProjectCardComponent.new(project: project) %>
<% end %>

# Rails caching
def expensive_calculation
  Rails.cache.fetch("project_#{id}_calculation", expires_in: 1.hour) do
    # Expensive calculation
  end
end
\`\`\`

### Background Job Optimization
\`\`\`ruby
# Use appropriate queues
class ProcessProjectJob < ApplicationJob
  queue_as :high_priority
end

# Batch processing
class ProcessProjectsJob < ApplicationJob
  def perform(project_ids)
    Project.where(id: project_ids).find_each do |project|
      process_project(project)
    end
  end
end
\`\`\`

## Database Guidelines

### Migration Best Practices
\`\`\`ruby
# db/migrate/20240101000001_add_index_to_projects.rb
class AddIndexToProjects < ActiveRecord::Migration[8.0]
  def change
    add_index :projects, [:firm_id, :archived_at], 
              name: "index_projects_on_firm_id_and_archived_at"
    
    add_index :tasks, [:project_id, :status], 
              name: "index_tasks_on_project_id_and_status"
  end
end
\`\`\`

### Schema Design
\`\`\`ruby
# Use appropriate data types
create_table :projects do |t|
  t.string :name, null: false, limit: 255
  t.text :description
  t.date :due_date, null: false
  t.datetime :archived_at
  t.jsonb :metadata, default: {}
  t.references :firm, null: false, foreign_key: true
  t.references :user, null: false, foreign_key: true
  
  t.timestamps
end
\`\`\`

### Data Integrity
\`\`\`ruby
# Use database constraints
add_foreign_key :projects, :firms
add_foreign_key :projects, :users
add_check_constraint :projects, "due_date >= CURRENT_DATE", 
                     name: "projects_due_date_not_in_past"
\`\`\`

## API Design

### RESTful API Structure
\`\`\`ruby
# app/controllers/api/v1/projects_controller.rb
class Api::V1::ProjectsController < ApplicationController
  before_action :authenticate_api_user!
  before_action :set_project, only: [:show, :update, :destroy]

  def index
    @projects = current_user.firm.projects.includes(:tasks)
    @projects = @projects.search(params[:search]) if params[:search].present?
    
    render json: @projects, include: :tasks
  end

  def show
    render json: @project, include: :tasks
  end

  def create
    @project = current_user.firm.projects.build(project_params)
    
    if @project.save
      render json: @project, status: :created
    else
      render json: { errors: @project.errors }, status: :unprocessable_entity
    end
  end

  def update
    if @project.update(project_params)
      render json: @project
    else
      render json: { errors: @project.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    @project.destroy
    head :no_content
  end

  private

  def set_project
    @project = current_user.firm.projects.find(params[:id])
  end

  def project_params
    params.require(:project).permit(:name, :due_date, :description)
  end
end
\`\`\`

### API Response Format
\`\`\`ruby
# Consistent response format
{
  "data": {
    "id": 1,
    "type": "project",
    "attributes": {
      "name": "Test Project",
      "due_date": "2024-01-15",
      "description": "A test project"
    },
    "relationships": {
      "tasks": {
        "data": [
          { "id": 1, "type": "task" }
        ]
      }
    }
  },
  "included": [
    {
      "id": 1,
      "type": "task",
      "attributes": {
        "name": "Test Task",
        "status": "to_do"
      }
    }
  ]
}
\`\`\`

## Error Handling

### Controller Error Handling
\`\`\`ruby
class ProjectsController < ApplicationController
  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :record_invalid

  private

  def record_not_found
    redirect_to projects_path, alert: "Project not found."
  end

  def record_invalid(exception)
    @project = exception.record
    render :new, status: :unprocessable_entity
  end
end
\`\`\`

### Service Error Handling
\`\`\`ruby
class ProjectCreationService
  class Error < StandardError; end
  class ValidationError < Error; end

  def call
    validate_inputs
    create_project
    create_tasks
    send_notifications
    
    project
  rescue ValidationError => e
    Rails.logger.error "ProjectCreationService validation failed: #{e.message}"
    raise e
  end

  private

  def validate_inputs
    raise ValidationError, "User is required" if user.blank?
    raise ValidationError, "Project params are required" if project_params.blank?
  end
end
\`\`\`

### Custom Error Classes
\`\`\`ruby
# app/errors/project_errors.rb
module ProjectErrors
  class AccessDenied < StandardError
    def message
      "You don't have permission to access this project"
    end
  end

  class InvalidState < StandardError
    def message
      "Project is in an invalid state for this operation"
    end
  end
end
\`\`\`

## Documentation Standards

### Code Comments
\`\`\`ruby
class Project < ApplicationRecord
  # Scopes projects to only those that are not archived
  # Used primarily for displaying active projects in the UI
  scope :active, -> { where(archived_at: nil) }

  # Creates a project with associated tasks from templates
  # @param project_params [Hash] The project attributes
  # @param user [User] The user creating the project
  # @param task_templates [Array<TaskTemplate>] Templates to create tasks from
  # @return [Project] The created project
  def self.create_with_tasks(project_params, user, task_templates = [])
    # Implementation
  end

  private

  # Sets a default due date if none is provided
  # Called before validation to ensure due_date is always present
  def set_due_date
    self.due_date ||= Time.zone.today + 3.days
  end
end
\`\`\`

### README Documentation
\`\`\`markdown
# Project Management System

## Overview
This system manages projects, tasks, and user assignments for accounting firms.

## Key Features
- Project creation and management
- Task assignment and tracking
- User authentication and authorization
- File upload and management
- Email notifications

## Getting Started
1. Install dependencies: \`bundle install\`
2. Setup database: \`rails db:setup\`
3. Start server: \`rails server\`

## API Documentation
See \`/api-docs\` for complete API documentation.

## Contributing
Please follow the style guide in \`STYLE_GUIDE.md\`.
\`\`\`

## Conclusion

This style guide provides comprehensive guidelines for maintaining consistency and quality in the Truss codebase. All developers should follow these conventions to ensure:

- **Consistency** across the entire codebase
- **Maintainability** for future development
- **Readability** for all team members
- **Quality** through established best practices
- **Security** through proper validation and authorization
- **Performance** through optimization techniques

Remember that this guide is a living document and should be updated as the codebase evolves and new patterns emerge.

For questions or suggestions about this style guide, please create an issue or discuss with the development team.

`;

/**
 * Get the style guide text formatted for the AI prompt
 */
export function getStyleGuideForPrompt(): string {
  return `\n**Style Guide:**\n${STYLE_GUIDE}`;
}
