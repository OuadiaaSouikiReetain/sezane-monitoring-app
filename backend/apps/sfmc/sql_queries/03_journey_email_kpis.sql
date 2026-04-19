-- ============================================================
-- Query Activity 3 : Journey Email KPIs
-- ============================================================
-- Source    : _Sent, _Open, _Click, _Bounce, _Unsubscribe
--             + _JourneyActivity (pour le contexte journey)
-- Cible     : KPI_Value DE
-- Fréquence : Toutes les heures
-- Mode DE   : Overwrite (remplace le snapshot précédent)
--
-- Rôle      : Calcule les KPIs email pour chaque activité email
--             de journey sur les 30 derniers jours.
--             component_id = JourneyActivityObjectID (activité)
--             → le backend Django agrège par JourneyID.
--
-- ⚠️  Bugs corrigés vs version initiale :
--     1. id_value stable (pas NEWID) → upsert idempotent
--     2. JOIN _Unsubscribe sur JobID + SubscriberKey (pas seulement SubscriberKey)
--     3. Fenêtre 30 jours au lieu de 1 jour
--     4. Ajout : deliverability_rate, hard_bounce_rate, soft_bounce_rate, ctor
-- ============================================================

-- ── Sent count (base pour tous les calculs) ───────────────────────────────────
SELECT
    CONVERT(VARCHAR(255), s.TriggererSendDefinitionObjectID)
        + '::email.sent_count'                                    AS id_value,
    'email.sent_count'                                            AS kpi_id,
    'journey'                                                     AS component_type,
    CONVERT(VARCHAR(255), s.TriggererSendDefinitionObjectID)      AS component_id,
    CAST(COUNT(DISTINCT s.SubscriberKey) AS DECIMAL(18,4))        AS value,
    '_Sent'                                                       AS source,
    '30d'                                                         AS granularity,
    GETDATE()                                                     AS timestamp
FROM _Sent s
WHERE s.EventDate >= DATEADD(DAY, -30, GETDATE())
  AND s.TriggererSendDefinitionObjectID IS NOT NULL
GROUP BY s.TriggererSendDefinitionObjectID

UNION ALL

-- ── Deliverability rate : (sent - bounced) / sent ────────────────────────────
SELECT
    CONVERT(VARCHAR(255), s.TriggererSendDefinitionObjectID)
        + '::email.deliverability_rate'                           AS id_value,
    'email.deliverability_rate'                                   AS kpi_id,
    'journey'                                                     AS component_type,
    CONVERT(VARCHAR(255), s.TriggererSendDefinitionObjectID)      AS component_id,
    CAST(
        (COUNT(DISTINCT s.SubscriberKey)
            - COUNT(DISTINCT b.SubscriberKey)) * 1.0
        / NULLIF(COUNT(DISTINCT s.SubscriberKey), 0)
    AS DECIMAL(10,6))                                             AS value,
    '_Sent+_Bounce'                                               AS source,
    '30d'                                                         AS granularity,
    GETDATE()                                                     AS timestamp
FROM _Sent s
LEFT JOIN _Bounce b
    ON  s.JobID         = b.JobID
    AND s.SubscriberKey = b.SubscriberKey
WHERE s.EventDate >= DATEADD(DAY, -30, GETDATE())
  AND s.TriggererSendDefinitionObjectID IS NOT NULL
GROUP BY s.TriggererSendDefinitionObjectID

UNION ALL

-- ── Open rate : unique opens / sent ──────────────────────────────────────────
SELECT
    CONVERT(VARCHAR(255), s.TriggererSendDefinitionObjectID)
        + '::email.open_rate'                                     AS id_value,
    'email.open_rate'                                             AS kpi_id,
    'journey'                                                     AS component_type,
    CONVERT(VARCHAR(255), s.TriggererSendDefinitionObjectID)      AS component_id,
    CAST(
        COUNT(DISTINCT o.SubscriberKey) * 1.0
        / NULLIF(COUNT(DISTINCT s.SubscriberKey), 0)
    AS DECIMAL(10,6))                                             AS value,
    '_Open+_Sent'                                                 AS source,
    '30d'                                                         AS granularity,
    GETDATE()                                                     AS timestamp
