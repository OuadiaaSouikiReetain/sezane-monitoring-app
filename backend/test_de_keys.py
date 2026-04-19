"""
Script de diagnostic — trouve la vraie clé externe des DEs SFMC.
Usage : python manage.py shell < test_de_keys.py
  OU  : python test_de_keys.py (depuis le dossier backend avec venv activé)
"""
import os, sys, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.sfmc.client import sfmc_get

keys_to_test = [
    'ExecutionLog',
    'ExecutionLog_DE',
    'Execution_Log',
    'execution_log',
    'KPI_Value',
    'KPI_Value_DE',
    'KPI_DE',
    'KPI',
]

print("\n" + "="*60)
print("  Test des clés externes des DEs SFMC")
print("="*60)

for key in keys_to_test:
    try:
        r = sfmc_get(
            '/data/v1/customobjectdata/key/' + key + '/rowset',
            {'$pageSize': 1}
        )
        count = r.get('count', 0)
        print("OK  " + key + " -> " + str(count) + " rows")
    except Exception as e:
        msg = str(e)[:70]
        print("ERR " + key + " -> " + msg)

print("="*60 + "\n")
