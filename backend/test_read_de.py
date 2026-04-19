import os, sys, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.sfmc.data_extensions import read_de, debug_de

print("\n=== 1. Format brut SFMC (2 lignes) ===")
raw = debug_de('execution_log', limit=2)
for r in raw:
    print(r)

print("\n=== 2. Apres traitement read_de (2 lignes) ===")
rows = read_de('execution_log', max_rows=2)
for r in rows:
    print(r)

print("\n=== 3. Valeurs component_id (10 premieres) ===")
rows = read_de('execution_log', max_rows=10)
for r in rows:
    print("component_id:", r.get('component_id'), " | status:", r.get('status'))
