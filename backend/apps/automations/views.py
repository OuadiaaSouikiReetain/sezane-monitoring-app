"""
Endpoints Automations — proxy sécurisé vers SFMC.
"""
import uuid
import logging
from datetime import datetime, timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.sfmc.rest_api import (
    get_automations_with_kpis,
    get_automation_detail,
    get_automation_schedule,
)
from apps.sfmc.data_extensions import read_de, write_de
from apps.sfmc.tracking_api import get_automation_email_kpis

logger = logging.getLogger(__name__)

# ── Noms des KPIs stockés dans KPI_Value DE ───────────────────────────────────
# Format : groupe.nom_du_kpi
_KPI = {
    # Groupe 1 – Fiabilité
    'success_rate':                   'reliability.success_rate',
    'error_rate':                     'reliability.error_rate',
    'error_count':                    'reliability.error_count',
    'consecutive_failures':           'reliability.consecutive_failures',
    'total_runs':                     'reliability.total_runs',
    'success_count':                  'reliability.success_count',
    'time_since_last_success_hours':  'reliability.time_since_last_success_h',
    'time_since_last_run_hours':      'reliability.time_since_last_run_h',
    # Groupe 2 – Performance
    'avg_duration_seconds':           'performance.avg_duration_s',
    'max_duration_seconds':           'performance.max_duration_s',
    'min_duration_seconds':           'performance.min_duration_s',
    'p95_duration_seconds':           'performance.p95_duration_s',
    # Groupe 4 – Composite
    'health_score':                   'composite.health_score',
    'mtbf_hours':                     'composite.mtbf_h',
    'mttr_hours':                     'composite.mttr_h',
}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _fetch_exec_rows(component_id_candidates: list[str]) -> list[dict]:
    """Retourne toutes les lignes ExecutionLog pour une automation (multi-candidats)."""
    for candidate in component_id_candidates:
        if not candidate:
            continue
        rows = read_de('execution_log', filters={'component_id': candidate}, max_rows=500)
        if rows:
            return rows
    # Fallback : lecture sans filtre + match sur component_name
    return []


def _split_rows(all_rows: list[dict]):
    """Sépare les lignes automation-level (activity_id=null) des lignes activité."""
    auto_rows     = [r for r in all_rows if not r.get('activity_id')]
    activity_rows = [r for r in all_rows if r.get('activity_id')]
    return auto_rows, activity_rows


def _compute_all_kpis(auto_rows: list[dict], activity_rows: list[dict]) -> dict:
    """Calcule les 4 groupes de KPIs et retourne un dict structuré."""
    from apps.kpis.calculators import reliability, performance, availability

    result = {}

    if auto_rows:
        sr  = reliability.success_rate(auto_rows)
        otr = reliability.on_time_rate(auto_rows)

        result['reliability'] = {
            'success_rate':                  sr,
            'error_rate':                    reliability.error_rate(auto_rows),
            'error_count':                   reliability.error_count(auto_rows),
            'consecutive_failures':          reliability.consecutive_failures(auto_rows),
            'total_runs':                    len(auto_rows),
            'success_count':                 sum(1 for r in auto_rows if r.get('status') == 'success'),
            'time_since_last_success_hours': reliability.time_since_last_success(auto_rows),
            'time_since_last_run_hours':     reliability.time_since_last_run(auto_rows),
        }

        result['performance'] = {
            'avg_duration_seconds': performance.avg_duration(auto_rows),
            'max_duration_seconds': performance.max_duration(auto_rows),
            'min_duration_seconds': performance.min_duration(auto_rows),
            'p95_duration_seconds': performance.p95_duration(auto_rows),
        }

        result['composite'] = {
            'health_score': availability.health_score(
                success_rate=sr, on_time_rate=otr, sla_compliance=1.0,
            ),
            'mtbf_hours': availability.mtbf(auto_rows),
            'mttr_hours': availability.mttr(auto_rows),
        }

    if activity_rows:
        result['activity'] = _compute_activity_kpis(activity_rows)

    return result


