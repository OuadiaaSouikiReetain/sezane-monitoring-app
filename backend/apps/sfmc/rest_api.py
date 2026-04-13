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
    params = {}
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


# ─── Journeys ─────────────────────────────────────────────────────────────────

def get_journeys(status: str = None) -> list[dict]:
    """
    Liste tous les journeys.
    status : 'Draft' | 'Published' | 'Stopped' | 'Paused'
    """
    params = {'extras': 'all'}
    if status:
        params['status'] = status
    return sfmc_get_all_pages('/interaction/v1/interactions', params)


def get_journey_detail(sfmc_id: str) -> dict:
    """Détail complet d'un journey avec ses activités."""
    return sfmc_get(f'/interaction/v1/interactions/{sfmc_id}', {'extras': 'all'})


# ─── Triggered Sends ──────────────────────────────────────────────────────────

def get_triggered_sends() -> list[dict]:
    """Liste les Triggered Send Definitions."""
    return sfmc_get_all_pages('/messaging/v1/email/definitions')


def get_triggered_send_detail(sfmc_id: str) -> dict:
    """Détail d'un Triggered Send."""
    return sfmc_get(f'/messaging/v1/email/definitions/{sfmc_id}')
