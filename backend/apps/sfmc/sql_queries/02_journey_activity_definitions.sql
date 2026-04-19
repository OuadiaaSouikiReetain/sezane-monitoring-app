-- ============================================================
-- Query Activity 2 : Journey Activity Definitions Snapshot
-- ============================================================
-- Source    : _Journey + _JourneyActivity (Data Views SFMC)
-- Cible     : KPI_Value DE (champ kpi_id = 'journey.activity_def')
-- Fréquence : Quotidienne (les définitions changent peu)
-- Rôle      : Snapshot des activités email de chaque journey
--             actif → permet au backend Django de lier
--             TriggererSendDefinitionObjectID → JourneyID.
--
-- ⚠️  _JourneyActivity ne contient PAS d'événements contact.
--     Pour les KPIs de flux contacts (entrées, sorties, funnel),
--     utiliser la REST API Journey Builder :
--     GET /interaction/v1/interactions/{id}?extras=all
--     → stats.currentPopulation, cumulativePopulation, metGoal
-- ============================================================

SELECT
    -- PK stable : JourneyActivityObjectID est unique par activité/version
    CONVERT(VARCHAR(255), ja.JourneyActivityObjectID)
        + '::journey.activity_def'                       AS id_value,
    'journey.activity_def'                               AS kpi_id,
    'journey'                                            AS component_type,
    CONVERT(VARCHAR(255), j.JourneyID)                   AS component_id,
    -- Encode les infos utiles en JSON-like string dans value
    '{"version_id":"' + CONVERT(VARCHAR(255), j.VersionID)
        + '","version":' + CONVERT(VARCHAR(10), j.VersionNumber)
        + ',"activity_name":"' + REPLACE(ja.ActivityName, '"', '''')
        + '","activity_type":"' + ISNULL(ja.ActivityType, '')
        + '","activity_object_id":"' + CONVERT(VARCHAR(255), ja.JourneyActivityObjectID)
        + '","journey_name":"' + REPLACE(j.JourneyName, '"', '''')
        + '","journey_status":"' + ISNULL(j.JourneyStatus, '')
        + '"}'                                           AS value,
    '_Journey+_JourneyActivity'                          AS source,
    'daily'                                              AS granularity,
    GETDATE()                                            AS timestamp

FROM _JourneyActivity ja
INNER JOIN _Journey j
    ON ja.VersionID = j.VersionID

WHERE
    j.JourneyStatus IN ('Active', 'Draft')
    AND ja.ActivityType IN ('EMAILV2', 'EMAIL', 'EMAILSEND', 'WAIT',
                            'SPLIT', 'QUERY', 'RANDOM')
