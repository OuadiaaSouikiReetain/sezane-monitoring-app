-- ============================================================
-- Query Activity 4 : Journey Execution Log (via _Sent)
-- ============================================================
-- Source    : _Sent + _JourneyActivity + _Journey
-- Cible     : ExecutionLog DE (même DE que les automations)
-- Fréquence : Toutes les heures
-- Mode DE   : Append  (PK = id_log pour upsert idempotent)
--
-- Rôle      : Génère une ligne "parent" par journey par jour
--             (total emails envoyés ce jour-là) + des lignes
--             "activité" par activité email par jour.
--
--             sfmc_instance_id = JourneyID::date  → même logique
--             de groupement que les automations en frontend.
--
-- ⚠️  _Journey ne contient PAS d'événements contact individuels.
--     Ce fichier utilise _Sent (via TriggererSendDefinitionObjectID
--     = JourneyActivityObjectID) comme proxy d'activité journalière.
--     Les KPIs de flux contacts (currentPopulation, metGoal) viennent
--     de la REST API, pas de cette query.
--
-- Champs id_log stables → pas de doublons si la DE a id_log en PK.
-- ============================================================


-- ── Ligne parent : total sends journaliers par journey ────────────────────────
SELECT
    CONVERT(VARCHAR(255), j.JourneyID)
        + '::sends::' + CONVERT(VARCHAR(10), CAST(s.EventDate AS DATE))      AS id_log,
    'journey'                                                                  AS component_type,
    CONVERT(VARCHAR(255), j.JourneyID)                                         AS component_id,
    NULL                                                                        AS activity_id,
    NULL                                                                        AS activity_name,
    NULL                                                                        AS activity_type,
    CAST(CAST(s.EventDate AS DATE) AS DATETIME)                               AS start_time,
    NULL                                                                        AS end_time,
    NULL                                                                        AS duration_seconds,
    'complete'                                                                  AS status,
    NULL                                                                        AS error_message,
    NULL                                                                        AS error_code,
    CAST(COUNT(DISTINCT s.SubscriberKey) AS VARCHAR(50)) + ' sends'            AS triggered_by,
    CONVERT(VARCHAR(255), j.JourneyID)
        + '::' + CONVERT(VARCHAR(10), CAST(s.EventDate AS DATE))              AS sfmc_instance_id,
    NULL                                                                        AS step_id

FROM _Sent s
INNER JOIN _JourneyActivity ja
    ON  s.TriggererSendDefinitionObjectID = ja.JourneyActivityObjectID
INNER JOIN _Journey j
    ON  ja.VersionID = j.VersionID

WHERE s.EventDate >= DATEADD(DAY, -30, GETDATE())

GROUP BY j.JourneyID, CAST(s.EventDate AS DATE)


UNION ALL


-- ── Lignes activité : sends par activité email par jour ───────────────────────
SELECT
    CONVERT(VARCHAR(255), j.JourneyID)
        + '::act::' + CONVERT(VARCHAR(255), ja.JourneyActivityObjectID)
        + '::' + CONVERT(VARCHAR(10), CAST(s.EventDate AS DATE))              AS id_log,
    'journey'                                                                  AS component_type,
    CONVERT(VARCHAR(255), j.JourneyID)                                         AS component_id,
    CONVERT(VARCHAR(255), ja.JourneyActivityObjectID)                          AS activity_id,
    MAX(ja.ActivityName)                                                        AS activity_name,
    MAX(ja.ActivityType)                                                        AS activity_type,
    CAST(CAST(s.EventDate AS DATE) AS DATETIME)                               AS start_time,
    NULL                                                                        AS end_time,
    NULL                                                                        AS duration_seconds,
    'complete'                                                                  AS status,
    NULL                                                                        AS error_message,
    NULL                                                                        AS error_code,
    CAST(COUNT(DISTINCT s.SubscriberKey) AS VARCHAR(50)) + ' sends'            AS triggered_by,
    CONVERT(VARCHAR(255), j.JourneyID)
        + '::' + CONVERT(VARCHAR(10), CAST(s.EventDate AS DATE))              AS sfmc_instance_id,
    NULL                                                                        AS step_id

FROM _Sent s
INNER JOIN _JourneyActivity ja
    ON  s.TriggererSendDefinitionObjectID = ja.JourneyActivityObjectID
INNER JOIN _Journey j
    ON  ja.VersionID = j.VersionID

WHERE s.EventDate >= DATEADD(DAY, -30, GETDATE())

GROUP BY j.JourneyID, ja.JourneyActivityObjectID, CAST(s.EventDate AS DATE)
