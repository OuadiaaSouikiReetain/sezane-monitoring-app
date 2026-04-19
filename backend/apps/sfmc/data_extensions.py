"""
Lecture et écriture dans les Data Extensions SFMC.
Toutes les données métier du monitoring sont stockées dans des DEs SFMC.
"""
import logging
from .client import sfmc_get, sfmc_post, sfmc_patch

logger = logging.getLogger(__name__)

# Clés des DEs (external key dans SFMC)
DE_KEYS = {
    'execution_log':         'ExecutionLog_DE',
    'kpi_value':             'KPI_Value_DE',
    'sync_log':              'SyncLog_DE',
    'kpi':                   'KPI_DE',
    'monitoring_config':     'MonitoringConfig_DE',
    'monitoring_rule':       'MonitoringRule_DE',
    'anomaly':               'Anomaly_DE',
    'alert':                 'Alert_DE',
    'alert_recipient':       'AlertRecipient_DE',
    'notification_channel':  'NotificationChannel_DE',
    'user':                  'User_DE',
}


def read_de(de_name: str, filters: dict = None, max_rows: int = 2500) -> list[dict]:
    """
    Lit les lignes d'une Data Extension puis filtre en Python.

    de_name : clé dans DE_KEYS (ex: 'execution_log')
    filters : dict de filtres ex. {'component_id': 'abc-123', 'status': 'error'}
              La comparaison est insensible à la casse pour les valeurs string.
    """
    de_key = DE_KEYS.get(de_name, de_name)
    path   = f'/data/v1/customobjectdata/key/{de_key}/rowset'

    # On récupère une grande page puis on filtre côté Python.
    # L'endpoint customobjectdata ne supporte pas $filter de manière fiable.
    params = {'$pageSize': 2500}

    try:
        data  = sfmc_get(path, params)
        items = data.get('items', [])

        if filters:
            def row_matches(row: dict) -> bool:
                keys = row.get('keys', {})
                vals = row.get('values', {})
                # SFMC retourne les champs dans 'keys' (PK) et 'values' (autres)
                flat = {**keys, **vals}
                # Normalise les clés en minuscules pour la comparaison
                flat_lower = {k.lower(): v for k, v in flat.items()}
                for f_key, f_val in filters.items():
                    row_val = flat_lower.get(f_key.lower())
                    if row_val is None:
                        return False
                    if str(row_val).lower() != str(f_val).lower():
                        return False
                return True

            items = [r for r in items if row_matches(r)]

        # Aplatit keys + values en un seul dict par ligne
        result = []
        for row in items[:max_rows]:
            flat = {**row.get('keys', {}), **row.get('values', {})}
            result.append({k.lower(): v for k, v in flat.items()})

        return result

    except Exception as e:
        logger.error(f"Erreur lecture DE {de_key}: {e}")
        return []


def write_de(de_name: str, rows: list[dict]) -> bool:
    """
    Insère des lignes dans une Data Extension (upsert).
    rows : liste de dicts avec les champs de la DE
    """
    if not rows:
        return True

    de_key = DE_KEYS.get(de_name, de_name)
    path   = f'/data/v1/async/dataextensions/key:{de_key}/rows'

    try:
        sfmc_post(path, {'items': rows})
        logger.info(f"DE {de_key} : {len(rows)} lignes insérées.")
        return True
    except Exception as e:
        logger.error(f"Erreur écriture DE {de_key}: {e}")
        return False


def update_de_row(de_name: str, primary_key: str, pk_value: str, updates: dict) -> bool:
    """
    Met à jour une ligne existante dans une Data Extension.

    primary_key : nom de la colonne clé primaire (ex: 'id_anomaly')
    pk_value    : valeur de la clé primaire
    updates     : dict des champs à mettre à jour
    """
    de_key = DE_KEYS.get(de_name, de_name)
    path   = f'/data/v1/customobjectdata/key/{de_key}/rows/{primary_key}:{pk_value}'

    try:
        sfmc_patch(path, updates)
        return True
    except Exception as e:
        logger.error(f"Erreur update DE {de_key} row {pk_value}: {e}")
        return False


def read_de_row(de_name: str, primary_key: str, pk_value: str) -> dict | None:
    """Lit une seule ligne par sa clé primaire."""
    rows = read_de(de_name, filters={primary_key: pk_value}, max_rows=1)
    return rows[0] if rows else None


def debug_de(de_name: str, limit: int = 5) -> list[dict]:
    """
    Retourne les premières lignes brutes d'une DE — utile pour débugger
    le format de réponse SFMC et vérifier les noms de champs.
    Usage : from apps.sfmc.data_extensions import debug_de; print(debug_de('execution_log'))
    """
    de_key = DE_KEYS.get(de_name, de_name)
    path   = f'/data/v1/customobjectdata/key/{de_key}/rowset'
    try:
        data = sfmc_get(path, {'$pageSize': limit})
        return data.get('items', [])
    except Exception as e:
        logger.error(f"Erreur debug DE {de_key}: {e}")
        return []
