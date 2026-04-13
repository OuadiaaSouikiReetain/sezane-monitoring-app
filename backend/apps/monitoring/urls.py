from django.urls import path
from . import views

urlpatterns = [
    # Configs
    path('configs/',          views.MonitoringConfigListView.as_view(),   name='config-list'),
    path('configs/<str:config_id>/', views.MonitoringConfigDetailView.as_view(), name='config-detail'),

    # Règles
    path('rules/',            views.MonitoringRuleListView.as_view(),     name='rule-list'),
    path('rules/<str:rule_id>/', views.MonitoringRuleDetailView.as_view(), name='rule-detail'),

    # Anomalies
    path('anomalies/',        views.AnomalyListView.as_view(),            name='anomaly-list'),
    path('anomalies/<str:anomaly_id>/resolve/',     views.AnomalyResolveView.as_view(),     name='anomaly-resolve'),
    path('anomalies/<str:anomaly_id>/acknowledge/', views.AnomalyAcknowledgeView.as_view(), name='anomaly-acknowledge'),
]
