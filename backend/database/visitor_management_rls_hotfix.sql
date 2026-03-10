-- Visitor Management RLS hotfix for development.
-- This keeps the app working with anon key/local auth flows.

ALTER TABLE IF EXISTS visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS visitor_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS visitor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS visitor_blacklist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS visitors_dev_all ON visitors;
DROP POLICY IF EXISTS visitor_settings_dev_all ON visitor_settings;
DROP POLICY IF EXISTS visitor_logs_dev_all ON visitor_logs;
DROP POLICY IF EXISTS visitor_blacklist_dev_all ON visitor_blacklist;

CREATE POLICY visitors_dev_all
ON visitors
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY visitor_settings_dev_all
ON visitor_settings
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY visitor_logs_dev_all
ON visitor_logs
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY visitor_blacklist_dev_all
ON visitor_blacklist
FOR ALL
USING (true)
WITH CHECK (true);
