from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from datetime import date, timedelta
from django.db.models import Count, Q

from .models import Attendance
from .serializers import AttendanceSerializer
from employees.models import Employee


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related('employee').all()
    serializer_class = AttendanceSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['employee', 'date', 'status']
    search_fields = ['employee__first_name', 'employee__last_name', 'employee__employee_id']
    ordering_fields = ['date', 'check_in', 'check_out']
    ordering = ['-date']

    @action(detail=False, methods=['get'])
    def today(self, request):
        today = date.today()
        records = Attendance.objects.filter(date=today).select_related('employee')
        serializer = AttendanceSerializer(records, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def monthly_summary(self, request):
        emp_id = request.query_params.get('employee')
        month = int(request.query_params.get('month', date.today().month))
        year = int(request.query_params.get('year', date.today().year))

        qs = Attendance.objects.filter(date__month=month, date__year=year)
        if emp_id:
            qs = qs.filter(employee_id=emp_id)

        summary = qs.values('status').annotate(count=Count('id'))
        return Response({
            'month': month,
            'year': year,
            'summary': list(summary),
        })

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        records = request.data.get('records', [])
        created = []
        errors = []
        for rec in records:
            try:
                obj, _ = Attendance.objects.update_or_create(
                    employee_id=rec['employee'],
                    date=rec['date'],
                    defaults={
                        'status': rec.get('status', 'present'),
                        'check_in': rec.get('check_in'),
                        'check_out': rec.get('check_out'),
                        'notes': rec.get('notes', ''),
                    }
                )
                created.append(obj.id)
            except Exception as e:
                errors.append({'record': rec, 'error': str(e)})

        return Response({'created': len(created), 'errors': errors})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        today = date.today()
        active_employees = Employee.objects.filter(status='active').count()
        present = Attendance.objects.filter(date=today, status__in=['present', 'work_from_home']).count()
        absent = Attendance.objects.filter(date=today, status='absent').count()
        late = Attendance.objects.filter(date=today, status='late').count()

        return Response({
            'date': today,
            'active_employees': active_employees,
            'present': present,
            'absent': absent,
            'late': late,
            'not_marked': active_employees - present - absent - late,
        })
