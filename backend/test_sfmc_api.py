#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Test SFMC API for real journey data"""

import os
import sys
import django

# Fix encoding for Windows
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.sfmc.rest_api import get_journeys_with_kpis, get_journey_detail
from apps.sfmc.tracking_api import get_journey_email_kpis
from apps.sfmc.data_extensions import read_de
import json

print("\n" + "=" * 100)
print("TEST SFMC API - VÉRIFIER SI LES DONNÉES SONT RÉELLES OU MOCK")
print("=" * 100 + "\n")

try:
    print("[1] Récupérer les journeys...")
    journeys = get_journeys_with_kpis()
    print("[OK] %d journeys trouvés\n" % len(journeys))

    if len(journeys) == 0:
        print("[ERREUR] AUCUN JOURNEY TROUVÉ")
        print("         Vérifiez que la connexion SFMC est configurée\n")
    else:
        # Affiche le premier journey avec détails
        j = journeys[0]
        print("Premier journey: %s" % j['name'])
        print("  ID: %s" % j['id'])
        print("  Status: %s" % j['status'])
        print("  Stats: %s\n" % json.dumps(j['kpis']))

        print("[2] Récupérer les détails complets...")
        detail = get_journey_detail(j['id'])
        print("[OK] Détails récupérés")
        print("  Activités: %d" % len(detail.get('activities', [])))

        # Check pour les email activities
        email_acts = [a for a in detail.get('activities', [])
                     if 'EMAIL' in (a.get('type') or '').upper()]
        print("  Email activities: %d\n" % len(email_acts))

        if email_acts:
            print("[3] Check les triggeredSendKey...")
            for act in email_acts:
                cfg = act.get('configurationArguments', {})
                ts_key = cfg.get('triggeredSendKey') or cfg.get('triggeredSendExternalKey')
                print("  Activité: %s" % act.get('name'))
                print("    Type: %s" % act.get('type'))
                print("    triggeredSendKey: %s\n" % ts_key)

        print("[4] Récupérer les email KPIs...")
        email_kpis = get_journey_email_kpis(detail)
        print("[OK] Email KPIs récupérés")
        print("  Sent: %d" % email_kpis.get('sent', 0))
        print("  Delivered: %d" % email_kpis.get('delivered', 0))
        print("  Open Rate: %.2f%%" % email_kpis.get('open_rate', 0))
        print("  CTR: %.2f%%" % email_kpis.get('ctr', 0))
        print("  Bounce Rate: %.2f%%" % email_kpis.get('bounce_rate', 0))
        print("  Data Available: %s" % email_kpis.get('data_available'))
        print("  Source: %s\n" % email_kpis.get('source'))

        print("[5] Check ExecutionLog dans SFMC DE...")
        exec_logs = read_de('execution_log', filters={
            'component_id': j['id']
        }, max_rows=5)
        print("[OK] Execution logs trouvés: %d" % len(exec_logs))
        for log in exec_logs[:3]:
            print("  %s → %s (%ss)" % (log.get('start_time'), log.get('status'), log.get('duration_seconds')))

        print("\n" + "=" * 100)
        print("RÉSULTAT FINAL")
        print("=" * 100)

        if email_kpis.get('sent', 0) > 0:
            print("[VRAI] DONNÉES RÉELLES DÉTECTÉES!")
            print("       %d emails envoyés" % email_kpis.get('sent'))
        else:
            print("[MOCK] DONNÉES À 0 - Vérifiez:")
            print("       1. triggeredSendKey configurée? %s" % bool(email_acts))
            print("       2. Journey exécuté? %s" % (len(exec_logs) > 0))
            print("       3. Contacts ciblés? %d" % detail.get('stats', {}).get('currentPopulation', 0))

        print("\n")

except Exception as e:
    print("[ERREUR] %s" % str(e))
    import traceback
    traceback.print_exc()
