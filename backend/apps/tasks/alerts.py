"""
Tâches Celery liées aux alertes.
"""
import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name='apps.tasks.alerts.retry_failed_alerts')
def retry_failed_alerts():
    """
    Retry les alertes qui ont échoué lors du premier envoi.
    Planifié : toutes les 15 minutes.
    """
    from apps.alerts.dispatcher import AlertDispatcher

    logger.info('Celery : retry des alertes échouées...')
    dispatcher = AlertDispatcher()
    retried = dispatcher.retry_failed()
    logger.info(f'{retried} alerte(s) retentée(s).')
    return {'retried': retried}
