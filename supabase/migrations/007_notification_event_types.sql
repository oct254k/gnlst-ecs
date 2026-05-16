-- 007_notification_event_types.sql
-- notification_logs.event_type CHECK 제약에 'common_schedule_deleted' 추가

ALTER TABLE notification_logs
  DROP CONSTRAINT notif_event_type_check;

ALTER TABLE notification_logs
  ADD CONSTRAINT notif_event_type_check CHECK (event_type IN (
    'common_schedule_created',
    'common_schedule_updated',
    'common_schedule_deleted',
    'schedule_updated_by_other',
    'invite',
    'password_reset'
  ));
