"""
Endpoints Automations — proxy sécurisé vers SFMC.
KPIs calculés directement depuis l'API SFMC REST (sans Celery, sans DE).
"""
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.sfmc.rest_api import (
    get_automations_with_kpis,
    get_automation_detail,
    get_automation_schedule,
)
from apps.sfmc.data_extensions import read_de
from apps.sfmc.tracking_api import get_automation_email_kpis

logger = logging.getLogger(__name__)


class AutomationListView(APIView):
    """
    GET /api/automations/
    Retourne toutes les automations SFMC avec leurs KPIs calculés en live.
    Query params :
        search : filtre par nom
    """
    def get(self, request):
        search = request.query_params.get('search')
        try:
            automations = get_automations_with_kpis(search=search)
            return Response({'items': automations, 'count': len(automations)})
        except Exception as e:
            logger.error(f"Erreur liste automations: {e}")
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)


class AutomationDetailView(APIView):
    """
    GET /api/automations/:id/
    Retourne le détail complet d'une automation avec schedule et KPIs.
    """
    def get(self, request, sfmc_id: str):
        try:
            detail   = get_automation_detail(sfmc_id)
            schedule = get_automation_schedule(sfmc_id)

            from apps.sfmc.rest_api import _compute_automation_kpis, _normalize_automation_status
            kpis = _compute_automation_kpis(detail, schedule)

            return Response({
                **detail,
                'status':   _normalize_automation_status(detail.get('statusId')),
                'schedule': schedule,
                'kpis':     kpis,
            })
        except Exception as e:
            logger.error(f"Erreur détail automation {sfmc_id}: {e}")
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)


class AutomationExecutionsView(APIView):
    """
    GET /api/automations/:id/executions/
    Retourne l'historique des runs depuis ExecutionLog DE.

    Note : ExecutionLog stocke AutomationCustomerKey (= REST API 'key') dans
    component_id. On récupère donc d'abord le détail de l'automation pour
    obtenir son key, puis on filtre la DE par ce key.
    """
    def get(self, request, sfmc_id: str):
        limit         = int(request.query_params.get('limit', 20))
        status_filter = request.query_params.get('status')

        try:
            # Récupère le CustomerKey depuis le détail SFMC
            detail        = get_automation_detail(sfmc_id)
            customer_key  = detail.get('key') or sfmc_id  # fallback sur l'id si pas de key

            filters = {'component_id': customer_key, 'component_type': 'automation'}
            if status_filter:
                filters['status'] = status_filter

            executions = read_de('execution_log', filters=filters, max_rows=limit)
            return Response({'items': executions, 'count': len(executions)})
        except Exception as e:
            logger.error(f"Erreur executions automation {sfmc_id}: {e}")
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)


class AutomationKpisView(APIView):
    """
    GET /api/automations/:id/kpis/
    KPIs live depuis SFMC REST API + KPIs historiques depuis ExecutionLog DE si disponibles.
    """
    def get(self, request, sfmc_id: str):
        try:
            # KPIs live depuis SFMC REST API
            detail   = get_automation_detail(sfmc_id)
            schedule = get_automation_schedule(sfmc_id)

            from apps.sfmc.rest_api import _compute_automation_kpis, _normalize_automation_status
            live_kpis = _compute_automation_kpis(detail, schedule)

            # KPIs historiques depuis ExecutionLog DE (si des données existent)
            # ExecutionLog stocke le CustomerKey (pas le GUID id) dans component_id
            customer_key = detail.get('key') or sfmc_id
            executions = read_de('execution_log', filters={
                'component_id':   customer_key,
                'component_type': 'automation',
            }, max_rows=100)

            historical_kpis = {}
            if executions:
                from apps.kpis.calculators import reliability, performance, availability
                historical_kpis = {
                    'success_rate':          reliability.success_rate(executions),
                    'error_rate':            reliability.error_rate(executions),
                    'consecutive_failures':  reliability.consecutive_failures(executions),
                    'avg_duration_seconds':  performance.avg_duration(executions),
                    'p95_duration_seconds':  performance.p95_duration(executions),
                    'mtbf_hours':            availability.mtbf(executions),
                    'mttr_hours':            availability.mttr(executions),
                    'health_score':          availability.health_score(
                        success_rate=reliability.success_rate(executions),
                        on_time_rate=reliability.on_time_rate(executions),
                        sla_compliance=1.0,
                    ),
                    'total_runs': len(executions),
                }

            # KPIs email depuis SFMC tracking (SOAP Send objects)
            days_back  = int(request.query_params.get('days', 30))
            email_kpis = get_automation_email_kpis(sfmc_id, days_back=days_back)

            return Response({
                'component_id':    sfmc_id,
                'name':            detail.get('name', ''),
                'status':          _normalize_automation_status(detail.get('statusId')),
                'live_kpis':       live_kpis,
                'historical_kpis': historical_kpis,
                'email_kpis':      email_kpis,
                'has_history':     len(executions) > 0,
            })
        except Exception as e:
            logger.error(f"Erreur KPIs automation {sfmc_id}: {e}")
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)
