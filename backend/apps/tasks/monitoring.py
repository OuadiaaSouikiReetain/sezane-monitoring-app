"""
Tâches Celery de monitoring — tournent automatiquement selon le schedule.
"""
import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name='apps.tasks.monitoring.evaluate_all_rules')
def evaluate_all_rules():
    """
    Évalue toutes les règles de monitoring actives.
    Planifié : toutes les 30 minutes.
    """
    from apps.monitoring.rule_engine import RuleEngine
    from apps.alerts.dispatcher import AlertDispatcher

    logger.info('Celery : évaluation des règles de monitoring...')

    engine    = RuleEngine()
    anomalies = engine.evaluate_all()

    if anomalies:
        dispatcher = AlertDispatcher()
        for anomaly in anomalies:
            dispatcher.dispatch(anomaly)
        logger.info(f'{len(anomalies)} anomalie(s) créée(s) et dispatchée(s).')
    else:
        logger.info('Aucune anomalie détectée.')

    return {'anomalies_created': len(anomalies)}


@shared_task(name='apps.tasks.monitoring.check_missing_runs')
def check_missing_runs():
    """
    Vérifie que tous les éléments monitorés ont bien tourné dans leur fenêtre.
    Planifié : toutes les heures.
    """
    from apps.sfmc.data_extensions import read_de
    from apps.monitoring.rule_engine import RuleEngine

    logger.info('Celery : vérification des runs manquants...')

    # Récupère toutes les configs avec un schedule attendu
    configs = read_de('monitoring_config', filters={
        'monitored': 'true',
    })

    missing_rules = [
        {'condition_type': 'missing_run', 'component_id': c.get('component_id'),
         'component_type': c.get('component_type'), 'id_rule': 'missing_run_check',
         'cooldown_minutes': 60, 'severity': 'critical'}
        for c in configs if c.get('expected_schedule')
    ]

    engine = RuleEngine()
    anomalies = []
    for rule in missing_rules:
        anomaly = engine._check_missing_run(rule)
        if anomaly:
            anomalies.append(anomaly)

    logger.info(f'{len(anomalies)} run(s) manquant(s) détecté(s).')
    return {'missing_runs': len(anomalies)}


@shared_task(name='apps.tasks.monitoring.calculate_complex_kpis')
def calculate_complex_kpis():
    """
    Calcule les KPIs complexes (MTBF, MTTR, health_score) et les stocke dans KPI_Value_DE.
    Planifié : toutes les heures à H+5min.
    """
    from datetime import datetime, timezone
    import uuid
    from apps.sfmc.data_extensions import read_de, write_de
    from apps.kpis.calculators import reliability, performance, availability

    logger.info('Celery : calcul des KPIs complexes...')

    # Récupère tous les composants uniques dans ExecutionLog
    executions = read_de('execution_log', max_rows=2000)

    components = {}
    for e in executions:
        key = (e.get('component_id'), e.get('component_type'))
        if key not in components:
            components[key] = []
        components[key].append(e)

    kpi_rows = []
    now = datetime.now(timezone.utc).isoformat()

    for (component_id, component_type), execs in components.items():
        sr = reliability.success_rate(execs)
        hs = availability.health_score(
            success_rate=sr,
            on_time_rate=reliability.on_time_rate(execs),
            sla_compliance=1.0,
        )

        kpi_rows.extend([
            {
                'id_value':       str(uuid.uuid4()),
                'kpi_id':         'health_score',
                'component_type': component_type,
                'component_id':   component_id,
                'value':          hs,
                'source':         'calculated',
                'granularity':    'hourly',
                'timestamp':      now,
            },
            {
                'id_value':       str(uuid.uuid4()),
                'kpi_id':         'mtbf',
                'component_type': component_type,
                'component_id':   component_id,
                'value':          availability.mtbf(execs) or 0,
                'source':         'calculated',
                'granularity':    'hourly',
                'timestamp':      now,
            },
            {
                'id_value':       str(uuid.uuid4()),
                'kpi_id':         'mttr',
                'component_type': component_type,
                'component_id':   component_id,
                'value':          availability.mttr(execs) or 0,
                'source':         'calculated',
                'granularity':    'hourly',
                'timestamp':      now,
            },
        ])

    if kpi_rows:
        write_de('kpi_value', kpi_rows)

    logger.info(f'{len(kpi_rows)} valeurs KPI calculées.')
    return {'kpi_values_written': len(kpi_rows)}
