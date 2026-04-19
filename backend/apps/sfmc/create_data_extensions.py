"""
Script de création des Data Extensions SFMC via SOAP API.
Le REST API SFMC ne supporte pas la création de DEs — on utilise le SOAP API.

Usage :
    cd backend
    venv\\Scripts\\activate
    python manage.py shell -c "from apps.sfmc.create_data_extensions import create_all_des; create_all_des()"
"""
import logging
import requests
from django.conf import settings

try:
    from .client import get_token
except ImportError:
    from client import get_token

logger = logging.getLogger(__name__)


# ─── Endpoint SOAP ───────────────────────────────────────────────────────────
def _get_soap_url() -> str:
    """Dérive l'URL SOAP depuis l'URL d'auth SFMC."""
    auth_uri = settings.SFMC_AUTH_BASE_URI.rstrip('/')
    # https://XXXX.auth.marketingcloudapis.com → https://XXXX.soap.marketingcloudapis.com
    soap_uri = auth_uri.replace('.auth.', '.soap.')
    return f"{soap_uri}/Service.asmx"


FOLDER_CATEGORY_ID = 52195  # Dossier cible dans SFMC


def _soap_move_de(external_key: str, category_id: int) -> tuple[bool, str]:
    """Déplace une DE existante vers un dossier (Update CategoryID)."""
    token    = get_token()
    soap_url = _get_soap_url()

    soap_body = f"""<?xml version="1.0" encoding="UTF-8"?>
<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <s:Header>
    <fueloauth xmlns="http://exacttarget.com">{token}</fueloauth>
  </s:Header>
  <s:Body>
    <UpdateRequest xmlns="http://exacttarget.com/wsdl/partnerAPI">
      <Objects xsi:type="DataExtension">
        <CategoryID>{category_id}</CategoryID>
        <CustomerKey>{external_key}</CustomerKey>
      </Objects>
    </UpdateRequest>
  </s:Body>
</s:Envelope>"""

    try:
        resp = requests.post(
            soap_url,
            data=soap_body.encode("utf-8"),
            headers={"Content-Type": "text/xml; charset=utf-8", "SOAPAction": "Update"},
            timeout=30,
        )
        body = resp.text
        if "<StatusCode>OK</StatusCode>" in body:
            return True, "déplacée"
        else:
            import re
            match = re.search(r"<StatusMessage>(.*?)</StatusMessage>", body)
            return False, match.group(1) if match else body[:200]
    except requests.RequestException as e:
        return False, str(e)


def _soap_create_de(name: str, external_key: str, fields: list) -> tuple[bool, str]:
    """
    Crée une Data Extension via SOAP API.
    Retourne (succès, message).
    """
    token    = get_token()
    soap_url = _get_soap_url()

    # ── Construction des champs XML ──────────────────────────────────────────
    fields_xml = ""
    category_xml = f"<CategoryID>{FOLDER_CATEGORY_ID}</CategoryID>"
    for f in fields:
        field_type = f["type"]
        extra = ""
        if field_type == "Text":
            extra = f"<MaxLength>{f.get('length', 255)}</MaxLength>"
        elif field_type == "Decimal":
            extra = f"<Precision>{f.get('precision', 18)}</Precision><Scale>{f.get('scale', 4)}</Scale>"

        fields_xml += f"""
          <Field>
            <Name>{f['name']}</Name>
            <FieldType>{field_type}</FieldType>
            {extra}
            <IsPrimaryKey>{'true' if f.get('isPrimaryKey') else 'false'}</IsPrimaryKey>
            <IsRequired>{'true' if f.get('isRequired') else 'false'}</IsRequired>
            <IsNillable>{'false' if f.get('isRequired') else 'true'}</IsNillable>
          </Field>"""

    # ── Enveloppe SOAP ────────────────────────────────────────────────────────
    soap_body = f"""<?xml version="1.0" encoding="UTF-8"?>
<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope"
            xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <s:Header>
    <fueloauth xmlns="http://exacttarget.com">{token}</fueloauth>
  </s:Header>
  <s:Body>
    <CreateRequest xmlns="http://exacttarget.com/wsdl/partnerAPI">
      <Objects xsi:type="DataExtension">
        <Name>{name}</Name>
        <CustomerKey>{external_key}</CustomerKey>
        {category_xml}
        <Fields>{fields_xml}
        </Fields>
      </Objects>
    </CreateRequest>
  </s:Body>
</s:Envelope>"""

    try:
        resp = requests.post(
            soap_url,
            data=soap_body.encode("utf-8"),
            headers={
                "Content-Type": "text/xml; charset=utf-8",
                "SOAPAction":   "Create",
            },
            timeout=30,
        )

        body = resp.text

        if "<StatusCode>OK</StatusCode>" in body:
            return True, "créée"
        elif "already exists" in body.lower() or "<StatusCode>Error</StatusCode>" in body and "duplicate" in body.lower():
            return True, "déjà existante"
        elif "<StatusCode>Error</StatusCode>" in body:
            # Extraire le message d'erreur
            import re
            match = re.search(r"<StatusMessage>(.*?)</StatusMessage>", body)
            msg = match.group(1) if match else body[:200]
            return False, msg
        else:
            return False, f"Réponse inattendue (HTTP {resp.status_code})"

    except requests.RequestException as e:
        return False, str(e)


