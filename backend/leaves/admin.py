from django.contrib import admin
from .models import LeaveType, LeaveBalance, LeaveApplication


@admin.register(LeaveType)
class LeaveTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'max_days_per_year', 'is_paid']


@admin.register(LeaveBalance)
class LeaveBalanceAdmin(admin.ModelAdmin):
    list_display = ['employee', 'leave_type', 'year', 'total_days', 'used_days']
    list_filter = ['leave_type', 'year']
    search_fields = ['employee__first_name', 'employee__last_name']


@admin.register(LeaveApplication)
class LeaveApplicationAdmin(admin.ModelAdmin):
    list_display = ['employee', 'leave_type', 'start_date', 'end_date', 'days', 'status', 'applied_on']
    list_filter = ['status', 'leave_type']
    search_fields = ['employee__first_name', 'employee__last_name']
    date_hierarchy = 'start_date'
