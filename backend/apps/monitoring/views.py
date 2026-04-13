"""
Endpoints Monitoring — CRUD sur les règles, configs et anomalies.
"""
import uuid
import logging
from datetime import datetime, timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.sfmc.data_extensions import read_de, write_de, update_de_row

logger = logging.getLogger(__name__)


# ─── MonitoringConfig ─────────────────────────────────────────────────────────

class MonitoringConfigListView(APIView):
    """
    GET  /api/monitoring/configs/         → liste toutes les configs
    POST /api/monitoring/configs/         → crée une config
    """
    def get(self, request):
        component_type = request.query_params.get('component_type')
        filters = {}
        if component_type:
            filters['component_type'] = component_type
        configs = read_de('monitoring_config', filters=filters)
        return Response({'items': configs, 'count': len(configs)})

    def post(self, request):
        data = request.data
        config = {
            'id_config':             str(uuid.uuid4()),
            'component_type':        data.get('component_type'),
            'component_id':          data.get('component_id'),
            'component_name':        data.get('component_name', ''),
            'monitored':             data.get('monitored', True),
            'expected_schedule':     data.get('expected_schedule', ''),
            'max_duration_minutes':  data.get('max_duration_minutes', ''),
            'min_success_rate':      data.get('min_success_rate', ''),
            'created_at':            datetime.now(timezone.utc).isoformat(),
            'updated_at':            datetime.now(timezone.utc).isoformat(),
        }
        write_de('monitoring_config', [config])
        return Response(config, status=status.HTTP_201_CREATED)


class MonitoringConfigDetailView(APIView):
    """PATCH /api/monitoring/configs/:id/ → met à jour une config"""
    def patch(self, request, config_id: str):
        updates = {**request.data, 'updated_at': datetime.now(timezone.utc).isoformat()}
        update_de_row('monitoring_config', 'id_config', config_id, updates)
        return Response({'updated': True})


# ─── MonitoringRule ───────────────────────────────────────────────────────────

class MonitoringRuleListView(APIView):
    """
    GET  /api/monitoring/rules/  → liste toutes les règles
    POST /api/monitoring/rules/  → crée une règle
    """
    def get(self, request):
        filters = {}
        if request.query_params.get('active'):
            filters['active'] = request.query_params.get('active')
        rules = read_de('monitoring_rule', filters=filters)
        return Response({'items': rules, 'count': len(rules)})

    def post(self, request):
        data = request.data
        rule = {
            'id_rule':            str(uuid.uuid4()),
            'kpi_id':             data.get('kpi_id'),
            'name':               data.get('name'),
            'component_type':     data.get('component_type', 'all'),
            'component_id':       data.get('component_id', ''),
            'condition_type':     data.get('condition_type'),
            'threshold_value':    data.get('threshold_value', ''),
            'comparison_period':  data.get('comparison_period', ''),
            'comparison_delta':   data.get('comparison_delta', ''),
            'cooldown_minutes':   data.get('cooldown_minutes', 60),
            'active':             data.get('active', True),
            'created_at':         datetime.now(timezone.utc).isoformat(),
        }
        write_de('monitoring_rule', [rule])
        return Response(rule, status=status.HTTP_201_CREATED)


class MonitoringRuleDetailView(APIView):
    """PATCH /api/monitoring/rules/:id/ → active/désactive ou modifie une règle"""
    def patch(self, request, rule_id: str):
        update_de_row('monitoring_rule', 'id_rule', rule_id, request.data)
        return Response({'updated': True})


# ─── Anomalies ────────────────────────────────────────────────────────────────

class AnomalyListView(APIView):
    """GET /api/monitoring/anomalies/ → liste les anomalies ouvertes"""
    def get(self, request):
        filters = {}
        if request.query_params.get('status'):
            filters['status'] = request.query_params.get('status')
        if request.query_params.get('severity'):
            filters['severity'] = request.query_params.get('severity')
        if request.query_params.get('component_type'):
            filters['component_type'] = request.query_params.get('component_type')

        anomalies = read_de('anomaly', filters=filters)
        return Response({'items': anomalies, 'count': len(anomalies)})


class AnomalyResolveView(APIView):
    """PATCH /api/monitoring/anomalies/:id/resolve/ → résout une anomalie"""
    def patch(self, request, anomaly_id: str):
        user = request.user
        update_de_row('anomaly', 'id_anomaly', anomaly_id, {
            'status':      'resolved',
            'resolved_at': datetime.now(timezone.utc).isoformat(),
            'resolved_by': user.email,
        })
        return Response({'resolved': True})


class AnomalyAcknowledgeView(APIView):
    """PATCH /api/monitoring/anomalies/:id/acknowledge/ → acquitte une anomalie"""
    def patch(self, request, anomaly_id: str):
        update_de_row('anomaly', 'id_anomaly', anomaly_id, {
            'status': 'acknowledged',
        })
        return Response({'acknowledged': True})