# ─── Définition des Data Extensions ──────────────────────────────────────────
DATA_EXTENSIONS = [

    # ── 1. MonitoringConfig ──────────────────────────────────────────────────
    {
        "name":        "MonitoringConfig",
        "externalKey": "MonitoringConfig",
        "fields": [
            {"name": "id_config",            "type": "Text",    "length": 36,  "isPrimaryKey": True,  "isRequired": True},
            {"name": "component_type",       "type": "Text",    "length": 50,  "isPrimaryKey": False, "isRequired": True},
            {"name": "component_id",         "type": "Text",    "length": 100, "isPrimaryKey": False, "isRequired": True},
            {"name": "component_name",       "type": "Text",    "length": 255, "isPrimaryKey": False, "isRequired": False},
            {"name": "monitored",            "type": "Boolean",                "isPrimaryKey": False, "isRequired": False},
            {"name": "expected_schedule",    "type": "Text",    "length": 100, "isPrimaryKey": False, "isRequired": False},
            {"name": "max_duration_minutes", "type": "Number",                 "isPrimaryKey": False, "isRequired": False},
            {"name": "min_success_rate",     "type": "Decimal", "precision": 5, "scale": 2, "isPrimaryKey": False, "isRequired": False},
            {"name": "created_at",           "type": "Date",                   "isPrimaryKey": False, "isRequired": False},
            {"name": "updated_at",           "type": "Date",                   "isPrimaryKey": False, "isRequired": False},
        ]
    },

    # ── 2. MonitoringRule ────────────────────────────────────────────────────
    {
        "name":        "MonitoringRule",
        "externalKey": "MonitoringRule",
        "fields": [
            {"name": "id_rule",           "type": "Text",    "length": 36,  "isPrimaryKey": True,  "isRequired": True},
            {"name": "kpi_id",            "type": "Text",    "length": 36,  "isPrimaryKey": False, "isRequired": False},
            {"name": "name",              "type": "Text",    "length": 255, "isPrimaryKey": False, "isRequired": True},
            {"name": "component_type",    "type": "Text",    "length": 50,  "isPrimaryKey": False, "isRequired": False},
            {"name": "component_id",      "type": "Text",    "length": 100, "isPrimaryKey": False, "isRequired": False},
            {"name": "component_name",    "type": "Text",    "length": 255, "isPrimaryKey": False, "isRequired": False},
            {"name": "condition_type",    "type": "Text",    "length": 50,  "isPrimaryKey": False, "isRequired": False},
            {"name": "threshold_value",   "type": "Decimal", "precision": 10, "scale": 4, "isPrimaryKey": False, "isRequired": False},
            {"name": "comparison_period", "type": "Number",                  "isPrimaryKey": False, "isRequired": False},
            {"name": "comparison_delta",  "type": "Decimal", "precision": 10, "scale": 4, "isPrimaryKey": False, "isRequired": False},
            {"name": "cooldown_minutes",  "type": "Number",                  "isPrimaryKey": False, "isRequired": False},
            {"name": "active",            "type": "Boolean",                 "isPrimaryKey": False, "isRequired": False},
            {"name": "created_at",        "type": "Date",                    "isPrimaryKey": False, "isRequired": False},
        ]
    },

    # ── 3. SyncLog ───────────────────────────────────────────────────────────
    {
        "name":        "SyncLog",
        "externalKey": "SyncLog",
        "fields": [
            {"name": "id_sync",          "type": "Text",   "length": 36,  "isPrimaryKey": True,  "isRequired": True},
            {"name": "source",           "type": "Text",   "length": 100, "isPrimaryKey": False, "isRequired": False},
            {"name": "synced_from",      "type": "Date",                  "isPrimaryKey": False, "isRequired": False},
            {"name": "synced_to",        "type": "Date",                  "isPrimaryKey": False, "isRequired": False},
            {"name": "records_fetched",  "type": "Number",                "isPrimaryKey": False, "isRequired": False},
            {"name": "records_inserted", "type": "Number",                "isPrimaryKey": False, "isRequired": False},
            {"name": "records_skipped",  "type": "Number",                "isPrimaryKey": False, "isRequired": False},
            {"name": "status",           "type": "Text",   "length": 20,  "isPrimaryKey": False, "isRequired": False},
            {"name": "error_message",    "type": "Text",   "length": 500, "isPrimaryKey": False, "isRequired": False},
            {"name": "executed_at",      "type": "Date",                  "isPrimaryKey": False, "isRequired": False},
        ]
    },

    # ── 4. ExecutionLog ──────────────────────────────────────────────────────
    {
        "name":        "ExecutionLog",
        "externalKey": "ExecutionLog",
        "fields": [
            {"name": "id_log",           "type": "Text",    "length": 36,  "isPrimaryKey": True,  "isRequired": True},
            {"name": "sfmc_instance_id", "type": "Text",    "length": 100, "isPrimaryKey": False, "isRequired": False},
            {"name": "component_type",   "type": "Text",    "length": 50,  "isPrimaryKey": False, "isRequired": False},
            {"name": "component_id",     "type": "Text",    "length": 100, "isPrimaryKey": False, "isRequired": True},
            {"name": "component_name",   "type": "Text",    "length": 255, "isPrimaryKey": False, "isRequired": False},
            {"name": "activity_id",      "type": "Text",    "length": 100, "isPrimaryKey": False, "isRequired": False},
            {"name": "activity_name",    "type": "Text",    "length": 255, "isPrimaryKey": False, "isRequired": False},
            {"name": "activity_type",    "type": "Text",    "length": 50,  "isPrimaryKey": False, "isRequired": False},
            {"name": "step_id",          "type": "Text",    "length": 100, "isPrimaryKey": False, "isRequired": False},
            {"name": "status",           "type": "Text",    "length": 20,  "isPrimaryKey": False, "isRequired": False},
            {"name": "triggered_by",     "type": "Text",    "length": 50,  "isPrimaryKey": False, "isRequired": False},
            {"name": "start_time",       "type": "Date",                   "isPrimaryKey": False, "isRequired": False},
            {"name": "end_time",         "type": "Date",                   "isPrimaryKey": False, "isRequired": False},
            {"name": "duration_seconds", "type": "Decimal", "precision": 10, "scale": 3, "isPrimaryKey": False, "isRequired": False},
            {"name": "error_code",       "type": "Text",    "length": 50,  "isPrimaryKey": False, "isRequired": False},
            {"name": "error_message",    "type": "Text",    "length": 500, "isPrimaryKey": False, "isRequired": False},
        ]
    },

    # ── 5. KPI ───────────────────────────────────────────────────────────────
    {
        "name":        "KPI",
        "externalKey": "KPI",
        "fields": [
            {"name": "id_kpi",             "type": "Text", "length": 36,  "isPrimaryKey": True,  "isRequired": True},
            {"name": "name",               "type": "Text", "length": 255, "isPrimaryKey": False, "isRequired": True},
            {"name": "description",        "type": "Text", "length": 500, "isPrimaryKey": False, "isRequired": False},
            {"name": "component_type",     "type": "Text", "length": 50,  "isPrimaryKey": False, "isRequired": False},
            {"name": "unit",               "type": "Text", "length": 50,  "isPrimaryKey": False, "isRequired": False},
            {"name": "calculation_method", "type": "Text", "length": 100, "isPrimaryKey": False, "isRequired": False},
            {"name": "created_at",         "type": "Date",                "isPrimaryKey": False, "isRequired": False},
        ]
    },

    # ── 6. KPI_Value ─────────────────────────────────────────────────────────
    {
        "name":        "KPI_Value",
        "externalKey": "KPI_Value",
        "fields": [
            {"name": "id_value",       "type": "Text",    "length": 36,  "isPrimaryKey": True,  "isRequired": True},
            {"name": "kpi_id",         "type": "Text",    "length": 36,  "isPrimaryKey": False, "isRequired": True},
            {"name": "component_type", "type": "Text",    "length": 50,  "isPrimaryKey": False, "isRequired": False},
            {"name": "component_id",   "type": "Text",    "length": 100, "isPrimaryKey": False, "isRequired": False},
            {"name": "value",          "type": "Decimal", "precision": 18, "scale": 4, "isPrimaryKey": False, "isRequired": True},
            {"name": "source",         "type": "Text",    "length": 50,  "isPrimaryKey": False, "isRequired": False},
            {"name": "granularity",    "type": "Text",    "length": 20,  "isPrimaryKey": False, "isRequired": False},
            {"name": "timestamp",      "type": "Date",                   "isPrimaryKey": False, "isRequired": True},
        ]
    },

    # ── 7. Anomaly ───────────────────────────────────────────────────────────
    {
        "name":        "Anomaly",
        "externalKey": "Anomaly",
        "fields": [
            {"name": "id_anomaly",         "type": "Text",    "length": 36,  "isPrimaryKey": True,  "isRequired": True},
            {"name": "monitoring_rule_id", "type": "Text",    "length": 36,  "isPrimaryKey": False, "isRequired": False},
            {"name": "component_type",     "type": "Text",    "length": 50,  "isPrimaryKey": False, "isRequired": False},
            {"name": "component_id",       "type": "Text",    "length": 100, "isPrimaryKey": False, "isRequired": False},
            {"name": "component_name",     "type": "Text",    "length": 255, "isPrimaryKey": False, "isRequired": False},
            {"name": "type",               "type": "Text",    "length": 50,  "isPrimaryKey": False, "isRequired": False},
            {"name": "severity",           "type": "Text",    "length": 20,  "isPrimaryKey": False, "isRequired": False},
            {"name": "trigger_value",      "type": "Decimal", "precision": 18, "scale": 4, "isPrimaryKey": False, "isRequired": False},
            {"name": "expected_value",     "type": "Decimal", "precision": 18, "scale": 4, "isPrimaryKey": False, "isRequired": False},
            {"name": "status",             "type": "Text",    "length": 20,  "isPrimaryKey": False, "isRequired": False},
            {"name": "detected_at",        "type": "Date",                   "isPrimaryKey": False, "isRequired": False},
            {"name": "resolved_at",        "type": "Date",                   "isPrimaryKey": False, "isRequired": False},
            {"name": "resolved_by",        "type": "Text",    "length": 100, "isPrimaryKey": False, "isRequired": False},
        ]
    },

    # ── 8. NotificationChannel ───────────────────────────────────────────────
    {
        "name":        "NotificationChannel",
        "externalKey": "NotificationChannel",
        "fields": [
            {"name": "id_channel",  "type": "Text",    "length": 36,   "isPrimaryKey": True,  "isRequired": True},
            {"name": "type",        "type": "Text",    "length": 20,   "isPrimaryKey": False, "isRequired": True},
            {"name": "name",        "type": "Text",    "length": 255,  "isPrimaryKey": False, "isRequired": True},
            {"name": "config_json", "type": "Text",    "length": 4000, "isPrimaryKey": False, "isRequired": False},
            {"name": "active",      "type": "Boolean",                 "isPrimaryKey": False, "isRequired": False},
            {"name": "created_at",  "type": "Date",                    "isPrimaryKey": False, "isRequired": False},
        ]
    },

    # ── 9. Alert ─────────────────────────────────────────────────────────────
    {
        "name":        "Alert",
        "externalKey": "Alert",
        "fields": [
            {"name": "id_alert",                "type": "Text",    "length": 36,   "isPrimaryKey": True,  "isRequired": True},
            {"name": "anomaly_id",              "type": "Text",    "length": 36,   "isPrimaryKey": False, "isRequired": False},
            {"name": "notification_channel_id", "type": "Text",    "length": 36,   "isPrimaryKey": False, "isRequired": False},
            {"name": "message",                 "type": "Text",    "length": 2000, "isPrimaryKey": False, "isRequired": False},
            {"name": "priority",                "type": "Text",    "length": 20,   "isPrimaryKey": False, "isRequired": False},
            {"name": "status",                  "type": "Text",    "length": 20,   "isPrimaryKey": False, "isRequired": False},
            {"name": "sent_at",                 "type": "Date",                    "isPrimaryKey": False, "isRequired": False},
            {"name": "acknowledged_at",         "type": "Date",                    "isPrimaryKey": False, "isRequired": False},
            {"name": "acknowledged_by",         "type": "Text",    "length": 100,  "isPrimaryKey": False, "isRequired": False},
            {"name": "retry_count",             "type": "Number",                  "isPrimaryKey": False, "isRequired": False},
        ]
    },

    # ── 10. AlertRecipient ───────────────────────────────────────────────────
    {
        "name":        "AlertRecipient",
        "externalKey": "AlertRecipient",
        "fields": [
            {"name": "id",       "type": "Text", "length": 36, "isPrimaryKey": True,  "isRequired": True},
            {"name": "alert_id", "type": "Text", "length": 36, "isPrimaryKey": False, "isRequired": True},
            {"name": "user_id",  "type": "Text", "length": 36, "isPrimaryKey": False, "isRequired": True},
        ]
    },
]


