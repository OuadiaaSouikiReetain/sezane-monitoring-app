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
    NEWID()                                               AS id_log,
    AutomationInstanceID                                  AS sfmc_instance_id,
    'automation'                                          AS component_type,
    AutomationCustomerKey                                 AS component_id,
    AutomationName                                        AS component_name,
    NULL                                                  AS activity_id,
    NULL                                                  AS activity_name,
    NULL                                                  AS activity_type,
    NULL                                                  AS step_id,
    LOWER(AutomationInstanceStatus)                       AS status,
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
    -- Fenêtre glissante : dernières 2 heures pour éviter les doublons
    AutomationInstanceStartTime_UTC >= DATEADD(HOUR, -2, GETDATE())
    AND AutomationInstanceStartTime_UTC IS NOT NULL