def _compute_activity_kpis(activity_rows: list[dict]) -> dict:
    """Groupe 3 — santé par activité."""
    by_act: dict = {}
    for row in activity_rows:
        key = row.get('activity_name') or row.get('activity_id') or 'Unknown'
        if key not in by_act:
            by_act[key] = {
                'name': key,
                'type': row.get('activity_type') or '—',
                'step_id': row.get('step_id'),
                'total': 0, 'errors': 0,
                'durations': [], 'last_error': None,
            }
        e = by_act[key]
        e['total'] += 1
        if row.get('status') == 'error':
            e['errors'] += 1
            if row.get('error_message'):
                e['last_error'] = row['error_message']
        dur = row.get('duration_seconds')
        if dur is not None:
            try:
                e['durations'].append(float(dur))
            except (TypeError, ValueError):
                pass

    breakdown = []
    for e in sorted(by_act.values(), key=lambda x: x['errors'], reverse=True):
        avg = round(sum(e['durations']) / len(e['durations']), 1) if e['durations'] else None
        breakdown.append({
            'name':                 e['name'],
            'type':                 e['type'],
            'step_id':              e['step_id'],
            'total_runs':           e['total'],
            'error_count':          e['errors'],
            'error_rate':           round(e['errors'] / e['total'], 4) if e['total'] else 0,
            'avg_duration_seconds': avg,
            'last_error':           e['last_error'],
        })

    # Top 5 erreurs récurrentes
    msgs: dict = {}
    for row in activity_rows:
        if row.get('status') == 'error' and row.get('error_message'):
            m = str(row['error_message'])[:200]
            msgs[m] = msgs.get(m, 0) + 1
    top_errors = sorted(
        [{'message': m, 'count': c} for m, c in msgs.items()],
        key=lambda x: x['count'], reverse=True,
    )[:5]

    # Taux d'erreur par type d'activité
    by_type: dict = {}
    for row in activity_rows:
        t = row.get('activity_type') or 'Unknown'
        if t not in by_type:
            by_type[t] = {'total': 0, 'errors': 0}
        by_type[t]['total'] += 1
        if row.get('status') == 'error':
            by_type[t]['errors'] += 1
    error_by_type = {
        t: round(v['errors'] / v['total'], 4)
        for t, v in by_type.items() if v['total'] > 0
    }

    return {
        'breakdown':      breakdown,
        'top_errors':     top_errors,
        'error_by_type':  error_by_type,
        'worst_activity': breakdown[0] if breakdown and breakdown[0]['errors'] > 0 else None,
    }


def _kpis_to_de_rows(component_id: str, component_name: str, kpis: dict, ts: str) -> list[dict]:
    """
    Convertit le dict de KPIs en lignes prêtes à écrire dans KPI_Value DE.
    Chaque KPI numérique = 1 ligne. Les KPIs complexes (activity) = JSON en value.
    L'id_value = {component_id}::{kpi_id} garantit l'upsert idempotent.
    """
    rows = []

    def _row(kpi_name: str, value, granularity='24h') -> dict:
        kpi_id = _KPI.get(kpi_name, f'auto.{kpi_name}')
        return {
            'id_value':       f"{component_id}::{kpi_id}",
            'kpi_id':         kpi_id,
            'component_type': 'automation',
            'component_id':   component_id,
            'value':          str(value) if value is not None else '',
            'source':         'executionlog',
            'granularity':    granularity,
            'timestamp':      ts,
        }

    # Groupe 1 – Fiabilité
    rel = kpis.get('reliability', {})
    for k in ['success_rate', 'error_rate', 'error_count', 'consecutive_failures',
              'total_runs', 'success_count',
              'time_since_last_success_hours', 'time_since_last_run_hours']:
        if k in rel:
            rows.append(_row(k, rel[k]))

    # Groupe 2 – Performance
    perf = kpis.get('performance', {})
    for k in ['avg_duration_seconds', 'max_duration_seconds',
              'min_duration_seconds', 'p95_duration_seconds']:
        if k in perf:
            rows.append(_row(k, perf[k]))

    # Groupe 4 – Composite
    comp = kpis.get('composite', {})
    for k in ['health_score', 'mtbf_hours', 'mttr_hours']:
        if k in comp:
            rows.append(_row(k, comp[k]))

    # Groupe 3 – Activity (stocké en JSON dans value)
    import json
    act = kpis.get('activity')
    if act:
        rows.append({
            'id_value':       f"{component_id}::activity.breakdown",
            'kpi_id':         'activity.breakdown',
            'component_type': 'automation',
            'component_id':   component_id,
            'value':          json.dumps(act, ensure_ascii=False)[:4000],
            'source':         'executionlog',
            'granularity':    '24h',
            'timestamp':      ts,
        })

    return rows


