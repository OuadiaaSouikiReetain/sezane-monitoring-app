"""
Notifieur Slack — envoie un message via webhook Slack.
"""
import logging
import requests
from .base import BaseNotifier

logger = logging.getLogger(__name__)

SEVERITY_COLORS = {
    'low':      '#36a64f',  # vert
    'medium':   '#ffcc00',  # jaune
    'high':     '#ff6600',  # orange
    'critical': '#cc0000',  # rouge
}


class SlackNotifier(BaseNotifier):
    """
    Envoie une alerte formatée dans un canal Slack via webhook.
    config attendu : { "webhook_url": "https://hooks.slack.com/..." }
    """

    def send(self, anomaly: dict, channel_config: dict) -> bool:
        webhook_url = channel_config.get('webhook_url')
        if not webhook_url:
            logger.error('SlackNotifier : webhook_url manquant dans la config.')
            return False

        severity = anomaly.get('severity', 'medium')
        payload = {
            'attachments': [{
                'color':  SEVERITY_COLORS.get(severity, '#ffcc00'),
                'title':  f"🔔 Alerte Monitoring — {severity.upper()}",
                'fields': [
                    {
                        'title': 'Composant',
                        'value': anomaly.get('component_name', anomaly.get('component_id', '—')),
                        'short': True,
                    },
                    {
                        'title': 'Type',
                        'value': anomaly.get('component_type', '—'),
                        'short': True,
                    },
                    {
                        'title': 'Problème',
                        'value': anomaly.get('description', '—'),
                        'short': False,
                    },
                    {
                        'title': 'Valeur déclenchante',
                        'value': str(anomaly.get('trigger_value', '—')),
                        'short': True,
                    },
                    {
                        'title': 'Valeur attendue',
                        'value': str(anomaly.get('expected_value', '—')),
                        'short': True,
                    },
                ],
                'footer': 'SFMC Monitoring App',
                'ts':     None,
            }]
        }

        try:
            resp = requests.post(webhook_url, json=payload, timeout=10)
            resp.raise_for_status()
            logger.info(f"Slack OK pour anomalie {anomaly.get('id_anomaly')}")
            return True
        except requests.RequestException as e:
            logger.error(f"Erreur Slack : {e}")
            return False
