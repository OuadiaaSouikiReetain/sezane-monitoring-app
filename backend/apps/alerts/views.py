"""
Endpoints Alertes — lecture et gestion du cycle de vie des alertes.
"""
import uuid
import logging
from datetime import datetime, timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.sfmc.data_extensions import read_de, write_de, update_de_row

logger = logging.getLogger(__name__)


class AlertListView(APIView):
    """GET /api/alerts/ → liste les alertes (filtrables par statut, priorité)"""
    def get(self, request):
        filters = {}
        if request.query_params.get('status'):
            filters['status'] = request.query_params.get('status')
        if request.query_params.get('priority'):
            filters['priority'] = request.query_params.get('priority')

        alerts = read_de('alert', filters=filters)
        return Response({'items': alerts, 'count': len(alerts)})


class AlertAcknowledgeView(APIView):
    """PATCH /api/alerts/:id/acknowledge/ → marque une alerte comme prise en charge"""
    def patch(self, request, alert_id: str):
        update_de_row('alert', 'id_alert', alert_id, {
            'status':           'acknowledged',
            'acknowledged_at':  datetime.now(timezone.utc).isoformat(),
            'acknowledged_by':  request.user.email,
        })
        return Response({'acknowledged': True})


class NotificationChannelListView(APIView):
    """
    GET  /api/alerts/channels/  → liste les canaux
    POST /api/alerts/channels/  → crée un canal
    """
    def get(self, request):
        channels = read_de('notification_channel')
        return Response({'items': channels, 'count': len(channels)})

    def post(self, request):
        import json
        data = request.data
        channel = {
            'id_channel':  str(uuid.uuid4()),
            'type':        data.get('type'),
            'name':        data.get('name'),
            'config_json': json.dumps(data.get('config', {})),
            'active':      data.get('active', True),
            'created_at':  datetime.now(timezone.utc).isoformat(),
        }
        write_de('notification_channel', [channel])
        return Response(channel, status=status.HTTP_201_CREATED)


class NotificationChannelDetailView(APIView):
    """PATCH /api/alerts/channels/:id/ → modifie un canal"""
    def patch(self, request, channel_id: str):
        update_de_row('notification_channel', 'id_channel', channel_id, request.data)
        return Response({'updated': True})