# ─── Fonction principale ──────────────────────────────────────────────────────
def create_all_des(dry_run: bool = False) -> None:
    total   = len(DATA_EXTENSIONS)
    success = 0
    errors  = []

    print(f"\n{'─' * 60}")
    print(f"  Création de {total} Data Extensions SFMC (SOAP API)")
    print(f"  SOAP URL : {_get_soap_url()}")
    print(f"{'─' * 60}\n")

    for de in DATA_EXTENSIONS:
        name = de["name"]
        if dry_run:
            print(f"[DRY RUN] {name} — {len(de['fields'])} champs")
            continue

        ok, msg = _soap_create_de(name, de["externalKey"], de["fields"])
        if ok:
            print(f"  ✅  {name} — {msg}")
            success += 1
        else:
            print(f"  ❌  {name} — {msg}")
            errors.append((name, msg))

    print(f"\n{'─' * 60}")
    if not dry_run:
        print(f"  Résultat : {success}/{total} créées")
        if errors:
            print(f"  Erreurs  :")
            for name, err in errors:
                print(f"    • {name} → {err}")
    print(f"{'─' * 60}\n")


# ─── Déplacement des DEs existantes vers le bon dossier ─────────────────────
def move_all_des() -> None:
    """Déplace les 9 DEs déjà créées vers le dossier CategoryID 52195."""
    already_created = [
        "MonitoringConfig",
        "MonitoringRule",
        "SyncLog",
        "KPI",
        "KPI_Value",
        "Anomaly",
        "NotificationChannel",
        "Alert",
        "AlertRecipient",
    ]

    print(f"\n{'─' * 60}")
    print(f"  Déplacement vers le dossier CategoryID {FOLDER_CATEGORY_ID}")
    print(f"{'─' * 60}\n")

    success = 0
    for key in already_created:
        ok, msg = _soap_move_de(key, FOLDER_CATEGORY_ID)
        if ok:
            print(f"  ✅  {key} — {msg}")
            success += 1
        else:
            print(f"  ❌  {key} — {msg}")

    print(f"\n{'─' * 60}")
    print(f"  Résultat : {success}/{len(already_created)} déplacées")
    print(f"{'─' * 60}\n")


