-- Audit events are append-only: the database itself rejects UPDATE and DELETE,
-- so not even a bug in the application can rewrite history.
CREATE OR REPLACE FUNCTION prevent_audit_event_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only (% is not allowed)', TG_OP;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER audit_events_append_only
  BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_event_mutation();
