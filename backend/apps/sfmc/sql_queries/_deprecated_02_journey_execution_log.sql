-- ============================================================
-- Query Activity 2 : Journey Execution Log
-- ============================================================
-- Source    : _JourneyActivity (Data View SFMC)
-- Cible     : ExecutionLog
-- Fréquence : Toutes les heures
-- Rôle      : Résumé horaire des contacts entrés/sortis par
--             journey, stocké comme un "run" de journey.
-- ============================================================

SELECT
    NEWID()                                         AS id_log,
    NULL                                            AS sfmc_instance_id,
    'journey'                                       AS component_type,
    j.VersionID                                     AS component_id,
    j.JourneyName                                   AS component_name,
    j.ActivityID                                    AS activity_id,
    j.ActivityName                                  AS activity_name,
    j.ActivityType                                  AS activity_type,
    NULL                                            AS step_id,
    CASE j.Event
        WHEN 'EnteredJourney'      THEN 'entry'
        WHEN 'ExitedJourney'       THEN 'exit'
        WHEN 'GoalMetExitCriteria' THEN 'goal_met'
        ELSE j.Event
    END                                             AS status,
    'journey_builder'                               AS triggered_by,
    j.EventDate                                     AS start_time,
    NULL                                            AS end_time,
    NULL                                            AS duration_seconds,
    NULL                                            AS error_code,
    NULL                                            AS error_message

FROM _JourneyActivity j

WHERE
    j.EventDate >= DATEADD(HOUR, -2, GETDATE())
    AND j.EventDate IS NOT NULL