FROM _Sent s
LEFT JOIN _Open o
    ON  s.JobID         = o.JobID
    AND s.SubscriberKey = o.SubscriberKey
    AND o.IsUnique      = 1
WHERE s.EventDate >= DATEADD(DAY, -30, GETDATE())
  AND s.TriggererSendDefinitionObjectID IS NOT NULL
GROUP BY s.TriggererSendDefinitionObjectID

UNION ALL

-- ── Click rate : unique clicks / sent ────────────────────────────────────────
SELECT
    CONVERT(VARCHAR(255), s.TriggererSendDefinitionObjectID)
        + '::email.click_rate'                                    AS id_value,
    'email.click_rate'                                            AS kpi_id,
    'journey'                                                     AS component_type,
    CONVERT(VARCHAR(255), s.TriggererSendDefinitionObjectID)      AS component_id,
    CAST(
        COUNT(DISTINCT c.SubscriberKey) * 1.0
        / NULLIF(COUNT(DISTINCT s.SubscriberKey), 0)
    AS DECIMAL(10,6))                                             AS value,
    '_Click+_Sent'                                                AS source,
    '30d'                                                         AS granularity,
    GETDATE()                                                     AS timestamp
FROM _Sent s
LEFT JOIN _Click c
    ON  s.JobID         = c.JobID
    AND s.SubscriberKey = c.SubscriberKey
    AND c.IsUnique      = 1
WHERE s.EventDate >= DATEADD(DAY, -30, GETDATE())
  AND s.TriggererSendDefinitionObjectID IS NOT NULL
GROUP BY s.TriggererSendDefinitionObjectID

UNION ALL

-- ── CTOR : unique clicks / unique opens ──────────────────────────────────────
SELECT
    CONVERT(VARCHAR(255), s.TriggererSendDefinitionObjectID)
        + '::email.ctor'                                          AS id_value,
    'email.ctor'                                                  AS kpi_id,
    'journey'                                                     AS component_type,
    CONVERT(VARCHAR(255), s.TriggererSendDefinitionObjectID)      AS component_id,
    CAST(
        COUNT(DISTINCT c.SubscriberKey) * 1.0
        / NULLIF(COUNT(DISTINCT o.SubscriberKey), 0)
    AS DECIMAL(10,6))                                             AS value,
    '_Click+_Open'                                                AS source,
    '30d'                                                         AS granularity,
    GETDATE()                                                     AS timestamp
FROM _Sent s
LEFT JOIN _Open o
    ON  s.JobID         = o.JobID
    AND s.SubscriberKey = o.SubscriberKey
    AND o.IsUnique      = 1
LEFT JOIN _Click c
    ON  s.JobID         = c.JobID
    AND s.SubscriberKey = c.SubscriberKey
    AND c.IsUnique      = 1
WHERE s.EventDate >= DATEADD(DAY, -30, GETDATE())
  AND s.TriggererSendDefinitionObjectID IS NOT NULL
GROUP BY s.TriggererSendDefinitionObjectID

UNION ALL

-- ── Bounce rate total : bounces / sent ───────────────────────────────────────
SELECT
    CONVERT(VARCHAR(255), s.TriggererSendDefinitionObjectID)
        + '::email.bounce_rate'                                   AS id_value,
    'email.bounce_rate'                                           AS kpi_id,
    'journey'                                                     AS component_type,
    CONVERT(VARCHAR(255), s.TriggererSendDefinitionObjectID)      AS component_id,
    CAST(
        COUNT(DISTINCT b.SubscriberKey) * 1.0
        / NULLIF(COUNT(DISTINCT s.SubscriberKey), 0)
    AS DECIMAL(10,6))                                             AS value,
    '_Bounce+_Sent'                                               AS source,
    '30d'                                                         AS granularity,
    GETDATE()                                                     AS timestamp
FROM _Sent s
LEFT JOIN _Bounce b
    ON  s.JobID         = b.JobID
    AND s.SubscriberKey = b.SubscriberKey
