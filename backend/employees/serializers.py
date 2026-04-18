from rest_framework import serializers
from .models import Department, Designation, Employee


class DepartmentSerializer(serializers.ModelSerializer):
    employee_count = serializers.SerializerMethodField()
    designation_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = '__all__'

    def get_employee_count(self, obj):
        return obj.employees.filter(status='active').count()

    def get_designation_count(self, obj):
        return obj.designations.count()


class DesignationSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    employee_count = serializers.SerializerMethodField()

    class Meta:
        model = Designation
        fields = '__all__'

    def get_employee_count(self, obj):
        return obj.employees.filter(status='active').count()


class EmployeeListSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    designation_title = serializers.CharField(source='designation.title', read_only=True)
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'department', 'department_name',
            'designation', 'designation_title', 'status',
            'date_of_joining', 'employment_type', 'profile_photo', 'gender',
        ]


class EmployeeDetailSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    designation_title = serializers.CharField(source='designation.title', read_only=True)
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = Employee
        fields = '__all__'
