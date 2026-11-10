"""Owner: Axel Mfura (Backend and database) · AI-assisted draft, see AI_USE_LOG.md

Plausibility limits for typed blood pressure numbers. They exist only to reject typing mistakes
such as 1200 or 0. They are NOT clinical thresholds and must never be shown as a "normal range".
Safety rule: a qualified clinician should confirm these limits before real use (open item).
"""
BP_SYSTOLIC_MIN, BP_SYSTOLIC_MAX = 40, 300
BP_DIASTOLIC_MIN, BP_DIASTOLIC_MAX = 20, 200
PULSE_MIN, PULSE_MAX = 20, 250
FUTURE_CLOCK_SKEW_MINUTES = 5
NOTE_MAX_LENGTH = 500