WHERE s.EventDate >= DATEADD(DAY, -30, GETDATE())
  AND s.TriggererSendDefinitionObjectID IS NOT NULL
GROUP BY s.TriggererSendDefinitionObjectID

UNION ALL

-- ── Hard bounce rate ─────────────────────────────────────────────────────────
SELECT
    CONVERT(VARCHAR(255), s.TriggererSendDefinitionObjectID)
        + '::email.hard_bounce_rate'                              AS id_value,
    'email.hard_bounce_rate'                                      AS kpi_id,
    'journey'                                                     AS component_type,
    CONVERT(VARCHAR(255), s.TriggererSendDefinitionObjectID)      AS component_id,
    CAST(
        COUNT(DISTINCT CASE WHEN b.BounceType = 'H' THEN b.SubscriberKey END) * 1.0
        / NULLIF(COUNT(DISTINCT s.SubscriberKey), 0)
    AS DECIMAL(10,6))                                             AS value,
    '_Bounce(H)+_Sent'                                            AS source,
    '30d'                                                         AS granularity,
    GETDATE()                                                     AS timestamp
FROM _Sent s
LEFT JOIN _Bounce b
    ON  s.JobID         = b.JobID
    AND s.SubscriberKey = b.SubscriberKey
WHERE s.EventDate >= DATEADD(DAY, -30, GETDATE())
  AND s.TriggererSendDefinitionObjectID IS NOT NULL
GROUP BY s.TriggererSendDefinitionObjectID

UNION ALL

-- ── Soft bounce rate ─────────────────────────────────────────────────────────
SELECT
    CONVERT(VARCHAR(255), s.TriggererSendDefinitionObjectID)
        + '::email.soft_bounce_rate'                              AS id_value,
    'email.soft_bounce_rate'                                      AS kpi_id,
    'journey'                                                     AS component_type,
    CONVERT(VARCHAR(255), s.TriggererSendDefinitionObjectID)      AS component_id,
    CAST(
        COUNT(DISTINCT CASE WHEN b.BounceType = 'S' THEN b.SubscriberKey END) * 1.0
        / NULLIF(COUNT(DISTINCT s.SubscriberKey), 0)
    AS DECIMAL(10,6))                                             AS value,
    '_Bounce(S)+_Sent'                                            AS source,
    '30d'                                                         AS granularity,
    GETDATE()                                                     AS timestamp
FROM _Sent s
LEFT JOIN _Bounce b
    ON  s.JobID         = b.JobID
    AND s.SubscriberKey = b.SubscriberKey
WHERE s.EventDate >= DATEADD(DAY, -30, GETDATE())
  AND s.TriggererSendDefinitionObjectID IS NOT NULL
GROUP BY s.TriggererSendDefinitionObjectID

UNION ALL

-- ── Unsubscribe rate : unsubs / sent (join sur JobID + SubscriberKey) ────────
SELECT
    CONVERT(VARCHAR(255), s.TriggererSendDefinitionObjectID)
        + '::email.unsub_rate'                                    AS id_value,
    'email.unsub_rate'                                            AS kpi_id,
    'journey'                                                     AS component_type,
    CONVERT(VARCHAR(255), s.TriggererSendDefinitionObjectID)      AS component_id,
    CAST(
        COUNT(DISTINCT u.SubscriberKey) * 1.0
        / NULLIF(COUNT(DISTINCT s.SubscriberKey), 0)
    AS DECIMAL(10,6))                                             AS value,
    '_Unsubscribe+_Sent'                                          AS source,
    '30d'                                                         AS granularity,
    GETDATE()                                                     AS timestamp
FROM _Sent s
LEFT JOIN _Unsubscribe u
    ON  s.JobID         = u.JobID
    AND s.SubscriberKey = u.SubscriberKey
WHERE s.EventDate >= DATEADD(DAY, -30, GETDATE())
  AND s.TriggererSendDefinitionObjectID IS NOT NULL
GROUP BY s.TriggererSendDefinitionObjectID
