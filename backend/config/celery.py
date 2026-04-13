"""
Configuration Celery — tâches planifiées automatiques.
"""
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

app = Celery('monitoring')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# ─── Planning des tâches automatiques ────────────────────────────────────────
app.conf.beat_schedule = {

    # Évalue toutes les règles de monitoring toutes les 30 minutes
    'evaluate-monitoring-rules': {
        'task':     'apps.tasks.monitoring.evaluate_all_rules',
        'schedule': crontab(minute='*/30'),
    },

    # Vérifie les runs manquants toutes les heures (pile)
    'check-missing-runs': {
        'task':     'apps.tasks.monitoring.check_missing_runs',
        'schedule': crontab(minute=0, hour='*'),
    },

    # Calcule les KPIs complexes toutes les heures (à H+5min)
    'calculate-complex-kpis': {
        'task':     'apps.tasks.monitoring.calculate_complex_kpis',
        'schedule': crontab(minute=5, hour='*'),
    },

    # Retry des alertes échouées toutes les 15 minutes
    'retry-failed-alerts': {
        'task':     'apps.tasks.alerts.retry_failed_alerts',
        'schedule': crontab(minute='*/15'),
    },
}
