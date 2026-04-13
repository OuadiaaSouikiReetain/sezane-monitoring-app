"""
Interface de base pour tous les notifieurs.
Chaque canal (Slack, email, webhook) implémente cette interface.
"""
from abc import ABC, abstractmethod


class BaseNotifier(ABC):
    """
    Contrat commun pour tous les canaux de notification.
    Permet d'ajouter un nouveau canal sans modifier le dispatcher.
    """

    @abstractmethod
    def send(self, anomaly: dict, channel_config: dict) -> bool:
        """
        Envoie une notification.
        anomaly       : dict de l'anomalie depuis Anomaly_DE
        channel_config: dict de config depuis NotificationChannel_DE (JSON parsé)
        Retourne True si envoi réussi, False sinon.
        """
        pass

    def _build_message(self, anomaly: dict) -> str:
        """Message texte standard à partir d'une anomalie."""
        severity_emoji = {
            'low':      'ℹ️',
            'medium':   '⚠️',
            'high':     '🔶',
            'critical': '🔴',
        }
        emoji = severity_emoji.get(anomaly.get('severity', 'medium'), '⚠️')

        return (
            f"{emoji} ALERTE MONITORING — {anomaly.get('severity', '').upper()}\n"
            f"Composant : {anomaly.get('component_name', anomaly.get('component_id'))}\n"
            f"Problème  : {anomaly.get('description')}\n"
            f"Détecté   : {anomaly.get('detected_at')}"
        )
