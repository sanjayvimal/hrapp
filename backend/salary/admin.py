from django.contrib import admin
from .models import SalaryStructure, PaySlip


@admin.register(SalaryStructure)
class SalaryStructureAdmin(admin.ModelAdmin):
    list_display = ['employee', 'basic_salary', 'effective_from', 'is_active']
    list_filter = ['is_active']
    search_fields = ['employee__first_name', 'employee__last_name', 'employee__employee_id']


@admin.register(PaySlip)
class PaySlipAdmin(admin.ModelAdmin):
    list_display = ['employee', 'month', 'year', 'gross_salary', 'net_salary', 'is_paid']
    list_filter = ['month', 'year', 'is_paid']
    search_fields = ['employee__first_name', 'employee__last_name']
