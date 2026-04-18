from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SalaryStructureViewSet, PaySlipViewSet

router = DefaultRouter()
router.register('salary-structures', SalaryStructureViewSet)
router.register('payslips', PaySlipViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
