ALTER TABLE members ADD COLUMN rfid_tag TEXT UNIQUE;

CREATE INDEX idx_members_rfid ON members(rfid_tag);
