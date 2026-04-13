"""
Endpoints KPIs — calcul et lecture des métriques.
"""
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.sfmc.data_extensions import read_de
from apps.kpis.calculators import reliability, performance, availability

logger = logging.getLogger(__name__)


class KpiOverviewView(APIView):
    """
    GET /api/kpis/overview/
    KPIs globaux de toute l'instance SFMC.
    """
    def get(self, request):
        executions = read_de('execution_log', max_rows=500)

        auto_execs    = [e for e in executions if e.get('component_type') == 'automation']
        journey_execs = [e for e in executions if e.get('component_type') == 'journey']

        return Response({
            'automations': {
                'success_rate':          reliability.success_rate(auto_execs),
                'error_rate':            reliability.error_rate(auto_execs),
                'avg_duration_seconds':  performance.avg_duration(auto_execs),
                'consecutive_failures':  reliability.consecutive_failures(auto_execs),
                'total_runs':            len(auto_execs),
            },
            'journeys': {
                'success_rate':         reliability.success_rate(journey_execs),
                'avg_duration_seconds': performance.avg_duration(journey_execs),
                'total_runs':           len(journey_execs),
            },
        })


class KpiAutomationView(APIView):
    """
    GET /api/kpis/automations/:id/
    KPIs complets pour une automation spécifique.
    """
    def get(self, request, sfmc_id: str):
        executions = read_de('execution_log', filters={
            'component_id':   sfmc_id,
            'component_type': 'automation',
        }, max_rows=100)

        if not executions:
            return Response({'error': 'Aucune donnée trouvée'}, status=status.HTTP_404_NOT_FOUND)

        recent    = executions[:30]
        reference = executions[30:60]

        return Response({
            'component_id': sfmc_id,
            'reliability': {
                'success_rate':         reliability.success_rate(recent),
                'error_rate':           reliability.error_rate(recent),
                'error_count':          reliability.error_count(recent),
                'consecutive_failures': reliability.consecutive_failures(recent),
                'time_since_last_success_hours': reliability.time_since_last_success(recent),
            },
            'performance': {
                'avg_duration_seconds': performance.avg_duration(recent),
                'max_duration_seconds': performance.max_duration(recent),
                'p95_duration_seconds': performance.p95_duration(recent),
                'duration_drift_pct':   performance.duration_drift(recent, reference),
            },
            'availability': {
                'mtbf_hours': availability.mtbf(recent),
                'mttr_hours': availability.mttr(recent),
                'health_score': availability.health_score(
                    success_rate=reliability.success_rate(recent),
                    on_time_rate=reliability.on_time_rate(recent),
                    sla_compliance=1.0,
                ),
            },
            'total_runs_analyzed': len(executions),
        })


class KpiJourneyView(APIView):
    """
    GET /api/kpis/journeys/:id/
    KPIs complets pour un journey.
    """
    def get(self, request, sfmc_id: str):
        kpi_values = read_de('kpi_value', filters={
            'component_id':   sfmc_id,
            'component_type': 'journey',
        }, max_rows=100)

        return Response({
            'component_id': sfmc_id,
            'kpi_values':   kpi_values,
            'count':        len(kpi_values),
        })
