from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from datetime import date

from .models import Department, Designation, Employee
from .serializers import DepartmentSerializer, DesignationSerializer, EmployeeListSerializer, EmployeeDetailSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer


class DesignationViewSet(viewsets.ModelViewSet):
    queryset = Designation.objects.all()
    serializer_class = DesignationSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['department']


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related('department', 'designation').all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['department', 'designation', 'status', 'employment_type', 'gender']
    search_fields = ['first_name', 'last_name', 'email', 'employee_id', 'phone']
    ordering_fields = ['date_of_joining', 'first_name', 'last_name', 'employee_id']
    ordering = ['first_name']

    def get_serializer_class(self):
        if self.action == 'list':
            return EmployeeListSerializer
        return EmployeeDetailSerializer

    @action(detail=False, methods=['get'])
    def stats(self, request):
        from attendance.models import Attendance
        from leaves.models import LeaveApplication

        today = date.today()
        total = Employee.objects.count()
        active = Employee.objects.filter(status='active').count()
        present_today = Attendance.objects.filter(date=today, status__in=['present', 'work_from_home']).count()
        on_leave_today = LeaveApplication.objects.filter(
            start_date__lte=today, end_date__gte=today, status='approved'
        ).count()

        return Response({
            'total_employees': total,
            'active_employees': active,
            'present_today': present_today,
            'on_leave_today': on_leave_today,
            'total_departments': Department.objects.count(),
            'total_designations': Designation.objects.count(),
        })
