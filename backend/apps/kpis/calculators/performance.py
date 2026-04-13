"""
KPIs de performance — durées, tendances, SLA.
Calculés à partir de ExecutionLog_DE.
"""
import statistics


def avg_duration(executions: list[dict]) -> float | None:
    """Durée moyenne des runs en secondes."""
    durations = _get_durations(executions)
    return round(statistics.mean(durations), 2) if durations else None


def max_duration(executions: list[dict]) -> float | None:
    """Durée maximale observée."""
    durations = _get_durations(executions)
    return max(durations) if durations else None


def min_duration(executions: list[dict]) -> float | None:
    """Durée minimale observée."""
    durations = _get_durations(executions)
    return min(durations) if durations else None


def p95_duration(executions: list[dict]) -> float | None:
    """
    95e percentile des durées.
    Plus robuste que la moyenne pour définir un SLA :
    "95% des runs finissent en moins de X secondes".
    """
    durations = _get_durations(executions)
    if not durations:
        return None
    sorted_d = sorted(durations)
    idx = int(len(sorted_d) * 0.95)
    return sorted_d[min(idx, len(sorted_d) - 1)]


def duration_drift(recent: list[dict], reference: list[dict]) -> float | None:
    """
    Dérive de durée : différence entre la durée moyenne récente
    et la durée moyenne de référence, en %.
    Positif = les runs prennent plus de temps (dégradation).
    """
    recent_avg    = avg_duration(recent)
    reference_avg = avg_duration(reference)

    if recent_avg is None or reference_avg is None or reference_avg == 0:
        return None

    return round((recent_avg - reference_avg) / reference_avg * 100, 2)


def sla_compliance_rate(executions: list[dict], max_duration_seconds: float) -> float:
    """
    % de runs qui respectent la durée max configurée (SLA).
    Ex: 0.92 = 92% des runs finissent en moins de max_duration_seconds.
    """
    durations = _get_durations(executions)
    if not durations:
        return 1.0
    compliant = sum(1 for d in durations if d <= max_duration_seconds)
    return round(compliant / len(durations), 4)


def _get_durations(executions: list[dict]) -> list[float]:
    """Extrait les durées valides des executions."""
    return [
        float(e['duration_seconds'])
        for e in executions
        if e.get('duration_seconds') is not None
        and e.get('status') in ('success', 'error')
    ]
