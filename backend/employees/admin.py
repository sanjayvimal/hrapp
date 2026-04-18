from django.contrib import admin
from .models import Department, Designation, Employee


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    search_fields = ['name']


@admin.register(Designation)
class DesignationAdmin(admin.ModelAdmin):
    list_display = ['title', 'department', 'description']
    list_filter = ['department']
    search_fields = ['title']


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'first_name', 'last_name', 'email', 'department', 'designation', 'status']
    list_filter = ['department', 'designation', 'status', 'employment_type', 'gender']
    search_fields = ['first_name', 'last_name', 'email', 'employee_id']
    readonly_fields = ['employee_id', 'created_at', 'updated_at']
