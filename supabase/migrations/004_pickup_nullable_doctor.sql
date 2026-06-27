-- Allow voice-created pickup requests where doctor/practice can't be auto-matched
ALTER TABLE pickup_requests ALTER COLUMN doctor_id   DROP NOT NULL;
ALTER TABLE pickup_requests ALTER COLUMN practice_id DROP NOT NULL;

-- Store caller name for voice requests
ALTER TABLE pickup_requests ADD COLUMN IF NOT EXISTS caller_name TEXT;
