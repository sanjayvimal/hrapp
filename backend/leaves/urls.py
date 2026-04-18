from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LeaveTypeViewSet, LeaveBalanceViewSet, LeaveApplicationViewSet

router = DefaultRouter()
router.register('leave-types', LeaveTypeViewSet)
router.register('leave-balances', LeaveBalanceViewSet)
router.register('leave-applications', LeaveApplicationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
