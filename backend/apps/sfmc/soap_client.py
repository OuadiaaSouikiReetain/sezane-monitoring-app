"""
Client SFMC SOAP — Retrieve d'objets non exposés par l'API REST.
Utilise le même token OAuth que le client REST.

Objets utiles :
  QueryDefinition — SQL text + target DE (fallback au REST queryactivities)
  Script          — contenu SSJS (non disponible en REST)
  AutomationActivity — métadonnées CreatedDate/ModifiedDate/Owner
"""
import logging
import xml.etree.ElementTree as ET
from textwrap import dedent

import requests
from django.conf import settings

from .client import get_token, SfmcApiError

logger = logging.getLogger(__name__)

# ─── Namespaces XML SFMC ──────────────────────────────────────────────────────
_NS_SOAP = 'http://www.w3.org/2003/05/soap-envelope'
_NS_API  = 'http://exacttarget.com/wsdl/partnerAPI'
_NS_XSI  = 'http://www.w3.org/2001/XMLSchema-instance'

# Register pour que les tags affichent lisiblement dans les logs
ET.register_namespace('s',   _NS_SOAP)
ET.register_namespace('',    _NS_API)
ET.register_namespace('xsi', _NS_XSI)


def _soap_url() -> str:
    """
    Dérive l'URL SOAP depuis SFMC_REST_BASE_URI.
    REST  : https://{sub}.rest.marketingcloudapis.com
    SOAP  : https://{sub}.soap.marketingcloudapis.com/Service.asmx
    """
    base = settings.SFMC_REST_BASE_URI.rstrip('/')
    soap = base.replace('.rest.', '.soap.')
    return f"{soap}/Service.asmx"


def _build_retrieve_envelope(object_type: str, properties: list[str], filter_prop: str, filter_value: str) -> str:
    return dedent(f"""<?xml version="1.0" encoding="UTF-8"?>
    <s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope">
      <s:Header>
        <fueloauth xmlns="http://exacttarget.com">{get_token()}</fueloauth>
      </s:Header>
      <s:Body>
        <RetrieveRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI">
          <RetrieveRequest>
            <ObjectType>{object_type}</ObjectType>
            {''.join(f'<Properties>{p}</Properties>' for p in properties)}
            <Filter xsi:type="SimpleFilterPart" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
              <Property>{filter_prop}</Property>
              <SimpleOperator>equals</SimpleOperator>
              <Value>{filter_value}</Value>
            </Filter>
          </RetrieveRequest>
        </RetrieveRequestMsg>
      </s:Body>
    </s:Envelope>""").strip()


def _soap_retrieve(object_type: str, properties: list[str], filter_prop: str, filter_value: str) -> list[dict]:
    """
    Effectue un Retrieve SOAP et retourne la liste des Results sous forme de dicts.
    """
    url     = _soap_url()
    payload = _build_retrieve_envelope(object_type, properties, filter_prop, filter_value)
    headers = {
        'Content-Type': 'text/xml; charset=UTF-8',
        'SOAPAction':   'Retrieve',
    }

    try:
        resp = requests.post(url, data=payload.encode('utf-8'), headers=headers, timeout=30, verify=False)
        resp.raise_for_status()
    except requests.RequestException as e:
        raise SfmcApiError(f"SOAP request failed: {e}") from e

    try:
        root = ET.fromstring(resp.text)
    except ET.ParseError as e:
        raise SfmcApiError(f"SOAP XML parse error: {e}") from e

    # Cherche tous les éléments <Results> dans le body
    ns   = {'api': _NS_API}
    results = []
    for result in root.iter(f'{{{_NS_API}}}Results'):
        obj: dict = {}
        for child in result:
            tag = child.tag.replace(f'{{{_NS_API}}}', '')
            # Pour les objets imbriqués (DataExtensionTarget), on descend d'un niveau
            if len(child):
                nested = {}
                for subchild in child:
                    subtag = subchild.tag.replace(f'{{{_NS_API}}}', '')
                    nested[subtag] = subchild.text
                obj[tag] = nested
            else:
                obj[tag] = child.text
        if obj:
            results.append(obj)

    return results


# ─── Fonctions publiques ───────────────────────────────────────────────────────

def soap_get_query_definition(object_id: str) -> dict | None:
    """
    Récupère le contenu SQL d'une Query Activity via SOAP QueryDefinition.
    Retourne None si non trouvé.
    """
    props = [
        'Name', 'CustomerKey', 'ObjectID',
        'QueryText',
        'DataExtensionTarget.Name',
        'DataExtensionTarget.CustomerKey',
        'TargetUpdateType',
        'Status',
        'Description',
        'CreatedDate',
        'ModifiedDate',
    ]
    try:
        results = _soap_retrieve('QueryDefinition', props, 'ObjectID', object_id)
        if not results:
            # Essai par CustomerKey si ObjectID ne matche pas
            results = _soap_retrieve('QueryDefinition', props, 'CustomerKey', object_id)
        if not results:
            return None

        r = results[0]
        de_target = r.get('DataExtensionTarget') or {}
        return {
            'queryText':          r.get('QueryText'),
            'targetDE':           de_target.get('Name') or de_target.get('CustomerKey'),
            'targetUpdateTypeId': _update_type_to_id(r.get('TargetUpdateType')),
            'targetUpdateType':   r.get('TargetUpdateType'),
            'status':             r.get('Status'),
            'description':        r.get('Description'),
            'createdDate':        r.get('CreatedDate'),
            'modifiedDate':       r.get('ModifiedDate'),
        }
    except SfmcApiError as e:
        logger.debug(f"[SOAP] QueryDefinition fetch failed for {object_id}: {e}")
        return None


def soap_get_script(object_id: str) -> dict | None:
    """
    Récupère le contenu SSJS d'un Script Activity via SOAP.
    Retourne None si non trouvé.
    """
    props = [
        'Name', 'CustomerKey', 'ObjectID',
        'Script',
        'Description',
        'CreatedDate',
        'ModifiedDate',
    ]
    try:
        results = _soap_retrieve('Script', props, 'ObjectID', object_id)
        if not results:
            results = _soap_retrieve('Script', props, 'CustomerKey', object_id)
        if not results:
            return None

        r = results[0]
        return {
            'script':      r.get('Script'),
            'description': r.get('Description'),
            'createdDate': r.get('CreatedDate'),
            'modifiedDate':r.get('ModifiedDate'),
        }
    except SfmcApiError as e:
        logger.debug(f"[SOAP] Script fetch failed for {object_id}: {e}")
        return None


def _update_type_to_id(label: str | None) -> int | None:
    """Convertit le label SOAP TargetUpdateType en ID numérique REST."""
    mapping = {'Overwrite': 2, 'Append': 1, 'Update': 3}
    return mapping.get(label) if label else None
