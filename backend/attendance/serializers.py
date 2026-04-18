from rest_framework import serializers
from .models import Attendance
from employees.serializers import EmployeeListSerializer


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id_code = serializers.CharField(source='employee.employee_id', read_only=True)
    hours_worked = serializers.ReadOnlyField()

    class Meta:
        model = Attendance
        fields = '__all__'


class AttendanceBulkSerializer(serializers.Serializer):
    date = serializers.DateField()
    records = serializers.ListField(
        child=serializers.DictField()
    )
