"""
Notifieur Email — envoie une alerte par email via Django send_mail.
"""
import logging
from django.core.mail import send_mail
from django.conf import settings
from .base import BaseNotifier

logger = logging.getLogger(__name__)


class EmailNotifier(BaseNotifier):
    """
    Envoie une alerte par email.
    config attendu : { "to": ["email1@company.com", "email2@company.com"] }
    """

    def send(self, anomaly: dict, channel_config: dict) -> bool:
        recipients = channel_config.get('to', [])
        if not recipients:
            logger.error('EmailNotifier : aucun destinataire dans la config.')
            return False

        subject = (
            f"[{anomaly.get('severity', 'MEDIUM').upper()}] "
            f"Alerte — {anomaly.get('component_name', anomaly.get('component_id'))}"
        )
        message = self._build_message(anomaly)

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.ALERT_FROM_EMAIL,
                recipient_list=recipients,
                fail_silently=False,
            )
            logger.info(f"Email envoyé pour anomalie {anomaly.get('id_anomaly')}")
            return True
        except Exception as e:
            logger.error(f"Erreur email : {e}")
            return False
