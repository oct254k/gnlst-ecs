-- 001_schema.sql
-- 전체 테이블 생성, 인덱스, updated_at 자동 갱신 트리거

-- ============================================================
-- updated_at 자동 갱신 트리거 함수
-- ============================================================
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ============================================================
-- E01. users
-- ============================================================
CREATE TABLE users (
  id                  uuid        NOT NULL DEFAULT gen_random_uuid(),
  email               text        NOT NULL,
  employee_id         text        NOT NULL,
  name                text        NOT NULL,
  role                text        NOT NULL DEFAULT 'user',
  status              text        NOT NULL DEFAULT 'pending',
  color               text,
  last_login_at       timestamptz,
  failed_login_count  int         NOT NULL DEFAULT 0,
  locked_until        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz,
  deleted_by          uuid,

  CONSTRAINT users_pkey          PRIMARY KEY (id),
  CONSTRAINT users_role_check    CHECK (role IN ('admin', 'user')),
  CONSTRAINT users_status_check  CHECK (status IN ('pending', 'active', 'inactive', 'locked')),
  CONSTRAINT users_empid_check   CHECK (employee_id ~ '^\d{6,10}$'),
  CONSTRAINT users_email_check   CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  CONSTRAINT users_failed_count_check CHECK (failed_login_count >= 0)
);

