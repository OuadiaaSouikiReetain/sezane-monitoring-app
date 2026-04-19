"""
Appels à l'API REST SFMC — Automations, Journeys, Triggered Sends.
Toutes les fonctions retournent des dicts Python bruts.
"""
import logging
from .client import sfmc_get, sfmc_get_all_pages

logger = logging.getLogger(__name__)


# ─── Automations ──────────────────────────────────────────────────────────────

def get_automations(search: str = None) -> list[dict]:
    """Liste toutes les automations de l'instance."""
    params = {'$pageSize': 500}
    if search:
        params['$filter'] = f"name like '%{search}%'"
    return sfmc_get_all_pages('/automation/v1/automations', params)


def get_automation_detail(sfmc_id: str) -> dict:
    """Détail complet d'une automation avec ses steps et activités."""
    return sfmc_get(f'/automation/v1/automations/{sfmc_id}')


def get_automation_schedule(sfmc_id: str) -> dict | None:
    """Schedule d'une automation spécifique."""
    try:
        return sfmc_get(f'/automation/v1/automations/{sfmc_id}/schedule')
    except Exception:
        return None


def get_automations_with_kpis(search: str = None) -> list[dict]:
    """
    Retourne toutes les automations enrichies avec leurs KPIs
    calculés directement depuis l'API SFMC (sans DE).
    """
    automations = get_automations(search=search)
    result = []

    for auto in automations:
        sfmc_id   = auto.get('id') or auto.get('programId', '')
        status_id = auto.get('statusId', 0)

        # Récupère le schedule pour chaque automation
        schedule = get_automation_schedule(sfmc_id)

        kpis = _compute_automation_kpis(auto, schedule)

        result.append({
            'id':            sfmc_id,
            'name':          auto.get('name', ''),
            'description':   auto.get('description', ''),
            'status':        _normalize_automation_status(status_id),
            'statusId':      status_id,
            'key':           auto.get('key', ''),
            'steps':         auto.get('steps', []),
            'schedule':      schedule,
            'kpis':          kpis,
        })

    return result


def _normalize_automation_status(status_id) -> str:
    """Convertit le statusId SFMC en label lisible."""
    mapping = {
        0:  'inactive',
        1:  'active',
        2:  'scheduled',
        3:  'running',
        4:  'paused',
        6:  'error',
        7:  'building',
        8:  'inactive',
        16: 'running',
    }
    return mapping.get(int(status_id) if status_id else 0, 'unknown')


def _compute_automation_kpis(auto: dict, schedule: dict | None) -> dict:
    """Calcule les KPIs d'une automation depuis les données SFMC REST API."""
    status_id   = auto.get('statusId', 0)
    steps       = auto.get('steps', [])
    is_active   = int(status_id) in (1, 2, 3) if status_id else False
    is_error    = int(status_id) == 6 if status_id else False
    is_running  = int(status_id) in (3, 16) if status_id else False
    is_scheduled = schedule and schedule.get('scheduleState') == 'Active'

    # Compte les activités dans les steps
    total_activities = sum(
        len(step.get('activities', [])) for step in steps
    )

    return {
        'is_active':        is_active,
        'is_error':         is_error,
        'is_running':       is_running,
        'is_scheduled':     is_scheduled,
        'total_steps':      len(steps),
        'total_activities': total_activities,
        'schedule_type':    schedule.get('typeId') if schedule else None,
        'next_run':         schedule.get('startDate') if schedule else None,
    }


# ─── Journeys ─────────────────────────────────────────────────────────────────

def get_journeys(status: str = None) -> list[dict]:
    """
    Liste tous les journeys.
    status : 'Draft' | 'Published' | 'Stopped' | 'Paused'
    """
    params = {'extras': 'all', '$pageSize': 500}
    if status:
        params['status'] = status
    return sfmc_get_all_pages('/interaction/v1/interactions', params)


def get_journey_detail(sfmc_id: str) -> dict:
    """Détail complet d'un journey avec ses activités."""
    return sfmc_get(f'/interaction/v1/interactions/{sfmc_id}', {'extras': 'all'})


def get_journeys_with_kpis(status: str = None) -> list[dict]:
    """
    Retourne tous les journeys enrichis avec leurs KPIs
    calculés directement depuis l'API SFMC (sans DE).
    """
    journeys = get_journeys(status=status)
    result   = []

    for journey in journeys:
        sfmc_id    = journey.get('id', '')
        jstatus    = journey.get('status', '')
        stats      = journey.get('stats', {})
        activities = journey.get('activities', [])

        kpis = _compute_journey_kpis(journey, stats, activities)

        result.append({
            'id':          sfmc_id,
            'name':        journey.get('name', ''),
            'description': journey.get('description', ''),
            'status':      jstatus,
            'version':     journey.get('version', 1),
            'key':         journey.get('key', ''),
            'createdDate': journey.get('createdDate'),
            'modifiedDate':journey.get('modifiedDate'),
            'activities':  activities,
            'kpis':        kpis,
        })

    return result


def _compute_journey_kpis(journey: dict, stats: dict, activities: list) -> dict:
    """Calcule les KPIs d'un journey depuis les données SFMC REST API."""
    status              = journey.get('status', '')
    current_population  = stats.get('currentPopulation', 0) or 0
    cumulative          = stats.get('cumulativePopulation', 0) or 0
    met_goal            = stats.get('metGoal', 0) or 0
    met_goal_pct        = stats.get('metGoalPercentage', 0) or 0

    # Compte par type d'activité
    activity_types = {}
    for act in activities:
        act_type = act.get('type', 'unknown')
        activity_types[act_type] = activity_types.get(act_type, 0) + 1

    return {
        'is_active':            status == 'Published',
        'is_stopped':           status == 'Stopped',
        'is_draft':             status == 'Draft',
        'is_paused':            status == 'Paused',
        'current_population':   current_population,
        'cumulative_population':cumulative,
        'met_goal':             met_goal,
        'met_goal_percentage':  met_goal_pct,
        'total_activities':     len(activities),
        'activity_types':       activity_types,
    }


# ─── Triggered Sends ──────────────────────────────────────────────────────────

def get_triggered_sends() -> list[dict]:
    """Liste les Triggered Send Definitions."""
    return sfmc_get_all_pages('/messaging/v1/email/definitions')


def get_triggered_send_detail(sfmc_id: str) -> dict:
    """Détail d'un Triggered Send."""
    return sfmc_get(f'/messaging/v1/email/definitions/{sfmc_id}')
