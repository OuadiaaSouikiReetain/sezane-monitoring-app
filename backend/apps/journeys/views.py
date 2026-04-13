"""
Endpoints Journeys — proxy sécurisé vers SFMC.
"""
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.sfmc.rest_api import get_journeys, get_journey_detail
from apps.sfmc.data_extensions import read_de

logger = logging.getLogger(__name__)


class JourneyListView(APIView):
    """
    GET /api/journeys/
    Query params : status (Published | Draft | Stopped | Paused)
    """
    def get(self, request):
        status_filter = request.query_params.get('status')
        try:
            journeys = get_journeys(status=status_filter)
            return Response({'items': journeys, 'count': len(journeys)})
        except Exception as e:
            logger.error(f"Erreur liste journeys: {e}")
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)


class JourneyDetailView(APIView):
    """GET /api/journeys/:id/"""
    def get(self, request, sfmc_id: str):
        try:
            detail = get_journey_detail(sfmc_id)
            return Response(detail)
        except Exception as e:
            logger.error(f"Erreur détail journey {sfmc_id}: {e}")
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)


class JourneyExecutionsView(APIView):
    """
    GET /api/journeys/:id/executions/
    Historique des exécutions depuis ExecutionLog_DE.
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
    KPIs email et flux depuis KPI_Value_DE.
    """
    def get(self, request, sfmc_id: str):
        granularity = request.query_params.get('granularity', 'daily')
        try:
            kpi_values = read_de('kpi_value', filters={
                'component_id':   sfmc_id,
                'component_type': 'journey',
                'granularity':    granularity,
            })
            return Response({'items': kpi_values, 'count': len(kpi_values)})
        except Exception as e:
            logger.error(f"Erreur KPIs journey {sfmc_id}: {e}")
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)
