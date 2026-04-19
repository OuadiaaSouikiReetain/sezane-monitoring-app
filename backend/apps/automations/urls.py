from django.urls import path
from . import views

urlpatterns = [
    path('',                          views.AutomationListView.as_view(),       name='automation-list'),
    path('sync-kpis/',                views.SyncAutomationKpisView.as_view(),   name='automation-sync-kpis'),
    path('<str:sfmc_id>/',            views.AutomationDetailView.as_view(),     name='automation-detail'),
    path('<str:sfmc_id>/executions/', views.AutomationExecutionsView.as_view(), name='automation-executions'),
    path('<str:sfmc_id>/kpis/',       views.AutomationKpisView.as_view(),       name='automation-kpis'),
]