ALTER TABLE users
  ADD CONSTRAINT users_deleted_by_fkey
    FOREIGN KEY (deleted_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX idx_users_email_active
  ON users(email) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX idx_users_employee_id_active
  ON users(employee_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();


-- ============================================================
-- E02. companies
-- ============================================================
CREATE TABLE companies (
  id                  uuid        NOT NULL DEFAULT gen_random_uuid(),
  name                text        NOT NULL,
  aliases             text[]      NOT NULL DEFAULT '{}',
  is_auto_registered  bool        NOT NULL DEFAULT false,
  created_by          uuid        NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz,
  deleted_by          uuid,

  CONSTRAINT companies_pkey         PRIMARY KEY (id),
  CONSTRAINT companies_name_check   CHECK (length(name) BETWEEN 1 AND 100),
  CONSTRAINT companies_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT companies_deleted_by_fkey
    FOREIGN KEY (deleted_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

-- 활성 행 기준 name 소문자 unique 인덱스
CREATE UNIQUE INDEX idx_companies_name_active
  ON companies(LOWER(name)) WHERE deleted_at IS NULL;

CREATE INDEX idx_companies_aliases_gin
  ON companies USING GIN(aliases);

CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();


-- ============================================================
-- E03. contacts
-- ============================================================
CREATE TABLE contacts (
  id                  uuid        NOT NULL DEFAULT gen_random_uuid(),
  name                text        NOT NULL,
  company_id          uuid,
  title               text,
  email               text,
  phone               text,
  status              text        NOT NULL DEFAULT 'auto',
  is_auto_registered  bool        NOT NULL DEFAULT false,
  created_by          uuid        NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz,
  deleted_by          uuid,

  CONSTRAINT contacts_pkey           PRIMARY KEY (id),
  CONSTRAINT contacts_name_check     CHECK (length(name) BETWEEN 1 AND 50),
  CONSTRAINT contacts_status_check   CHECK (status IN ('auto', 'confirmed')),
  CONSTRAINT contacts_email_check    CHECK (email IS NULL OR email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  CONSTRAINT contacts_company_id_fkey
    FOREIGN KEY (company_id) REFERENCES companies(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT contacts_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT contacts_deleted_by_fkey
    FOREIGN KEY (deleted_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();


-- ============================================================
-- E04. schedules
-- ============================================================
CREATE TABLE schedules (
  id               uuid        NOT NULL DEFAULT gen_random_uuid(),
  type             text        NOT NULL,
  owner_id         uuid,
  schedule_date    date        NOT NULL,
  time_slot        text        NOT NULL,
  start_time       time,
  end_time         time,
  is_all_day       bool        NOT NULL DEFAULT false,
  title            text        NOT NULL,
  location         text,
  memo             text,
  created_by       uuid        NOT NULL,
  on_behalf_of_id  uuid,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  deleted_at       timestamptz,
  deleted_by       uuid,

  CONSTRAINT schedules_pkey             PRIMARY KEY (id),
  CONSTRAINT schedules_type_check       CHECK (type IN ('personal', 'common')),
  CONSTRAINT schedules_time_slot_check  CHECK (time_slot IN ('morning', 'lunch', 'afternoon', 'evening', 'allday')),
  CONSTRAINT schedules_title_check      CHECK (length(title) BETWEEN 1 AND 200),
  CONSTRAINT schedules_time_order_check CHECK (start_time IS NULL OR end_time IS NULL OR start_time < end_time),
  CONSTRAINT schedules_owner_check      CHECK ((type = 'personal' AND owner_id IS NOT NULL) OR (type = 'common')),
  CONSTRAINT schedules_allday_check     CHECK ((is_all_day = false) OR (start_time IS NULL AND end_time IS NULL AND time_slot = 'allday')),
  CONSTRAINT schedules_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT schedules_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT schedules_on_behalf_of_id_fkey
    FOREIGN KEY (on_behalf_of_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT schedules_deleted_by_fkey
    FOREIGN KEY (deleted_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX idx_schedules_owner_date
  ON schedules(owner_id, schedule_date) WHERE deleted_at IS NULL;

CREATE INDEX idx_schedules_date_type
  ON schedules(schedule_date, type) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();


-- ============================================================
-- E05. schedule_participants
-- ============================================================
CREATE TABLE schedule_participants (
  id           uuid        NOT NULL DEFAULT gen_random_uuid(),
  schedule_id  uuid        NOT NULL,
  user_id      uuid        NOT NULL,
  status       text        NOT NULL DEFAULT 'joined',
  joined_at    timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,
  added_by     uuid        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT sp_pkey           PRIMARY KEY (id),
  CONSTRAINT sp_status_check   CHECK (status IN ('joined', 'cancelled')),
  CONSTRAINT sp_unique         UNIQUE (schedule_id, user_id),
  CONSTRAINT sp_schedule_id_fkey
    FOREIGN KEY (schedule_id) REFERENCES schedules(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT sp_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT sp_added_by_fkey
    FOREIGN KEY (added_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TRIGGER trg_sp_updated_at
  BEFORE UPDATE ON schedule_participants
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();


-- ============================================================
-- E06. mentions
-- ============================================================
CREATE TABLE mentions (
  id              uuid        NOT NULL DEFAULT gen_random_uuid(),
  schedule_id     uuid        NOT NULL,
  reference_type  text        NOT NULL,
  reference_id    uuid        NOT NULL,
  raw_text        text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT mentions_pkey              PRIMARY KEY (id),
  CONSTRAINT mentions_ref_type_check    CHECK (reference_type IN ('contact', 'company')),
  CONSTRAINT mentions_unique            UNIQUE (schedule_id, reference_type, reference_id),
  CONSTRAINT mentions_schedule_id_fkey
    FOREIGN KEY (schedule_id) REFERENCES schedules(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_mentions_ref
  ON mentions(reference_type, reference_id);


-- ============================================================
-- E07. proxy_permissions
-- ============================================================
CREATE TABLE proxy_permissions (
  id               uuid        NOT NULL DEFAULT gen_random_uuid(),
  proxy_user_id    uuid        NOT NULL,
  target_user_id   uuid        NOT NULL,
  granted_by       uuid        NOT NULL,
  granted_at       timestamptz NOT NULL DEFAULT now(),
  revoked_by       uuid,
  revoked_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT proxy_pkey             PRIMARY KEY (id),
  CONSTRAINT proxy_no_self_check    CHECK (proxy_user_id <> target_user_id),
  CONSTRAINT proxy_revoke_check     CHECK (
    (revoked_at IS NULL AND revoked_by IS NULL)
    OR (revoked_at IS NOT NULL AND revoked_by IS NOT NULL)
  ),
  CONSTRAINT proxy_user_id_fkey
    FOREIGN KEY (proxy_user_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT proxy_target_user_id_fkey
    FOREIGN KEY (target_user_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT proxy_granted_by_fkey
    FOREIGN KEY (granted_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT proxy_revoked_by_fkey
    FOREIGN KEY (revoked_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX idx_proxy_unique_active
  ON proxy_permissions(proxy_user_id, target_user_id) WHERE revoked_at IS NULL;

CREATE TRIGGER trg_proxy_updated_at
  BEFORE UPDATE ON proxy_permissions
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();


-- ============================================================
-- E08. holidays
-- ============================================================
CREATE TABLE holidays (
  id                    uuid        NOT NULL DEFAULT gen_random_uuid(),
  holiday_date          date        NOT NULL,
  name                  text        NOT NULL,
  type                  text        NOT NULL,
  year                  int         NOT NULL,
  original_holiday_name text,
  memo                  text,
  is_active             bool        NOT NULL DEFAULT true,
  created_by            uuid,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  deleted_at            timestamptz,
  deleted_by            uuid,

  CONSTRAINT holidays_pkey         PRIMARY KEY (id),
  CONSTRAINT holidays_type_check   CHECK (type IN ('statutory', 'substitute', 'temporary')),
  CONSTRAINT holidays_name_check   CHECK (length(name) BETWEEN 1 AND 50),
  CONSTRAINT holidays_year_check   CHECK (year = EXTRACT(YEAR FROM holiday_date)),
  CONSTRAINT holidays_substitute_check CHECK (
    (type = 'substitute' AND original_holiday_name IS NOT NULL)
    OR (type <> 'substitute')
  ),
  CONSTRAINT holidays_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT holidays_deleted_by_fkey
    FOREIGN KEY (deleted_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX idx_holidays_date_type
  ON holidays(holiday_date, type) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_holidays_updated_at
  BEFORE UPDATE ON holidays
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();


-- ============================================================
-- E09. notification_logs
-- ============================================================
CREATE TABLE notification_logs (
  id                uuid        NOT NULL DEFAULT gen_random_uuid(),
  event_type        text        NOT NULL,
  recipient_id      uuid,
  recipient_email   text        NOT NULL,
  target_type       text,
  target_id         uuid,
  channel           text        NOT NULL DEFAULT 'email',
  status            text        NOT NULL DEFAULT 'pending',
  attempt_count     int         NOT NULL DEFAULT 0,
  last_attempted_at timestamptz,
  sent_at           timestamptz,
  read_at           timestamptz,
  error_message     text,
  payload           jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT notif_pkey              PRIMARY KEY (id),
  CONSTRAINT notif_event_type_check  CHECK (event_type IN (
    'common_schedule_created', 'common_schedule_updated',
    'schedule_updated_by_other', 'invite', 'password_reset'
  )),
  CONSTRAINT notif_status_check      CHECK (status IN ('pending', 'retrying', 'sent', 'failed', 'skipped')),
  CONSTRAINT notif_attempt_check     CHECK (attempt_count >= 0 AND attempt_count <= 4),
  CONSTRAINT notif_recipient_id_fkey
    FOREIGN KEY (recipient_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX idx_notifications_recipient_unread
  ON notification_logs(recipient_id) WHERE read_at IS NULL AND status = 'sent';

CREATE TRIGGER trg_notif_updated_at
  BEFORE UPDATE ON notification_logs
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();


-- ============================================================
-- E10. audit_logs
-- ============================================================
CREATE TABLE audit_logs (
  id                         uuid        NOT NULL DEFAULT gen_random_uuid(),
  target_type                text        NOT NULL,
  target_id                  uuid        NOT NULL,
  action                     text        NOT NULL,
  actor_id                   uuid,
  actor_name_snapshot        text,
  on_behalf_of_id            uuid,
  on_behalf_of_name_snapshot text,
  before_data                jsonb,
  after_data                 jsonb,
  changed_fields             text[],
  ip_address                 text,
  created_at                 timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT audit_pkey              PRIMARY KEY (id),
  CONSTRAINT audit_target_type_check CHECK (target_type IN (
    'schedule', 'contact', 'company', 'proxy_permission', 'holiday', 'user'
  )),
  CONSTRAINT audit_action_check      CHECK (action IN ('created', 'updated', 'deleted')),
  CONSTRAINT audit_data_check        CHECK (
    (action = 'created' AND before_data IS NULL AND after_data IS NOT NULL)
    OR (action = 'updated' AND before_data IS NOT NULL AND after_data IS NOT NULL)
    OR (action = 'deleted' AND before_data IS NOT NULL)
  ),
  CONSTRAINT audit_actor_id_fkey
    FOREIGN KEY (actor_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT audit_on_behalf_of_id_fkey
    FOREIGN KEY (on_behalf_of_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX idx_audit_target
  ON audit_logs(target_type, target_id);
