"""
Tâches Celery de synchronisation — fetche les données SFMC et les stocke dans les DEs.

Tâches :
    sync_automations   : fetche toutes les automations + historique d'exécution
    sync_journeys      : fetche tous les journeys + historique d'exécution
    sync_all           : lance les deux en parallèle
"""
import uuid
import logging
from datetime import datetime, timezone
from celery import shared_task

from apps.sfmc.rest_api   import (
    get_automations, get_automation_detail, get_automation_schedule,
    get_journeys, get_journey_detail,
)
from apps.sfmc.data_extensions import write_de, read_de

logger = logging.getLogger(__name__)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_status(sfmc_status) -> str:
    """Normalise le statut SFMC vers success | error | skipped | running."""
    mapping = {
        1:  'running',
        2:  'success',  # Scheduled
        4:  'success',
        6:  'error',
        7:  'success',
        8:  'skipped',
        16: 'running',
        'Running':   'running',
        'Scheduled': 'success',
        'Error':     'error',
        'Stopped':   'skipped',
        'Paused':    'skipped',
        'Building':  'running',
        'Ready':     'success',
        'Active':    'success',
        'Draft':     'skipped',
    }
    return mapping.get(sfmc_status, str(sfmc_status).lower() if sfmc_status else 'unknown')


def _write_sync_log(source: str, fetched: int, inserted: int,
                    skipped: int, status: str, error: str = None):
    """Écrit un enregistrement dans SyncLog."""
    write_de('sync_log', [{
        'id_sync':          str(uuid.uuid4()),
        'source':           source,
        'synced_from':      _now(),
        'synced_to':        _now(),
        'records_fetched':  fetched,
        'records_inserted': inserted,
        'records_skipped':  skipped,
        'status':           status,
        'error_message':    error or '',
        'executed_at':      _now(),
    }])


# ─── Sync Automations ─────────────────────────────────────────────────────────

@shared_task(name='apps.tasks.sync.sync_automations')
def sync_automations() -> dict:
    """
    Fetche toutes les automations SFMC et stocke dans ExecutionLog.
    Planifié : toutes les heures.
    """
    logger.info('Sync automations SFMC...')

    fetched  = 0
    inserted = 0
    skipped  = 0
    error    = None

    try:
        automations = get_automations()
        fetched = len(automations)
        logger.info(f'{fetched} automations récupérées depuis SFMC.')

        # IDs déjà dans ExecutionLog pour éviter les doublons
        existing = {
            row.get('sfmc_instance_id')
            for row in read_de('execution_log', filters={'component_type': 'automation'}, max_rows=5000)
        }

        rows = []
        for auto in automations:
            sfmc_id   = auto.get('id') or auto.get('programId', '')
            sfmc_key  = auto.get('key', '')
            name      = auto.get('name', '')
            status_id = auto.get('statusId') or auto.get('status')

            # Récupère le détail pour avoir les steps
            try:
                detail = get_automation_detail(sfmc_id)
            except Exception:
                detail = auto

            # Récupère le schedule
            try:
                schedule = get_automation_schedule(sfmc_id)
            except Exception:
                schedule = None

            log_id = f"{sfmc_id}_latest"

            if log_id in existing:
                skipped += 1
                continue

            row = {
                'id_log':           str(uuid.uuid4()),
                'sfmc_instance_id': log_id,
                'component_type':   'automation',
                'component_id':     sfmc_id,
                'component_name':   name,
                'activity_id':      sfmc_key,
                'activity_name':    name,
                'step_id':          str(len(detail.get('steps', []))),
                'status':           _parse_status(status_id),
                'triggered_by':     _get_trigger_type(schedule),
                'start_time':       detail.get('createdDate') or _now(),
                'end_time':         detail.get('modifiedDate') or _now(),
                'duration_seconds': 0.0,
                'error_code':       '',
                'error_message':    '',
            }
            rows.append(row)

        if rows:
            write_de('execution_log', rows)
            inserted = len(rows)

        _write_sync_log('automations', fetched, inserted, skipped, 'success')
        logger.info(f'Sync automations : {inserted} insérées, {skipped} ignorées.')

    except Exception as e:
        error = str(e)
        logger.error(f'Erreur sync automations : {e}')
        _write_sync_log('automations', fetched, inserted, skipped, 'error', error)

    return {'fetched': fetched, 'inserted': inserted, 'skipped': skipped, 'error': error}


def _get_trigger_type(schedule: dict | None) -> str:
    """Détermine le type de déclenchement depuis le schedule."""
    if not schedule:
        return 'manual'
    if schedule.get('scheduleState') == 'Active':
        return 'scheduled'
    return 'manual'


# ─── Sync Journeys ────────────────────────────────────────────────────────────

@shared_task(name='apps.tasks.sync.sync_journeys')
def sync_journeys() -> dict:
    """
    Fetche tous les journeys SFMC et stocke dans ExecutionLog.
    Planifié : toutes les heures.
    """
    logger.info('Sync journeys SFMC...')

    fetched  = 0
    inserted = 0
    skipped  = 0
    error    = None

    try:
        journeys = get_journeys()
        fetched  = len(journeys)
        logger.info(f'{fetched} journeys récupérés depuis SFMC.')

        existing = {
            row.get('sfmc_instance_id')
            for row in read_de('execution_log', filters={'component_type': 'journey'}, max_rows=5000)
        }

        rows = []
        for journey in journeys:
            sfmc_id = journey.get('id', '')
            name    = journey.get('name', '')
            status  = journey.get('status', '')

            log_id = f"{sfmc_id}_latest"

            if log_id in existing:
                skipped += 1
                continue

            # Récupère le détail
            try:
                detail = get_journey_detail(sfmc_id)
            except Exception:
                detail = journey

            row = {
                'id_log':           str(uuid.uuid4()),
                'sfmc_instance_id': log_id,
                'component_type':   'journey',
                'component_id':     sfmc_id,
                'component_name':   name,
                'activity_id':      journey.get('key', ''),
                'activity_name':    name,
                'step_id':          str(len(detail.get('activities', []))),
                'status':           _parse_status(status),
                'triggered_by':     'api',
                'start_time':       detail.get('createdDate') or _now(),
                'end_time':         detail.get('modifiedDate') or _now(),
                'duration_seconds': 0.0,
                'error_code':       '',
                'error_message':    '',
            }
            rows.append(row)

        if rows:
            write_de('execution_log', rows)
            inserted = len(rows)

        _write_sync_log('journeys', fetched, inserted, skipped, 'success')
        logger.info(f'Sync journeys : {inserted} insérées, {skipped} ignorées.')

    except Exception as e:
        error = str(e)
        logger.error(f'Erreur sync journeys : {e}')
        _write_sync_log('journeys', fetched, inserted, skipped, 'error', error)

    return {'fetched': fetched, 'inserted': inserted, 'skipped': skipped, 'error': error}


# ─── Sync All ─────────────────────────────────────────────────────────────────

@shared_task(name='apps.tasks.sync.sync_all')
def sync_all() -> dict:
    """Lance la sync complète : automations + journeys."""
    logger.info('Sync complète SFMC (automations + journeys)...')
    r1 = sync_automations()
    r2 = sync_journeys()
    return {
        'automations': r1,
        'journeys':    r2,
    }
