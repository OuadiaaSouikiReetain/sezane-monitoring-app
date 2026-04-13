"""
KPIs de disponibilité — MTBF, MTTR, uptime.
Métriques avancées calculées sur l'historique ExecutionLog_DE.
"""
from datetime import datetime, timezone


def mtbf(executions: list[dict]) -> float | None:
    """
    Mean Time Between Failures (en heures).
    Temps moyen entre deux erreurs consécutives.
    Plus c'est élevé, mieux c'est (pannes rares).
    """
    errors = _sorted_by_time([e for e in executions if e.get('status') == 'error'])
    if len(errors) < 2:
        return None

    gaps = []
    for i in range(1, len(errors)):
        try:
            t1 = _parse_dt(errors[i - 1].get('start_time'))
            t2 = _parse_dt(errors[i].get('start_time'))
            if t1 and t2:
                gaps.append((t2 - t1).total_seconds() / 3600)
        except Exception:
            pass

    return round(sum(gaps) / len(gaps), 2) if gaps else None


def mttr(executions: list[dict]) -> float | None:
    """
    Mean Time To Recovery (en heures).
    Temps moyen entre une erreur et le prochain succès.
    Plus c'est faible, mieux c'est (récupération rapide).
    """
    sorted_execs = _sorted_by_time(executions)
    recovery_times = []

    i = 0
    while i < len(sorted_execs):
        if sorted_execs[i].get('status') == 'error':
            # Cherche le prochain succès
            for j in range(i + 1, len(sorted_execs)):
                if sorted_execs[j].get('status') == 'success':
                    t_error   = _parse_dt(sorted_execs[i].get('start_time'))
                    t_success = _parse_dt(sorted_execs[j].get('start_time'))
                    if t_error and t_success:
                        recovery_times.append((t_success - t_error).total_seconds() / 3600)
                    i = j
                    break
        i += 1

    return round(sum(recovery_times) / len(recovery_times), 2) if recovery_times else None


def availability_rate(executions: list[dict], expected_count: int) -> float:
    """
    Taux de disponibilité : runs réussis / runs attendus.
    Ex: 0.97 = l'automation a tourné correctement 97% du temps prévu.
    """
    if expected_count == 0:
        return 1.0
    successful = sum(1 for e in executions if e.get('status') == 'success')
    return round(min(successful / expected_count, 1.0), 4)


def health_score(
    success_rate: float,
    on_time_rate: float,
    sla_compliance: float,
    weights: dict = None,
) -> float:
    """
    Score de santé composite entre 0.0 et 1.0.
    Combine plusieurs KPIs en un seul score.
    """
    w = weights or {'success': 0.5, 'on_time': 0.3, 'sla': 0.2}
    score = (
        success_rate  * w.get('success', 0.5) +
        on_time_rate  * w.get('on_time', 0.3) +
        sla_compliance * w.get('sla', 0.2)
    )
    return round(score, 4)


def _sorted_by_time(executions: list[dict]) -> list[dict]:
    return sorted(executions, key=lambda x: x.get('start_time', ''))


def _parse_dt(value) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace('Z', '+00:00'))
    except Exception:
        return None