def _read_kpis_from_de(component_id: str) -> dict | None:
    """
    Lit les KPIs pré-calculés depuis KPI_Value DE pour un component_id.
    Retourne None si aucune donnée trouvée.
    """
    import json

    rows = read_de('kpi_value', filters={
        'component_id':   component_id,
        'component_type': 'automation',
    }, max_rows=200)

    if not rows:
        return None

    # Reconstruit le dict structuré depuis les lignes plates
    kpis: dict = {
        'reliability': {}, 'performance': {}, 'composite': {}, 'activity': None,
    }
    timestamp = None

    for row in rows:
        kpi_id = row.get('kpi_id', '')
        value  = row.get('value')
        ts     = row.get('timestamp')
        if ts:
            timestamp = ts

        if kpi_id == 'activity.breakdown':
            try:
                kpis['activity'] = json.loads(value) if value else None
            except (json.JSONDecodeError, TypeError):
                pass
            continue

        # Parse la valeur numérique
        try:
            num = float(value) if value not in (None, '', 'None') else None
        except (ValueError, TypeError):
            num = None

        if kpi_id.startswith('reliability.'):
            short = kpi_id.replace('reliability.', '')
            # Mapping inverse des noms courts → noms longs
            name_map = {
                'success_rate':   'success_rate',
                'error_rate':     'error_rate',
                'error_count':    'error_count',
                'consecutive_failures': 'consecutive_failures',
                'total_runs':     'total_runs',
                'success_count':  'success_count',
                'time_since_last_success_h': 'time_since_last_success_hours',
                'time_since_last_run_h':     'time_since_last_run_hours',
            }
            long_name = name_map.get(short, short)
            kpis['reliability'][long_name] = num

        elif kpi_id.startswith('performance.'):
            short = kpi_id.replace('performance.', '')
            name_map = {
                'avg_duration_s': 'avg_duration_seconds',
                'max_duration_s': 'max_duration_seconds',
                'min_duration_s': 'min_duration_seconds',
                'p95_duration_s': 'p95_duration_seconds',
            }
            long_name = name_map.get(short, short)
            kpis['performance'][long_name] = num

        elif kpi_id.startswith('composite.'):
            short = kpi_id.replace('composite.', '')
            name_map = {
                'health_score': 'health_score',
                'mtbf_h':       'mtbf_hours',
                'mttr_h':       'mttr_hours',
            }
            long_name = name_map.get(short, short)
            kpis['composite'][long_name] = num

    # Retourne None si aucun KPI fiabilité calculé (DE vide pour cet ID)
    if not kpis['reliability']:
        return None

    return {'kpis': kpis, 'computed_at': timestamp}


# ─── Views ────────────────────────────────────────────────────────────────────

class AutomationListView(APIView):
    def get(self, request):
        search = request.query_params.get('search')
        try:
            automations = get_automations_with_kpis(search=search)
            return Response({'items': automations, 'count': len(automations)})
        except Exception as e:
            logger.error(f"Erreur liste automations: {e}")
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)


class AutomationDetailView(APIView):
    def get(self, request, sfmc_id: str):
        try:
            detail   = get_automation_detail(sfmc_id)
            schedule = get_automation_schedule(sfmc_id)
            from apps.sfmc.rest_api import _compute_automation_kpis, _normalize_automation_status
            # Log all top-level keys returned by SFMC API (helps diagnose missing fields)
            logger.debug(f"[Detail] {detail.get('name')} — SFMC API keys: {sorted(k for k in detail.keys() if not k.startswith('step'))}")
            return Response({
                **detail,
                'status':   _normalize_automation_status(detail.get('statusId')),
                'schedule': schedule,
                'kpis':     _compute_automation_kpis(detail, schedule),
            })
        except Exception as e:
            logger.error(f"Erreur détail automation {sfmc_id}: {e}")
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)


class AutomationExecutionsView(APIView):
    """GET /api/automations/:id/executions/"""
    def get(self, request, sfmc_id: str):
        limit         = int(request.query_params.get('limit', 20))
        status_filter = request.query_params.get('status')

        try:
            detail = get_automation_detail(sfmc_id)
            candidates = [v for v in [
                detail.get('key'), detail.get('name'), sfmc_id, detail.get('programId'),
            ] if v]

            executions = []
            for candidate in candidates:
                f = {'component_id': candidate}
                if status_filter:
                    f['status'] = status_filter
                rows = read_de('execution_log', filters=f, max_rows=limit)
                if rows:
                    executions = rows
                    logger.info(f"[Executions] {detail.get('name')} → matched on '{candidate}' ({len(rows)} rows)")
                    break

            if not executions:
                all_rows = read_de('execution_log', max_rows=200)
                found_ids = list({r.get('component_id', '') for r in all_rows if r.get('component_id')})
                logger.warning(
                    f"[Executions] {detail.get('name')} — aucun match. "
                    f"Candidats: {candidates} | component_id en DE: {found_ids[:20]}"
                )
                name_lower = (detail.get('name') or '').lower()
                if name_lower:
                    executions = [
                        r for r in all_rows
                        if (r.get('component_name') or '').lower() == name_lower
                    ][:limit]

            return Response({'items': executions, 'count': len(executions)})
        except Exception as e:
            logger.error(f"Erreur executions automation {sfmc_id}: {e}")
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)


