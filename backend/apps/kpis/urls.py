from django.urls import path
from . import views

urlpatterns = [
    path('overview/',                    views.KpiOverviewView.as_view(),    name='kpi-overview'),
    path('overview/activity/',           views.OverviewActivityView.as_view(), name='overview-activity'),
    path('automations/<str:sfmc_id>/',   views.KpiAutomationView.as_view(),  name='kpi-automation'),
    path('journeys/<str:sfmc_id>/',      views.KpiJourneyView.as_view(),     name='kpi-journey'),
]
