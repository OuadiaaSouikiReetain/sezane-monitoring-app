"""
SFMC Email Tracking API
=======================
Récupère les KPIs email (open rate, CTR, bounce rate, etc.) pour les
journeys et automations, via SFMC REST et SOAP.

Stratégie (par ordre de priorité) :
  1. REST  GET /data/v1/messagetracking/messages/{key}/tracking/summary
     → résultat pré-agrégé, le plus rapide
  2. SOAP  Retrieve Send objects filtrés par Program.ID (automations)
     → agrège NumberSent / NumberOpened / NumberClicked / NumberBounced
  3. Fallback propre → retourne des zéros avec data_available=False

Seuils d'alerte définis dans THRESHOLDS.
"""

import logging
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from typing import Optional

import requests
from django.conf import settings

from .client import get_token, sfmc_get

logger = logging.getLogger(__name__)


# ─── Seuils d'alerte ─────────────────────────────────────────────────────────

THRESHOLDS = {
    'open_rate':        {'warn': 15.0, 'crit': 10.0, 'dir': 'below'},
    'ctr':              {'warn': 2.0,  'crit': 1.0,  'dir': 'below'},
    'bounce_rate':      {'warn': 2.0,  'crit': 5.0,  'dir': 'above'},
    'delivery_rate':    {'warn': 97.0, 'crit': 95.0, 'dir': 'below'},
    'unsubscribe_rate': {'warn': 0.5,  'crit': 1.0,  'dir': 'above'},
}


# ─── Utilitaires ─────────────────────────────────────────────────────────────

def _safe_pct(num: float, den: float) -> float:
    return round((num / den) * 100, 2) if den else 0.0


def _rate_status(metric: str, value: float) -> str:
    """'healthy' | 'warn' | 'critical'"""
    t = THRESHOLDS.get(metric)
    if not t:
        return 'healthy'
    if t['dir'] == 'below':
        return 'critical' if value < t['crit'] else ('warn' if value < t['warn'] else 'healthy')
    return 'critical' if value > t['crit'] else ('warn' if value > t['warn'] else 'healthy')


def _empty_stats(reason: str = 'no_data') -> dict:
    base = {k: 0 for k in [
        'sent', 'delivered', 'opens', 'unique_opens',
        'clicks', 'unique_clicks', 'bounces', 'hard_bounces',
        'soft_bounces', 'unsubscribes',
        'open_rate', 'ctr', 'bounce_rate', 'delivery_rate', 'unsubscribe_rate',
    ]}
    base.update({
        'open_rate_status':        'unknown',
        'ctr_status':              'unknown',
        'bounce_rate_status':      'unknown',
        'delivery_rate_status':    'unknown',
        'unsubscribe_rate_status': 'unknown',
        'data_available': False,
        'source': reason,
    })
    return base


def _build_stats(sent, delivered, opens, unique_opens, clicks, unique_clicks,
                 bounces, hard_bounces, soft_bounces, unsubscribes,
                 source: str = 'sfmc') -> dict:
    open_rate   = _safe_pct(unique_opens, sent)
    ctr         = _safe_pct(unique_clicks, sent)
    bounce_rate = _safe_pct(bounces, sent)
    delivery    = _safe_pct(delivered or max(0, sent - bounces), sent)
    unsub_rate  = _safe_pct(unsubscribes, sent)

    return {
        'sent':            sent,
        'delivered':       delivered or max(0, sent - bounces),
        'opens':           opens,
        'unique_opens':    unique_opens,
        'clicks':          clicks,
        'unique_clicks':   unique_clicks,
        'bounces':         bounces,
        'hard_bounces':    hard_bounces,
        'soft_bounces':    soft_bounces,
        'unsubscribes':    unsubscribes,
        'open_rate':       open_rate,
        'ctr':             ctr,
        'bounce_rate':     bounce_rate,
        'delivery_rate':   delivery,
        'unsubscribe_rate': unsub_rate,
        'open_rate_status':        _rate_status('open_rate', open_rate),
        'ctr_status':              _rate_status('ctr', ctr),
        'bounce_rate_status':      _rate_status('bounce_rate', bounce_rate),
        'delivery_rate_status':    _rate_status('delivery_rate', delivery),
        'unsubscribe_rate_status': _rate_status('unsubscribe_rate', unsub_rate),
        'data_available': sent > 0,
        'source': source,
    }


