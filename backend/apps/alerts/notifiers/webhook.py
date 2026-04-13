"""
Notifieur Webhook — appelle un endpoint HTTP externe avec les données de l'anomalie.
"""
import logging
import requests
from .base import BaseNotifier

logger = logging.getLogger(__name__)


class WebhookNotifier(BaseNotifier):
    """
    Appelle un webhook externe (POST JSON).
    config attendu : { "url": "https://...", "secret": "optional_header_secret" }
    """

    def send(self, anomaly: dict, channel_config: dict) -> bool:
        url = channel_config.get('url')
        if not url:
            logger.error('WebhookNotifier : url manquante dans la config.')
            return False

        headers = {'Content-Type': 'application/json'}
        if channel_config.get('secret'):
            headers['X-Monitoring-Secret'] = channel_config['secret']

        try:
            resp = requests.post(url, json=anomaly, headers=headers, timeout=10)
            resp.raise_for_status()
            logger.info(f"Webhook OK pour anomalie {anomaly.get('id_anomaly')}")
            return True
        except requests.RequestException as e:
            logger.error(f"Erreur webhook : {e}")
            return False
