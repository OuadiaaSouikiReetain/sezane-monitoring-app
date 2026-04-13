"""
Moteur d'évaluation des règles de monitoring.
Lit les KPI_Value_DE, compare aux règles, génère des Anomaly.
"""
import uuid
import logging
from datetime import datetime, timezone, timedelta

from apps.sfmc.data_extensions import read_de, write_de

logger = logging.getLogger(__name__)


class RuleEngine:
    """
    Évalue toutes les règles de monitoring actives contre les KPI récents.
    Crée des anomalies dans Anomaly_DE si une règle est violée.
    """

    def evaluate_all(self) -> list[dict]:
        """Point d'entrée principal — appelé par Celery toutes les 30 min."""
        rules    = read_de('monitoring_rule', filters={'active': 'true'})
        anomalies_created = []

        for rule in rules:
            try:
                anomaly = self._evaluate_rule(rule)
                if anomaly:
                    anomalies_created.append(anomaly)
            except Exception as e:
                logger.error(f"Erreur évaluation règle {rule.get('id_rule')}: {e}")

        if anomalies_created:
            write_de('anomaly', anomalies_created)
            logger.info(f"{len(anomalies_created)} anomalie(s) créée(s).")

        return anomalies_created

    def _evaluate_rule(self, rule: dict) -> dict | None:
        """Évalue une règle individuelle. Retourne une anomalie ou None."""
        condition_type = rule.get('condition_type')

        if condition_type == 'threshold':
            return self._check_threshold(rule)
        elif condition_type == 'comparison':
            return self._check_comparison(rule)
        elif condition_type == 'missing_run':
            return self._check_missing_run(rule)
        else:
            logger.warning(f"Type de condition inconnu: {condition_type}")
            return None

    def _check_threshold(self, rule: dict) -> dict | None:
        """
        Vérifie si la valeur actuelle d'un KPI dépasse un seuil fixe.
        Ex: taux_erreur > 0.10
        """
        kpi_id    = rule.get('kpi_id')
        threshold = float(rule.get('threshold_value', 0))
        component_id   = rule.get('component_id')
        component_type = rule.get('component_type', 'automation')

        filters = {'kpi_id': kpi_id, 'granularity': 'daily'}
        if component_id:
            filters['component_id'] = component_id
        if component_type != 'all':
            filters['component_type'] = component_type

        kpi_values = read_de('kpi_value', filters=filters, max_rows=1)
        if not kpi_values:
            return None

        latest_value = float(kpi_values[0].get('value', 0))

        # La règle est violée si la valeur dépasse le seuil
        if latest_value > threshold:
            return self._build_anomaly(
                rule=rule,
                trigger_value=latest_value,
                expected_value=threshold,
                component_id=kpi_values[0].get('component_id', component_id),
                component_type=component_type,
                description=(
                    f"Valeur actuelle {latest_value:.2%} dépasse le seuil "
                    f"configuré de {threshold:.2%}"
                ),
            )
        return None

    def _check_comparison(self, rule: dict) -> dict | None:
        """
        Vérifie si un KPI a dévié de plus de X% par rapport à une période passée.
        Ex: taux_succès baisse de plus de 20% vs semaine dernière.
        """
        kpi_id      = rule.get('kpi_id')
        delta_limit = float(rule.get('comparison_delta', -20)) / 100
        period      = rule.get('comparison_period', 'vs_last_week')
        component_id = rule.get('component_id')

        # Valeur actuelle (7 derniers jours)
        current_values = read_de('kpi_value', filters={
            'kpi_id':       kpi_id,
            'component_id': component_id,
            'granularity':  'daily',
        }, max_rows=7)

        if not current_values:
            return None

        current_avg = sum(float(v.get('value', 0)) for v in current_values) / len(current_values)

        # Valeur de référence (période précédente)
        reference_avg = self._get_reference_value(kpi_id, component_id, period)
        if reference_avg is None or reference_avg == 0:
            return None

        delta = (current_avg - reference_avg) / reference_avg

        if delta < delta_limit:
            return self._build_anomaly(
                rule=rule,
                trigger_value=current_avg,
                expected_value=reference_avg,
                component_id=component_id,
                component_type=rule.get('component_type', 'automation'),
                description=(
                    f"Valeur actuelle {current_avg:.2%} en baisse de "
                    f"{abs(delta):.1%} vs référence {reference_avg:.2%} "
                    f"({period})"
                ),
            )
        return None

    def _check_missing_run(self, rule: dict) -> dict | None:
        """
        Vérifie qu'une automation/journey a bien tourné dans la fenêtre attendue.
        Utilise MonitoringConfig.expected_schedule pour savoir quand elle devrait tourner.
        """
        component_id   = rule.get('component_id')
        component_type = rule.get('component_type', 'automation')

        if not component_id:
            return None

        # Récupère la config de monitoring pour cet élément
        configs = read_de('monitoring_config', filters={
            'component_id':   component_id,
            'component_type': component_type,
        }, max_rows=1)

        if not configs or not configs[0].get('expected_schedule'):
            return None

        # Vérifie le dernier run dans les 25 dernières heures (tolérance)
        executions = read_de('execution_log', filters={
            'component_id':   component_id,
            'component_type': component_type,
        }, max_rows=1)

        if not executions:
            return self._build_anomaly(
                rule=rule,
                trigger_value=0,
                expected_value=1,
                component_id=component_id,
                component_type=component_type,
                description=f"Aucun run trouvé pour {component_id} — run manquant détecté",
            )

        last_run_time = executions[0].get('start_time')
        if last_run_time:
            # Si le dernier run date de plus de 25h → run manquant
            last_run = datetime.fromisoformat(str(last_run_time).replace('Z', '+00:00'))
            if datetime.now(timezone.utc) - last_run > timedelta(hours=25):
                return self._build_anomaly(
                    rule=rule,
                    trigger_value=0,
                    expected_value=1,
                    component_id=component_id,
                    component_type=component_type,
                    description=(
                        f"Dernier run il y a plus de 25h "
                        f"({last_run.strftime('%d/%m %H:%M')}) — run manquant"
                    ),
                )
        return None

    def _get_reference_value(self, kpi_id: str, component_id: str, period: str) -> float | None:
        """Calcule la valeur de référence pour la période donnée."""
        values = read_de('kpi_value', filters={
            'kpi_id':       kpi_id,
            'component_id': component_id,
            'granularity':  'daily',
        }, max_rows=30)

        if len(values) < 14:
            return None

        # Prend les 7 jours précédents (jours 8-14)
        reference_slice = values[7:14]
        return sum(float(v.get('value', 0)) for v in reference_slice) / len(reference_slice)

    def _build_anomaly(
        self,
        rule: dict,
        trigger_value: float,
        expected_value: float,
        component_id: str,
        component_type: str,
        description: str,
    ) -> dict:
        """Construit le dict à insérer dans Anomaly_DE."""

        # Vérifie le cooldown — ne pas créer d'anomalie si une récente existe déjà
        cooldown = int(rule.get('cooldown_minutes', 60))
        recent = read_de('anomaly', filters={
            'monitoring_rule_id': rule.get('id_rule'),
            'component_id':       component_id,
            'status':             'open',
        }, max_rows=1)

        if recent:
            detected_at = recent[0].get('detected_at', '')
            if detected_at:
                try:
                    dt = datetime.fromisoformat(str(detected_at).replace('Z', '+00:00'))
                    if datetime.now(timezone.utc) - dt < timedelta(minutes=cooldown):
                        logger.debug(f"Cooldown actif pour règle {rule.get('id_rule')}")
                        return None
                except Exception:
                    pass

        severity_map = {
            'low':      0.25,
            'medium':   0.50,
            'high':     0.75,
            'critical': 1.00,
        }
        severity = rule.get('severity', 'medium')

        return {
            'id_anomaly':          str(uuid.uuid4()),
            'monitoring_rule_id':  rule.get('id_rule'),
            'component_type':      component_type,
            'component_id':        component_id,
            'component_name':      rule.get('component_name', component_id),
            'type':                rule.get('condition_type'),
            'description':         description,
            'severity':            severity,
            'trigger_value':       round(trigger_value, 4),
            'expected_value':      round(expected_value, 4),
            'status':              'open',
            'detected_at':         datetime.now(timezone.utc).isoformat(),
            'resolved_at':         None,
            'resolved_by':         None,
        }