# ─── SOAP ─────────────────────────────────────────────────────────────────────

def _soap_url() -> str:
    auth_uri = getattr(settings, 'SFMC_AUTH_BASE_URI', '').rstrip('/')
    return auth_uri.replace('.auth.', '.soap.') + '/Service.asmx'


def _soap_request(body_xml: str, timeout: int = 30) -> ET.Element:
    token    = get_token()
    envelope = f"""<?xml version="1.0" encoding="UTF-8"?>
<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope"
            xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing">
  <s:Header>
    <a:Action s:mustUnderstand="1">Retrieve</a:Action>
    <fueloauth xmlns="http://exacttarget.com">{token}</fueloauth>
  </s:Header>
  <s:Body>
    <RetrieveRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI">
      <RetrieveRequest>{body_xml}</RetrieveRequest>
    </RetrieveRequestMsg>
  </s:Body>
</s:Envelope>"""
    resp = requests.post(
        _soap_url(), data=envelope.encode('utf-8'),
        headers={'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': 'Retrieve'},
        timeout=timeout,
    )
    resp.raise_for_status()
    return ET.fromstring(resp.text)


def _xml_int(el: ET.Element, tag: str, ns: str) -> int:
    child = el.find(f'{ns}{tag}')
    try:
        return int(child.text) if child is not None and child.text else 0
    except (ValueError, TypeError):
        return 0


# ─── Stratégie 1 : REST tracking summary ────────────────────────────────────

def _rest_tracking_summary(ts_key: str) -> Optional[dict]:
    """GET /data/v1/messagetracking/messages/{key}/tracking/summary"""
    try:
        data = sfmc_get(f'/data/v1/messagetracking/messages/{ts_key}/tracking/summary')
        sent = data.get('totalSent', 0) or 0
        if not sent:
            return None
        hard    = data.get('totalHardBounces', 0) or 0
        soft    = data.get('totalSoftBounces', 0) or 0
        bounces = hard + soft or (data.get('totalBounces', 0) or 0)
        return _build_stats(
            sent=sent,
            delivered=data.get('totalDelivered', 0) or 0,
            opens=data.get('totalOpens', 0) or 0,
            unique_opens=data.get('uniqueOpens', 0) or 0,
            clicks=data.get('totalClicks', 0) or 0,
            unique_clicks=data.get('uniqueClicks', 0) or 0,
            bounces=bounces, hard_bounces=hard, soft_bounces=soft,
            unsubscribes=data.get('totalOptOuts', 0) or 0,
            source='rest_tracking',
        )
    except Exception as e:
        logger.debug(f"REST tracking summary indisponible pour {ts_key}: {e}")
        return None


# ─── Stratégie 2 : SOAP Send objects (automations) ──────────────────────────

