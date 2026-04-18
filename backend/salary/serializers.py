from rest_framework import serializers
from .models import SalaryStructure, PaySlip


class SalaryStructureSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id_code = serializers.CharField(source='employee.employee_id', read_only=True)
    gross_salary = serializers.ReadOnlyField()
    total_deductions = serializers.ReadOnlyField()
    net_salary = serializers.ReadOnlyField()

    class Meta:
        model = SalaryStructure
        fields = '__all__'


class PaySlipSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id_code = serializers.CharField(source='employee.employee_id', read_only=True)
    department_name = serializers.CharField(source='employee.department.name', read_only=True)
    designation_title = serializers.CharField(source='employee.designation.title', read_only=True)
    month_name = serializers.CharField(source='get_month_display', read_only=True)

    class Meta:
        model = PaySlip
        fields = '__all__'
