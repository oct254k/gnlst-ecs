-- 010_user_type.sql
-- users 테이블에 user_type 컬럼 추가
-- role='admin': NULL (관리자는 임원/직원 분류 불필요)
-- role='user':  'executive'(임원) | 'staff'(직원)

ALTER TABLE users
  ADD COLUMN user_type text
  CONSTRAINT users_user_type_check CHECK (user_type IN ('executive', 'staff'));

-- 기존 일반 사용자(role='user')는 임원으로 기본 분류
UPDATE users SET user_type = 'executive' WHERE role = 'user';
