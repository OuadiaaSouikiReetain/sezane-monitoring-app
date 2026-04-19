-- ============================================================
-- Query Activity 1 : Automation Execution Log
-- ============================================================
-- Source    : _AutomationInstance (Data View SFMC)
-- Cible     : ExecutionLog
-- Fréquence : Toutes les heures (Automation Studio schedule)
-- Rôle      : Historique des runs d'automations avec statut,
--             durée et infos d'activité agrégées.
-- ============================================================

SELECT
    -- ⚠️  id_log = AutomationInstanceID (pas NEWID) pour éviter les doublons :
    --    si la Query Activity est re-lancée dans la même fenêtre, la DE fait
    --    un UPSERT sur la PK et écrase la ligne existante plutôt que d'insérer.
    AutomationInstanceID                                  AS id_log,
    AutomationInstanceID                                  AS sfmc_instance_id,
    'automation'                                          AS component_type,
    AutomationCustomerKey                                 AS component_id,
    AutomationName                                        AS component_name,
    NULL                                                  AS activity_id,
    NULL                                                  AS activity_name,
    NULL                                                  AS activity_type,
    NULL                                                  AS step_id,
    CASE
        WHEN AutomationInstanceStatus IN ('Complete', 'Completed') THEN 'success'
        WHEN AutomationInstanceStatus = 'Error'                    THEN 'error'
        WHEN AutomationInstanceStatus = 'Running'                  THEN 'running'
        WHEN AutomationInstanceStatus = 'Skipped'                  THEN 'skipped'
        WHEN AutomationInstanceStatus = 'Paused'                   THEN 'paused'
        ELSE LOWER(AutomationInstanceStatus)
    END                                                   AS status,
    CASE AutomationInstanceIsRunOnce
        WHEN 1 THEN 'manual'
        ELSE        'scheduled'
    END                                                   AS triggered_by,
    AutomationInstanceStartTime_UTC                       AS start_time,
    AutomationInstanceEndTime_UTC                         AS end_time,
    CAST(
        DATEDIFF(SECOND,
            AutomationInstanceStartTime_UTC,
            AutomationInstanceEndTime_UTC)
    AS DECIMAL(10,3))                                     AS duration_seconds,
    NULL                                                  AS error_code,
    AutomationInstanceActivityErrorDetails                AS error_message

FROM _AutomationInstance

WHERE
    -- Fenêtre glissante : dernières 48 heures (augmentée depuis 2h).
    -- La clé PK = AutomationInstanceID assure l'idempotence (pas de doublons).
    AutomationInstanceStartTime_UTC >= DATEADD(HOUR, -48, GETDATE())
    AND AutomationInstanceStartTime_UTC IS NOT NULL
