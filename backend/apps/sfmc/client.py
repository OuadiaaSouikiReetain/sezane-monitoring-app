"""
Client SFMC sécurisé — gère l'authentification OAuth2 et les appels HTTP.
Les credentials ne quittent jamais le serveur Django.
"""
import time
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

# ─── Cache du token en mémoire ────────────────────────────────────────────────
_token_cache: dict = {
    'access_token': None,
    'expires_at':   0,
}


class SfmcAuthError(Exception):
    """Impossible d'obtenir un token SFMC."""
    pass


class SfmcApiError(Exception):
    """Erreur lors d'un appel à l'API SFMC."""
    def __init__(self, message: str, status_code: int = None):
        super().__init__(message)
        self.status_code = status_code


def get_token() -> str:
    """
    Retourne un token valide.
    Récupère un nouveau token uniquement si l'ancien est expiré (buffer 60s).
    """
    now = time.time()
    if _token_cache['access_token'] and now < _token_cache['expires_at'] - 60:
        return _token_cache['access_token']

    try:
        response = requests.post(
            f"{settings.SFMC_AUTH_BASE_URI}/v2/token",
            json={
                'grant_type':    'client_credentials',
                'client_id':     settings.SFMC_CLIENT_ID,
                'client_secret': settings.SFMC_CLIENT_SECRET,
                **({'account_id': settings.SFMC_ACCOUNT_ID} if settings.SFMC_ACCOUNT_ID else {}),
            },
            timeout=15,
            verify=False,
        )
        response.raise_for_status()
        data = response.json()

        _token_cache['access_token'] = data['access_token']
        _token_cache['expires_at']   = now + data.get('expires_in', 1080)

        logger.debug('Token SFMC renouvelé.')
        return _token_cache['access_token']

    except requests.RequestException as e:
        raise SfmcAuthError(f"Impossible d'obtenir le token SFMC : {e}") from e


def invalidate_token():
    """Force le renouvellement du token au prochain appel."""
    _token_cache['access_token'] = None
    _token_cache['expires_at']   = 0


def _headers() -> dict:
    return {
        'Authorization': f'Bearer {get_token()}',
        'Content-Type':  'application/json',
    }


def _build_url(path: str) -> str:
    """Construit l'URL complète en évitant les doubles slashes."""
    base = settings.SFMC_REST_BASE_URI.rstrip('/')
    path = path if path.startswith('/') else f'/{path}'
    return f"{base}{path}"


def sfmc_get(path: str, params: dict = None) -> dict:
    """
    GET vers l'API REST SFMC.
    path : chemin relatif ex. '/automation/v1/automations'
    """
    url = _build_url(path)
    try:
        resp = requests.get(url, headers=_headers(), params=params, timeout=30, verify=False)
        if resp.status_code == 401:
            invalidate_token()
            resp = requests.get(url, headers=_headers(), params=params, timeout=30, verify=False)
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as e:
        raise SfmcApiError(str(e), getattr(e.response, 'status_code', None)) from e


def sfmc_post(path: str, payload: dict) -> dict:
    """POST vers l'API REST SFMC."""
    url = _build_url(path)
    try:
        resp = requests.post(url, headers=_headers(), json=payload, timeout=30, verify=False)
        if resp.status_code == 401:
            invalidate_token()
            resp = requests.post(url, headers=_headers(), json=payload, timeout=30, verify=False)
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as e:
        raise SfmcApiError(str(e), getattr(e.response, 'status_code', None)) from e


def sfmc_patch(path: str, payload: dict) -> dict:
    """PATCH vers l'API REST SFMC."""
    url = _build_url(path)
    try:
        resp = requests.patch(url, headers=_headers(), json=payload, timeout=30, verify=False)
        if resp.status_code == 401:
            invalidate_token()
            resp = requests.patch(url, headers=_headers(), json=payload, timeout=30, verify=False)
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as e:
        raise SfmcApiError(str(e), getattr(e.response, 'status_code', None)) from e


def sfmc_get_all_pages(path: str, params: dict = None, page_size: int = 500) -> list:
    """
    Récupère toutes les pages d'un endpoint paginé SFMC.
    Gère automatiquement la pagination.
    """
    params = params or {}
    params['$page']     = 1
    params['$pageSize'] = page_size

    all_items = []

    while True:
        data  = sfmc_get(path, params)
        items = data.get('items', data.get('definitions', []))
        all_items.extend(items)

        total = data.get('count', data.get('totalCount', len(items)))
        if len(all_items) >= total:
            break

        params['$page'] += 1

    return all_items
