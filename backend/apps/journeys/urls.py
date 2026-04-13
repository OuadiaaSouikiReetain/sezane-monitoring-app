from django.urls import path
from . import views

urlpatterns = [
    path('',                          views.JourneyListView.as_view(),      name='journey-list'),
    path('<str:sfmc_id>/',            views.JourneyDetailView.as_view(),    name='journey-detail'),
    path('<str:sfmc_id>/executions/', views.JourneyExecutionsView.as_view(), name='journey-executions'),
    path('<str:sfmc_id>/kpis/',       views.JourneyKpisView.as_view(),      name='journey-kpis'),
]
