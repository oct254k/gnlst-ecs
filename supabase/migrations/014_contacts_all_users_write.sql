-- 014_contacts_all_users_write.sql
-- 연락처·회사: 모든 인증 사용자가 등록·수정·삭제 가능

-- contacts
DROP POLICY IF EXISTS contacts_write ON contacts;
CREATE POLICY contacts_insert ON contacts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY contacts_update ON contacts FOR UPDATE
  USING (auth.uid() IS NOT NULL) WITH CHECK (true);
CREATE POLICY contacts_delete ON contacts FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- companies
DROP POLICY IF EXISTS companies_write ON companies;
CREATE POLICY companies_insert ON companies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY companies_update ON companies FOR UPDATE
  USING (auth.uid() IS NOT NULL) WITH CHECK (true);
CREATE POLICY companies_delete ON companies FOR DELETE
  USING (auth.uid() IS NOT NULL);
