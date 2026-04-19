-- ============================================================
-- Query Activity 3 : Email KPI Values
-- ============================================================
-- Source    : _Sent, _Open, _Click, _Bounce, _Unsubscribe
-- Cible     : KPI_Value
-- Fréquence : Toutes les heures
-- Rôle      : Calcule open_rate, CTR, bounce_rate, delivery_rate,
--             unsubscribe_rate par triggered send (= activité email
--             dans un journey ou une automation).
-- ============================================================

SELECT
    NEWID()                                                         AS id_value,
    'open_rate'                                                     AS kpi_id,
    'journey'                                                       AS component_type,
    s.TriggererSendDefinitionObjectID                               AS component_id,
    CAST(
        COUNT(DISTINCT o.SubscriberKey) * 100.0
        / NULLIF(COUNT(DISTINCT s.SubscriberKey), 0)
    AS DECIMAL(10,4))                                               AS value,
    '_Open/_Sent'                                                   AS source,
    'hourly'                                                        AS granularity,
    GETDATE()                                                       AS timestamp

FROM _Sent s
LEFT JOIN _Open o
    ON  s.JobID         = o.JobID
    AND s.SubscriberKey = o.SubscriberKey
    AND s.ListID        = o.ListID

WHERE
    s.EventDate >= DATEADD(DAY, -1, GETDATE())
    AND s.TriggererSendDefinitionObjectID IS NOT NULL

GROUP BY s.TriggererSendDefinitionObjectID

UNION ALL

-- ── CTR ──────────────────────────────────────────────────────────────────────
SELECT
    NEWID()                                                         AS id_value,
    'ctr'                                                           AS kpi_id,
    'journey'                                                       AS component_type,
    s.TriggererSendDefinitionObjectID                               AS component_id,
    CAST(
        COUNT(DISTINCT c.SubscriberKey) * 100.0
        / NULLIF(COUNT(DISTINCT s.SubscriberKey), 0)
    AS DECIMAL(10,4))                                               AS value,
    '_Click/_Sent'                                                  AS source,
    'hourly'                                                        AS granularity,
    GETDATE()                                                       AS timestamp

FROM _Sent s
LEFT JOIN _Click c
    ON  s.JobID         = c.JobID
    AND s.SubscriberKey = c.SubscriberKey

WHERE
    s.EventDate >= DATEADD(DAY, -1, GETDATE())
    AND s.TriggererSendDefinitionObjectID IS NOT NULL

GROUP BY s.TriggererSendDefinitionObjectID

UNION ALL

-- ── Bounce rate ───────────────────────────────────────────────────────────────
SELECT
    NEWID()                                                         AS id_value,
    'bounce_rate'                                                   AS kpi_id,
    'journey'                                                       AS component_type,
    s.TriggererSendDefinitionObjectID                               AS component_id,
    CAST(
        COUNT(DISTINCT b.SubscriberKey) * 100.0
        / NULLIF(COUNT(DISTINCT s.SubscriberKey), 0)
    AS DECIMAL(10,4))                                               AS value,
    '_Bounce/_Sent'                                                 AS source,
    'hourly'                                                        AS granularity,
    GETDATE()                                                       AS timestamp

FROM _Sent s
LEFT JOIN _Bounce b
    ON  s.JobID         = b.JobID
    AND s.SubscriberKey = b.SubscriberKey

WHERE
    s.EventDate >= DATEADD(DAY, -1, GETDATE())
    AND s.TriggererSendDefinitionObjectID IS NOT NULL

GROUP BY s.TriggererSendDefinitionObjectID

UNION ALL

-- ── Unsubscribe rate ─────────────────────────────────────────────────────────
SELECT
    NEWID()                                                         AS id_value,
    'unsubscribe_rate'                                              AS kpi_id,
    'journey'                                                       AS component_type,
    s.TriggererSendDefinitionObjectID                               AS component_id,
    CAST(
        COUNT(DISTINCT u.SubscriberKey) * 100.0
        / NULLIF(COUNT(DISTINCT s.SubscriberKey), 0)
    AS DECIMAL(10,4))                                               AS value,
    '_Unsubscribe/_Sent'                                            AS source,
    'hourly'                                                        AS granularity,
    GETDATE()                                                       AS timestamp

FROM _Sent s
LEFT JOIN _Unsubscribe u
    ON  s.SubscriberKey = u.SubscriberKey

WHERE
    s.EventDate >= DATEADD(DAY, -1, GETDATE())
    AND s.TriggererSendDefinitionObjectID IS NOT NULL

GROUP BY s.TriggererSendDefinitionObjectID