class AutomationKpisView(APIView):
    """
    GET /api/automations/:id/kpis/
    Lit d'abord KPI_Value DE (pré-calculé par sync-kpis).
    Calcule à la volée en fallback si pas de données pré-calculées.
    """
    def get(self, request, sfmc_id: str):
        try:
            detail   = get_automation_detail(sfmc_id)
            schedule = get_automation_schedule(sfmc_id)
            from apps.sfmc.rest_api import _compute_automation_kpis, _normalize_automation_status
            live_kpis = _compute_automation_kpis(detail, schedule)

            candidates = [v for v in [
                detail.get('key'), detail.get('name'), sfmc_id, detail.get('programId'),
            ] if v]

            # ── Essai 1 : lecture depuis KPI_Value DE (pré-calculé) ────────
            historical_kpis = {}
            computed_at     = None
            for candidate in candidates:
                stored = _read_kpis_from_de(candidate)
                if stored:
                    historical_kpis = stored['kpis']
                    computed_at     = stored['computed_at']
                    logger.info(f"[KPIs] {detail.get('name')} → lu depuis KPI_Value DE (calculé le {computed_at})")
                    break

            # ── Fallback : calcul à la volée depuis ExecutionLog ───────────
            if not historical_kpis:
                all_rows = []
                for candidate in candidates:
                    rows = read_de('execution_log', filters={'component_id': candidate}, max_rows=500)
                    if rows:
                        all_rows = rows
                        break

                if all_rows:
                    auto_rows, activity_rows = _split_rows(all_rows)
                    historical_kpis = _compute_all_kpis(auto_rows, activity_rows)
                    logger.info(f"[KPIs] {detail.get('name')} → calculé à la volée ({len(all_rows)} rows)")

            # ── KPIs email ────────────────────────────────────────────────
            days_back  = int(request.query_params.get('days', 30))
            email_kpis = get_automation_email_kpis(sfmc_id, days_back=days_back)

            return Response({
                'component_id':    sfmc_id,
                'name':            detail.get('name', ''),
                'status':          _normalize_automation_status(detail.get('statusId')),
                'live_kpis':       live_kpis,
                'historical_kpis': historical_kpis,
                'email_kpis':      email_kpis,
                'has_history':     bool(historical_kpis),
                'computed_at':     computed_at,
            })
        except Exception as e:
            logger.error(f"Erreur KPIs automation {sfmc_id}: {e}")
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)


class SyncAutomationKpisView(APIView):
    """
    POST /api/automations/sync-kpis/
    Lit ExecutionLog DE, calcule tous les KPIs pour chaque automation,
    et écrit les résultats dans KPI_Value DE.
    À appeler après chaque Query Activity SFMC.
    """
    def post(self, request):
        try:
            ts = datetime.now(timezone.utc).isoformat()

            # Lit toutes les lignes de l'ExecutionLog (toutes automations)
            all_exec = read_de('execution_log', max_rows=5000)
            if not all_exec:
                return Response({
                    'synced': 0, 'kpis_written': 0,
                    'message': 'ExecutionLog DE vide ou inaccessible.',
                    'timestamp': ts,
                })

            # Groupe par component_id
            by_component: dict = {}
            for row in all_exec:
                cid = row.get('component_id')
                if not cid:
                    continue
                if cid not in by_component:
                    by_component[cid] = {
                        'name': row.get('component_name') or cid,
                        'rows': [],
                    }
                by_component[cid]['rows'].append(row)

            all_kpi_rows = []
            results      = []

            for component_id, info in by_component.items():
                auto_rows, activity_rows = _split_rows(info['rows'])
                kpis = _compute_all_kpis(auto_rows, activity_rows)

                de_rows = _kpis_to_de_rows(
                    component_id=component_id,
                    component_name=info['name'],
                    kpis=kpis,
                    ts=ts,
                )
                all_kpi_rows.extend(de_rows)

                results.append({
                    'component_id': component_id,
                    'name':         info['name'],
                    'total_rows':   len(info['rows']),
                    'auto_runs':    len(auto_rows),
                    'activity_runs':len(activity_rows),
                    'kpis_computed':len(de_rows),
                    'success_rate': kpis.get('reliability', {}).get('success_rate'),
                    'health_score': kpis.get('composite', {}).get('health_score'),
                })
                logger.info(
                    f"[SyncKPIs] {info['name']} → "
                    f"{len(auto_rows)} runs, {len(de_rows)} KPIs calculés"
                )

            # Écrit tout dans KPI_Value DE en batch
            written = 0
            BATCH   = 100
            for i in range(0, len(all_kpi_rows), BATCH):
                batch = all_kpi_rows[i:i + BATCH]
                if write_de('kpi_value', batch):
                    written += len(batch)

            logger.info(
                f"[SyncKPIs] Terminé — {len(by_component)} automations, "
                f"{written} KPIs écrits dans KPI_Value DE"
            )

            return Response({
                'synced':       len(by_component),
                'kpis_written': written,
                'timestamp':    ts,
                'automations':  results,
            })

        except Exception as e:
            logger.error(f"Erreur sync KPIs: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
