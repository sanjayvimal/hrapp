from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, Count, Q
from decimal import Decimal

from .models import SalaryStructure, PaySlip
from .serializers import SalaryStructureSerializer, PaySlipSerializer
from employees.models import Employee


class SalaryStructureViewSet(viewsets.ModelViewSet):
    queryset = SalaryStructure.objects.select_related('employee').all()
    serializer_class = SalaryStructureSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['employee', 'is_active']
    search_fields = ['employee__first_name', 'employee__last_name', 'employee__employee_id']


class PaySlipViewSet(viewsets.ModelViewSet):
    queryset = PaySlip.objects.select_related('employee', 'salary_structure').all()
    serializer_class = PaySlipSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['employee', 'month', 'year', 'is_paid']
    search_fields = ['employee__first_name', 'employee__last_name', 'employee__employee_id']
    ordering_fields = ['year', 'month', 'net_salary']
    ordering = ['-year', '-month']

    @action(detail=False, methods=['post'])
    def generate(self, request):
        month = request.data.get('month')
        year = request.data.get('year')
        employee_ids = request.data.get('employee_ids', [])

        if not month or not year:
            return Response({'error': 'month and year are required'}, status=400)

        employees = Employee.objects.filter(status='active')
        if employee_ids:
            employees = employees.filter(id__in=employee_ids)

        generated = []
        errors = []

        for emp in employees:
            try:
                structure = SalaryStructure.objects.filter(
                    employee=emp, is_active=True
                ).first()

                if not structure:
                    errors.append({'employee': emp.full_name, 'error': 'No active salary structure'})
                    continue

                from attendance.models import Attendance
                working_days = 26
                paid_days_qs = Attendance.objects.filter(
                    employee=emp,
                    date__month=month,
                    date__year=year,
                    status__in=['present', 'work_from_home', 'half_day']
                ).count()
                paid_days = paid_days_qs if paid_days_qs > 0 else working_days

                ratio = Decimal(str(paid_days)) / Decimal(str(working_days))
                gross = structure.gross_salary * ratio
                deductions = structure.total_deductions * ratio
                net = gross - deductions

                payslip, created = PaySlip.objects.update_or_create(
                    employee=emp,
                    month=month,
                    year=year,
                    defaults={
                        'salary_structure': structure,
                        'working_days': working_days,
                        'paid_days': paid_days,
                        'basic_salary': round(structure.basic_salary * ratio, 2),
                        'hra': round(structure.hra * ratio, 2),
                        'transport_allowance': round(structure.transport_allowance * ratio, 2),
                        'medical_allowance': round(structure.medical_allowance * ratio, 2),
                        'other_allowances': round(structure.other_allowances * ratio, 2),
                        'pf_deduction': round(structure.pf_deduction * ratio, 2),
                        'esi_deduction': round(structure.esi_deduction * ratio, 2),
                        'tax_deduction': round(structure.tax_deduction * ratio, 2),
                        'other_deductions': round(structure.other_deductions * ratio, 2),
                        'gross_salary': round(gross, 2),
                        'total_deductions': round(deductions, 2),
                        'net_salary': round(net, 2),
                    }
                )
                generated.append(emp.full_name)
            except Exception as e:
                errors.append({'employee': emp.full_name, 'error': str(e)})

        return Response({
            'generated': len(generated),
            'employees': generated,
            'errors': errors,
        })

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        payslip = self.get_object()
        from datetime import date
        payslip.is_paid = True
        payslip.paid_on = request.data.get('paid_on', date.today().isoformat())
        payslip.save()
        return Response({'message': 'Payslip marked as paid'})

    @action(detail=False, methods=['get'])
    def summary(self, request):
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        qs = PaySlip.objects.all()
        if month:
            qs = qs.filter(month=month)
        if year:
            qs = qs.filter(year=year)

        agg = qs.aggregate(
            total_payslips=Count('id'),
            total_gross=Sum('gross_salary'),
            total_deductions=Sum('total_deductions'),
            total_net=Sum('net_salary'),
            paid_count=Count('id', filter=Q(is_paid=True)),
        )
        return Response(agg)
