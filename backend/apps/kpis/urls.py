from django.urls import path
from . import views

urlpatterns = [
    path('overview/',                    views.KpiOverviewView.as_view(),    name='kpi-overview'),
    path('automations/<str:sfmc_id>/',   views.KpiAutomationView.as_view(),  name='kpi-automation'),
    path('journeys/<str:sfmc_id>/',      views.KpiJourneyView.as_view(),     name='kpi-journey'),
]
