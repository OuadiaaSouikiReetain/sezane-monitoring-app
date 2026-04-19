-- ============================================================
-- Query Activity 1b : Automation Activity Execution Log
-- ============================================================
-- Source    : _AutomationActivityInstance (Data View SFMC)
-- Cible     : ExecutionLog (même DE que 01_automation_execution_log.sql)
-- Fréquence : Toutes les heures (même automation que 01)
-- Rôle      : Historique par activité (granularité fine) — permet
--             de calculer l'erreur par activité dans l'app.
--
-- ⚠️  id_log = ActivityInstanceID (pas NEWID) :
--     NEWID() génère un UUID aléatoire à chaque run → doublons.
--     ActivityInstanceID est stable → upsert idempotent sur la PK.
-- ============================================================

SELECT
    -- PK stable = pas de doublons si la Query Activity re-tourne
    ActivityInstanceID                                       AS id_log,
    AutomationInstanceID                                     AS sfmc_instance_id,
    'automation'                                             AS component_type,
    AutomationCustomerKey                                    AS component_id,
    AutomationName                                           AS component_name,
    ActivityInstanceID                                       AS activity_id,
    ActivityName                                             AS activity_name,
    ActivityType                                             AS activity_type,
    ActivityInstanceStep                                     AS step_id,
    CASE
        WHEN ActivityInstanceStatus IN ('Complete', 'Completed') THEN 'success'
        WHEN ActivityInstanceStatus = 'Error'                    THEN 'error'
        WHEN ActivityInstanceStatus = 'Running'                  THEN 'running'
        WHEN ActivityInstanceStatus = 'Skipped'                  THEN 'skipped'
        WHEN ActivityInstanceStatus = 'Paused'                   THEN 'paused'
        ELSE LOWER(ActivityInstanceStatus)
    END                                                      AS status,
    NULL                                                     AS triggered_by,
    ActivityInstanceStartTime_UTC                            AS start_time,
    ActivityInstanceEndTime_UTC                              AS end_time,
    CASE
        WHEN ActivityInstanceEndTime_UTC IS NOT NULL
        THEN DATEDIFF(SECOND,
            ActivityInstanceStartTime_UTC,
            ActivityInstanceEndTime_UTC)
        ELSE NULL
    END                                                      AS duration_seconds,
    CASE
        WHEN ActivityInstanceStatus = 'Error' THEN 'ACTIVITY_ERROR'
        ELSE NULL
    END                                                      AS error_code,
    ActivityInstanceStatusDetails                            AS error_message

FROM _AutomationActivityInstance

WHERE
    -- 30 jours : fenêtre large pour les KPIs historiques
    ActivityInstanceStartTime_UTC >= DATEADD(DAY, -30, GETDATE())
    AND ActivityInstanceStartTime_UTC IS NOT NULL