# ─── Ajout d'un champ à une DE existante ────────────────────────────────────
def add_field_to_de(external_key: str, field: dict) -> tuple[bool, str]:
    """
    Ajoute un seul champ à une Data Extension existante via SOAP UpdateRequest.
    Utile pour les migrations de schéma sans recréer la DE.

    Usage :
        add_field_to_de('ExecutionLog', {
            'name': 'activity_type', 'type': 'Text', 'length': 50
        })
    """
    token    = get_token()
    soap_url = _get_soap_url()

    field_type = field["type"]
    extra = ""
    if field_type == "Text":
        extra = f"<MaxLength>{field.get('length', 255)}</MaxLength>"
    elif field_type == "Decimal":
        extra = f"<Precision>{field.get('precision', 18)}</Precision><Scale>{field.get('scale', 4)}</Scale>"

    soap_body = f"""<?xml version="1.0" encoding="UTF-8"?>
<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <s:Header>
    <fueloauth xmlns="http://exacttarget.com">{token}</fueloauth>
  </s:Header>
  <s:Body>
    <UpdateRequest xmlns="http://exacttarget.com/wsdl/partnerAPI">
      <Objects xsi:type="DataExtension">
        <CustomerKey>{external_key}</CustomerKey>
        <Fields>
          <Field>
            <Name>{field['name']}</Name>
            <FieldType>{field_type}</FieldType>
            {extra}
            <IsPrimaryKey>false</IsPrimaryKey>
            <IsRequired>false</IsRequired>
            <IsNillable>true</IsNillable>
          </Field>
        </Fields>
      </Objects>
    </UpdateRequest>
  </s:Body>
</s:Envelope>"""

    try:
        resp = requests.post(
            soap_url,
            data=soap_body.encode("utf-8"),
            headers={"Content-Type": "text/xml; charset=utf-8", "SOAPAction": "Update"},
            timeout=30,
        )
        body = resp.text
        if "<StatusCode>OK</StatusCode>" in body:
            return True, f"champ '{field['name']}' ajouté"
        else:
            import re
            match = re.search(r"<StatusMessage>(.*?)</StatusMessage>", body)
            return False, match.group(1) if match else body[:200]
    except requests.RequestException as e:
        return False, str(e)


def patch_execution_log_add_activity_type() -> None:
    """
    Ajoute le champ activity_type à la DE ExecutionLog existante dans SFMC.

    Usage :
        python manage.py shell -c "
        from apps.sfmc.create_data_extensions import patch_execution_log_add_activity_type
        patch_execution_log_add_activity_type()
        "
    """
    ok, msg = add_field_to_de('ExecutionLog', {
        'name': 'activity_type', 'type': 'Text', 'length': 50
    })
    if ok:
        print(f"  ✅  ExecutionLog — {msg}")
    else:
        print(f"  ❌  ExecutionLog — {msg}")


# ─── Exécution standalone ─────────────────────────────────────────────────────
if __name__ == '__main__':
    import os, sys, django
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
    sys.path.insert(0, backend_dir)
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
    django.setup()
    create_all_des()
