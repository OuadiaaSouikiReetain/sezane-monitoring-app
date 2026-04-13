"""
KPIs de fiabilité — taux de succès, erreurs, runs consécutifs.
Calculés à partir de ExecutionLog_DE.
"""
from datetime import datetime, timezone, timedelta


def success_rate(executions: list[dict]) -> float:
    """% de runs en succès. Ex: 0.94 = 94%"""
    if not executions:
        return 0.0
    successes = sum(1 for e in executions if e.get('status') == 'success')
    return round(successes / len(executions), 4)


def error_rate(executions: list[dict]) -> float:
    """% de runs en erreur."""
    return round(1 - success_rate(executions), 4)


def error_count(executions: list[dict]) -> int:
    """Nombre absolu de runs en erreur."""
    return sum(1 for e in executions if e.get('status') == 'error')


def consecutive_failures(executions: list[dict]) -> int:
    """
    Nombre de runs consécutifs en erreur (les plus récents).
    Ex: [error, error, error, success] → 3
    """
    count = 0
    for e in sorted(executions, key=lambda x: x.get('start_time', ''), reverse=True):
        if e.get('status') == 'error':
            count += 1
        else:
            break
    return count


def time_since_last_success(executions: list[dict]) -> float | None:
    """
    Temps en heures depuis le dernier run en succès.
    Retourne None si aucun succès trouvé.
    """
    successes = [e for e in executions if e.get('status') == 'success']
    if not successes:
        return None

    latest = max(successes, key=lambda x: x.get('end_time', ''))
    end_time_str = latest.get('end_time')
    if not end_time_str:
        return None

    try:
        end_time = datetime.fromisoformat(str(end_time_str).replace('Z', '+00:00'))
        delta = datetime.now(timezone.utc) - end_time
        return round(delta.total_seconds() / 3600, 2)
    except Exception:
        return None


def on_time_rate(executions: list[dict], tolerance_minutes: int = 15) -> float:
    """
    % de runs qui se sont lancés dans la fenêtre de tolérance autour
    du schedule attendu. Nécessite 'expected_start' dans chaque execution.
    """
    timed = [e for e in executions if e.get('expected_start')]
    if not timed:
        return 1.0

    on_time = 0
    for e in timed:
        try:
            actual   = datetime.fromisoformat(str(e['start_time']).replace('Z', '+00:00'))
            expected = datetime.fromisoformat(str(e['expected_start']).replace('Z', '+00:00'))
            if abs((actual - expected).total_seconds()) <= tolerance_minutes * 60:
                on_time += 1
        except Exception:
            pass

    return round(on_time / len(timed), 4)
