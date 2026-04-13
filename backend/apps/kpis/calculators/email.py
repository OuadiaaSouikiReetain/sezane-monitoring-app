"""
KPIs email — open rate, click rate, bounce, désabonnements.
Calculés à partir des KPI_Value_DE alimentées par les Data Views SFMC.
"""


def open_rate(sent: int, opens: int) -> float:
    """% d'emails ouverts parmi les emails délivrés."""
    return round(opens / sent, 4) if sent > 0 else 0.0


def click_rate(sent: int, clicks: int) -> float:
    """% d'emails cliqués parmi les emails délivrés."""
    return round(clicks / sent, 4) if sent > 0 else 0.0


def ctor(opens: int, clicks: int) -> float:
    """
    Click-to-Open Rate — % de clics parmi les emails ouverts.
    Mesure la qualité du contenu une fois l'email ouvert.
    """
    return round(clicks / opens, 4) if opens > 0 else 0.0


def bounce_rate(sent: int, bounces: int) -> float:
    """% de rebonds (hard + soft) parmi les envois."""
    return round(bounces / sent, 4) if sent > 0 else 0.0


def hard_bounce_rate(sent: int, hard_bounces: int) -> float:
    """% de rebonds permanents — adresses invalides."""
    return round(hard_bounces / sent, 4) if sent > 0 else 0.0


def soft_bounce_rate(sent: int, soft_bounces: int) -> float:
    """% de rebonds temporaires — boîtes pleines, serveurs indisponibles."""
    return round(soft_bounces / sent, 4) if sent > 0 else 0.0


def unsubscribe_rate(sent: int, unsubs: int) -> float:
    """% de désabonnements. Seuil critique : > 0.5%"""
    return round(unsubs / sent, 4) if sent > 0 else 0.0


def deliverability_rate(sent: int, bounces: int) -> float:
    """% d'emails effectivement délivrés."""
    delivered = sent - bounces
    return round(delivered / sent, 4) if sent > 0 else 0.0


def email_health_score(
    open_r: float,
    click_r: float,
    deliverability: float,
    unsub_r: float,
) -> float:
    """
    Score de santé email composite entre 0.0 et 1.0.
    Pénalise les désabonnements élevés.
    """
    score = (
        deliverability * 0.35 +
        open_r         * 0.30 +
        click_r        * 0.25 +
        (1 - unsub_r)  * 0.10
    )
    return round(max(0.0, min(1.0, score)), 4)
