from django.db import models
from employees.models import Employee


class Attendance(models.Model):
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('half_day', 'Half Day'),
        ('holiday', 'Holiday'),
        ('weekend', 'Weekend'),
        ('work_from_home', 'Work From Home'),
        ('late', 'Late'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['employee', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"{self.employee.full_name} - {self.date} - {self.status}"

    @property
    def hours_worked(self):
        if self.check_in and self.check_out:
            from datetime import datetime, date as d
            check_in_dt = datetime.combine(d.today(), self.check_in)
            check_out_dt = datetime.combine(d.today(), self.check_out)
            diff = check_out_dt - check_in_dt
            return round(diff.seconds / 3600, 2)
        return 0
