"""
URLs principales — toutes les routes de l'API.
"""
from django.contrib import admin
from django.urls import path, include
from apps.kpis.views import ApiHealthView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth
    path('api/auth/', include('apps.users.urls')),

    # Données SFMC (proxy sécurisé)
    path('api/automations/', include('apps.automations.urls')),
    path('api/journeys/',    include('apps.journeys.urls')),

    # Monitoring
    path('api/monitoring/',  include('apps.monitoring.urls')),
    path('api/kpis/',        include('apps.kpis.urls')),
    path('api/alerts/',      include('apps.alerts.urls')),

    # Health checks
    path('api/api-health/',  ApiHealthView.as_view(), name='api-health'),
]
