from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone

from .models import LeaveType, LeaveBalance, LeaveApplication
from .serializers import LeaveTypeSerializer, LeaveBalanceSerializer, LeaveApplicationSerializer


class LeaveTypeViewSet(viewsets.ModelViewSet):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer


class LeaveBalanceViewSet(viewsets.ModelViewSet):
    queryset = LeaveBalance.objects.select_related('employee', 'leave_type').all()
    serializer_class = LeaveBalanceSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['employee', 'leave_type', 'year']

    @action(detail=False, methods=['get'])
    def by_employee(self, request):
        emp_id = request.query_params.get('employee')
        year = request.query_params.get('year', timezone.now().year)
        if not emp_id:
            return Response({'error': 'employee parameter required'}, status=400)
        balances = LeaveBalance.objects.filter(employee_id=emp_id, year=year)
        serializer = LeaveBalanceSerializer(balances, many=True)
        return Response(serializer.data)


class LeaveApplicationViewSet(viewsets.ModelViewSet):
    queryset = LeaveApplication.objects.select_related('employee', 'leave_type', 'approved_by').all()
    serializer_class = LeaveApplicationSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['employee', 'leave_type', 'status']
    search_fields = ['employee__first_name', 'employee__last_name', 'employee__employee_id']
    ordering_fields = ['applied_on', 'start_date']
    ordering = ['-applied_on']

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        leave = self.get_object()
        if leave.status != 'pending':
            return Response({'error': 'Only pending applications can be approved'}, status=400)

        remarks = request.data.get('remarks', '')
        leave.status = 'approved'
        leave.approved_by = request.user
        leave.approved_on = timezone.now()
        leave.remarks = remarks
        leave.save()

        balance, _ = LeaveBalance.objects.get_or_create(
            employee=leave.employee,
            leave_type=leave.leave_type,
            year=leave.start_date.year,
            defaults={'total_days': leave.leave_type.max_days_per_year}
        )
        balance.used_days += leave.days
        balance.save()

        return Response({'message': 'Leave approved successfully'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        leave = self.get_object()
        if leave.status != 'pending':
            return Response({'error': 'Only pending applications can be rejected'}, status=400)

        remarks = request.data.get('remarks', '')
        leave.status = 'rejected'
        leave.approved_by = request.user
        leave.approved_on = timezone.now()
        leave.remarks = remarks
        leave.save()

        return Response({'message': 'Leave rejected successfully'})

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        leave = self.get_object()
        if leave.status not in ['pending', 'approved']:
            return Response({'error': 'Cannot cancel this leave'}, status=400)

        if leave.status == 'approved':
            try:
                balance = LeaveBalance.objects.get(
                    employee=leave.employee,
                    leave_type=leave.leave_type,
                    year=leave.start_date.year
                )
                balance.used_days = max(0, balance.used_days - leave.days)
                balance.save()
            except LeaveBalance.DoesNotExist:
                pass

        leave.status = 'cancelled'
        leave.save()
        return Response({'message': 'Leave cancelled successfully'})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        pending = LeaveApplication.objects.filter(status='pending').count()
        approved = LeaveApplication.objects.filter(status='approved').count()
        rejected = LeaveApplication.objects.filter(status='rejected').count()

        return Response({
            'pending': pending,
            'approved': approved,
            'rejected': rejected,
        })
