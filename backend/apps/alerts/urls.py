from django.urls import path
from . import views

urlpatterns = [
    path('',                                     views.AlertListView.as_view(),                name='alert-list'),
    path('<str:alert_id>/acknowledge/',          views.AlertAcknowledgeView.as_view(),         name='alert-acknowledge'),
    path('channels/',                            views.NotificationChannelListView.as_view(),  name='channel-list'),
    path('channels/<str:channel_id>/',           views.NotificationChannelDetailView.as_view(), name='channel-detail'),
]
