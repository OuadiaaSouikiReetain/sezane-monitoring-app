"""
Endpoints Automations — proxy sécurisé vers SFMC.
Le frontend appelle Django, Django appelle SFMC avec les credentials serveur.
"""
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.sfmc.rest_api import get_automations, get_automation_detail
from apps.sfmc.data_extensions import read_de

logger = logging.getLogger(__name__)


class AutomationListView(APIView):
    """
    GET /api/automations/
    Retourne toutes les automations SFMC enrichies avec
    le statut de monitoring et le dernier run.
    """
    def get(self, request):
        search = request.query_params.get('search')
        try:
            automations = get_automations(search=search)
            return Response({'items': automations, 'count': len(automations)})
        except Exception as e:
            logger.error(f"Erreur liste automations: {e}")
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)


class AutomationDetailView(APIView):
    """
    GET /api/automations/:id/
    Retourne le détail complet d'une automation (steps + activités).
    """
    def get(self, request, sfmc_id: str):
        try:
            detail = get_automation_detail(sfmc_id)
            return Response(detail)
        except Exception as e:
            logger.error(f"Erreur détail automation {sfmc_id}: {e}")
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)


class AutomationExecutionsView(APIView):
    """
    GET /api/automations/:id/executions/
    Retourne l'historique des runs depuis ExecutionLog_DE.
    Query params :
        limit  : nombre de runs à retourner (défaut 20)
        status : filtrer par statut (success | error | skipped)
    """
    def get(self, request, sfmc_id: str):
        limit  = int(request.query_params.get('limit', 20))
        status_filter = request.query_params.get('status')

        filters = {'component_id': sfmc_id, 'component_type': 'automation'}
        if status_filter:
            filters['status'] = status_filter

        try:
            executions = read_de('execution_log', filters=filters, max_rows=limit)
            return Response({'items': executions, 'count': len(executions)})
        except Exception as e:
            logger.error(f"Erreur executions automation {sfmc_id}: {e}")
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)


class AutomationKpisView(APIView):
    """
    GET /api/automations/:id/kpis/
    Retourne les valeurs KPI depuis KPI_Value_DE.
    Query params :
        granularity : run | hourly | daily (défaut daily)
        days        : nombre de jours (défaut 7)
    """
    def get(self, request, sfmc_id: str):
        granularity = request.query_params.get('granularity', 'daily')

        try:
            kpi_values = read_de('kpi_value', filters={
                'component_id':   sfmc_id,
                'component_type': 'automation',
                'granularity':    granularity,
            })
            return Response({'items': kpi_values, 'count': len(kpi_values)})
        except Exception as e:
            logger.error(f"Erreur KPIs automation {sfmc_id}: {e}")
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)
