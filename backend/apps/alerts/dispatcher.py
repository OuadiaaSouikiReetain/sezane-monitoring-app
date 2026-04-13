"""
Dispatcher d'alertes — reçoit une anomalie, choisit les canaux, envoie les notifications.
"""
import uuid
import json
import logging
from datetime import datetime, timezone

from apps.sfmc.data_extensions import read_de, write_de, update_de_row
from .notifiers.slack import SlackNotifier
from .notifiers.email_notifier import EmailNotifier
from .notifiers.webhook import WebhookNotifier

logger = logging.getLogger(__name__)

NOTIFIER_MAP = {
    'slack':   SlackNotifier(),
    'email':   EmailNotifier(),
    'webhook': WebhookNotifier(),
}


class AlertDispatcher:
    """
    Pour chaque nouvelle anomalie :
    1. Trouve les canaux de notification configurés pour la règle
    2. Envoie via chaque canal
    3. Écrit le résultat dans Alert_DE
    """

    def dispatch(self, anomaly: dict) -> list[dict]:
        """Dispatche une anomalie vers tous les canaux configurés."""
        rule_id = anomaly.get('monitoring_rule_id')

        # Récupère la règle pour trouver les canaux
        rules = read_de('monitoring_rule', filters={'id_rule': rule_id}, max_rows=1)
        if not rules:
            logger.warning(f"Règle {rule_id} introuvable pour l'anomalie {anomaly.get('id_anomaly')}")
            return []

        # Récupère tous les canaux actifs
        channels = read_de('notification_channel', filters={'active': 'true'})
        if not channels:
            logger.warning('Aucun canal de notification actif.')
            return []

        alerts_created = []
        for channel in channels:
            alert = self._send_to_channel(anomaly, channel)
            if alert:
                alerts_created.append(alert)

        if alerts_created:
            write_de('alert', alerts_created)

        return alerts_created

    def dispatch_all_pending(self) -> int:
        """
        Dispatche toutes les anomalies ouvertes sans alerte envoyée.
        Appelé par Celery.
        """
        anomalies = read_de('anomaly', filters={'status': 'open'})
        total_sent = 0

        for anomaly in anomalies:
            # Vérifie qu'aucune alerte n'existe déjà pour cette anomalie
            existing = read_de('alert', filters={'anomaly_id': anomaly.get('id_anomaly')}, max_rows=1)
            if not existing:
                alerts = self.dispatch(anomaly)
                total_sent += len(alerts)

        return total_sent

    def retry_failed(self) -> int:
        """Retry les alertes qui ont échoué (status = failed)."""
        failed_alerts = read_de('alert', filters={'status': 'failed'})
        retried = 0

        for alert in failed_alerts:
            if int(alert.get('retry_count', 0)) >= 3:
                continue  # Max 3 tentatives

            anomaly_id = alert.get('anomaly_id')
            anomalies = read_de('anomaly', filters={'id_anomaly': anomaly_id}, max_rows=1)
            if not anomalies:
                continue

            channel_id = alert.get('notification_channel_id')
            channels = read_de('notification_channel', filters={'id_channel': channel_id}, max_rows=1)
            if not channels:
                continue

            success = self._send_to_channel(anomalies[0], channels[0])
            if success:
                update_de_row('alert', 'id_alert', alert['id_alert'], {
                    'status':      'sent',
                    'retry_count': int(alert.get('retry_count', 0)) + 1,
                })
                retried += 1

        return retried

    def _send_to_channel(self, anomaly: dict, channel: dict) -> dict | None:
        """Envoie vers un canal et retourne le dict Alert."""
        channel_type = channel.get('type', '').lower()
        notifier = NOTIFIER_MAP.get(channel_type)

        if not notifier:
            logger.warning(f"Type de canal inconnu : {channel_type}")
            return None

        # Parse la config JSON du canal
        try:
            config = json.loads(channel.get('config_json', '{}'))
        except json.JSONDecodeError:
            config = {}

        success = notifier.send(anomaly, config)

        return {
            'id_alert':                str(uuid.uuid4()),
            'anomaly_id':              anomaly.get('id_anomaly'),
            'notification_channel_id': channel.get('id_channel'),
            'message':                 notifier._build_message(anomaly),
            'priority':                anomaly.get('severity', 'medium'),
            'status':                  'sent' if success else 'failed',
            'sent_at':                 datetime.now(timezone.utc).isoformat(),
            'acknowledged_at':         None,
            'acknowledged_by':         None,
            'retry_count':             0,
        }
