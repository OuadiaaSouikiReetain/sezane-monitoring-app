"""
Endpoints Journeys — proxy sécurisé vers SFMC.
KPIs calculés directement depuis l'API SFMC REST (sans Celery, sans DE).
"""
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.sfmc.rest_api import (
    get_journeys_with_kpis,
    get_journey_detail,
)
from apps.sfmc.data_extensions import read_de
from apps.sfmc.tracking_api import get_journey_email_kpis

logger = logging.getLogger(__name__)


class JourneyListView(APIView):
    """
    GET /api/journeys/
    Retourne tous les journeys SFMC avec leurs KPIs calculés en live.
    Query params : status (Published | Draft | Stopped | Paused)
    """
    def get(self, request):
        status_filter = request.query_params.get('status')
        try:
            journeys = get_journeys_with_kpis(status=status_filter)
            return Response({'items': journeys, 'count': len(journeys)})
        except Exception as e:
            logger.error(f"Erreur liste journeys: {e}")
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)


class JourneyDetailView(APIView):
    """
    GET /api/journeys/:id/
    Retourne le détail complet d'un journey avec KPIs.
    """
    def get(self, request, sfmc_id: str):
        try:
            detail = get_journey_detail(sfmc_id)
            stats  = detail.get('stats', {})

            from apps.sfmc.rest_api import _compute_journey_kpis
            kpis = _compute_journey_kpis(detail, stats, detail.get('activities', []))

            return Response({**detail, 'kpis': kpis})
        except Exception as e:
            logger.error(f"Erreur détail journey {sfmc_id}: {e}")
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)


class JourneyExecutionsView(APIView):
    """
    GET /api/journeys/:id/executions/
    Historique des exécutions depuis ExecutionLog DE.
    """
    def get(self, request, sfmc_id: str):
        limit = int(request.query_params.get('limit', 20))
        try:
            executions = read_de('execution_log', filters={
                'component_id':   sfmc_id,
                'component_type': 'journey',
            }, max_rows=limit)
            return Response({'items': executions, 'count': len(executions)})
        except Exception as e:
            logger.error(f"Erreur executions journey {sfmc_id}: {e}")
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)


class JourneyKpisView(APIView):
    """
    GET /api/journeys/:id/kpis/
    KPIs live depuis SFMC REST API + historiques depuis DE si disponibles.
    """
    def get(self, request, sfmc_id: str):
        try:
            detail = get_journey_detail(sfmc_id)
            stats  = detail.get('stats', {})

            from apps.sfmc.rest_api import _compute_journey_kpis
            live_kpis = _compute_journey_kpis(detail, stats, detail.get('activities', []))

            # KPIs historiques depuis DE si disponibles
            kpi_values = read_de('kpi_value', filters={
                'component_id':   sfmc_id,
                'component_type': 'journey',
            }, max_rows=100)

            # KPIs email depuis SFMC tracking (triggered send keys)
            days_back  = int(request.query_params.get('days', 30))
            email_kpis = get_journey_email_kpis(detail, days_back=days_back)

            return Response({
                'component_id': sfmc_id,
                'name':         detail.get('name', ''),
                'status':       detail.get('status', ''),
                'live_kpis':    live_kpis,
                'kpi_values':   kpi_values,
                'email_kpis':   email_kpis,
                'has_history':  len(kpi_values) > 0,
            })
        except Exception as e:
            logger.error(f"Erreur KPIs journey {sfmc_id}: {e}")
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)