def _soap_send_stats_by_program(program_id: str, days_back: int = 30) -> Optional[dict]:
    """Retrieve Send objects SOAP liés à une Automation via Program.ID."""
    start = (datetime.utcnow() - timedelta(days=days_back)).strftime('%Y-%m-%dT%H:%M:%S')
    body  = f"""
        <ObjectType>Send</ObjectType>
        <Properties>NumberSent</Properties>
        <Properties>NumberDelivered</Properties>
        <Properties>NumberOpened</Properties>
        <Properties>NumberClicked</Properties>
        <Properties>NumberBounced</Properties>
        <Properties>NumberHardBounced</Properties>
        <Properties>NumberSoftBounced</Properties>
        <Properties>NumberOptedOut</Properties>
        <Filter xsi:type="ComplexFilterPart" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
          <LeftOperand xsi:type="SimpleFilterPart">
            <Property>Program.ID</Property>
            <SimpleOperator>equals</SimpleOperator>
            <Value>{program_id}</Value>
          </LeftOperand>
          <LogicalOperator>AND</LogicalOperator>
          <RightOperand xsi:type="SimpleFilterPart">
            <Property>SendDate</Property>
            <SimpleOperator>greaterThan</SimpleOperator>
            <DateValue>{start}</DateValue>
          </RightOperand>
        </Filter>"""
    try:
        root    = _soap_request(body)
        ns      = '{http://exacttarget.com/wsdl/partnerAPI}'
        results = root.findall(f'.//{ns}Results')
        if not results:
            return None
        t = {k: 0 for k in ['sent','delivered','opens','clicks','bounces','hard','soft','unsubs']}
        for r in results:
            t['sent']     += _xml_int(r, 'NumberSent', ns)
            t['delivered']+= _xml_int(r, 'NumberDelivered', ns)
            t['opens']    += _xml_int(r, 'NumberOpened', ns)
            t['clicks']   += _xml_int(r, 'NumberClicked', ns)
            t['bounces']  += _xml_int(r, 'NumberBounced', ns)
            t['hard']     += _xml_int(r, 'NumberHardBounced', ns)
            t['soft']     += _xml_int(r, 'NumberSoftBounced', ns)
            t['unsubs']   += _xml_int(r, 'NumberOptedOut', ns)
        return _build_stats(
            sent=t['sent'], delivered=t['delivered'],
            opens=t['opens'], unique_opens=t['opens'],
            clicks=t['clicks'], unique_clicks=t['clicks'],
            bounces=t['bounces'], hard_bounces=t['hard'], soft_bounces=t['soft'],
            unsubscribes=t['unsubs'], source='soap_send',
        ) if t['sent'] > 0 else None
    except Exception as e:
        logger.warning(f"SOAP Send query échouée pour program {program_id}: {e}")
        return None


# ─── API publique ─────────────────────────────────────────────────────────────

def get_journey_email_kpis(journey_detail: dict, days_back: int = 30) -> dict:
    """
    KPIs email pour un journey.
    Extrait les triggeredSendKey des activités email, interroge SFMC,
    puis agrège les résultats.
    """
    activities = journey_detail.get('activities', []) or []

    email_acts = []
    for act in activities:
        if (act.get('type') or '').upper() not in ('EMAILV2', 'EMAIL', 'EMAILSEND'):
            continue
        cfg    = act.get('configurationArguments', {}) or {}
        ts_key = cfg.get('triggeredSendKey') or cfg.get('triggeredSendExternalKey')
        email_acts.append({'name': act.get('name', ''), 'ts_key': ts_key})

    if not email_acts:
        result = _empty_stats('no_email_activities')
        result.update({'email_activities': [], 'days_back': days_back})
        return result

    totals   = {k: 0 for k in ['sent', 'delivered', 'opens', 'unique_opens',
                                 'clicks', 'unique_clicks', 'bounces',
                                 'hard_bounces', 'soft_bounces', 'unsubscribes']}
    per_act  = []
    has_data = False

    for ea in email_acts:
        stats = (_rest_tracking_summary(ea['ts_key']) if ea['ts_key'] else None) \
                or _empty_stats('rest_unavailable')
        if stats.get('data_available'):
            has_data = True
        for k in totals:
            totals[k] += stats.get(k, 0)
        per_act.append({'name': ea['name'], 'stats': stats})

    result = _build_stats(**totals, source='aggregated') if has_data \
             else _empty_stats('no_tracking_data')
    result.update({'email_activities': per_act, 'days_back': days_back})
    return result


def get_automation_email_kpis(automation_id: str, days_back: int = 30) -> dict:
    """
    KPIs email pour une automation via SOAP Send objects (Program.ID).
    """
    stats = _soap_send_stats_by_program(automation_id, days_back)
    if stats:
        stats['days_back'] = days_back
        return stats
    result = _empty_stats('no_send_jobs')
    result['days_back'] = days_back
    return result
