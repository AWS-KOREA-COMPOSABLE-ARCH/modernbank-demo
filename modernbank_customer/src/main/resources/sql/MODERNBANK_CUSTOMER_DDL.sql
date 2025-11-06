-- Create TB_CSTM table (including PRIMARY KEY)
CREATE TABLE IF NOT EXISTS TB_CSTM
(
  CSTM_ID     VARCHAR(20) NOT NULL PRIMARY KEY,
  CSTM_NM     VARCHAR(100),
  CSTM_AGE    VARCHAR(3),
  CSTM_GND    VARCHAR(1),
  CSTM_PN     VARCHAR(20),
  CSTM_ADR    VARCHAR(1000)
);

COMMENT ON TABLE TB_CSTM IS 'Customer';
COMMENT ON COLUMN TB_CSTM.CSTM_ID IS 'Customer ID';
COMMENT ON COLUMN TB_CSTM.CSTM_NM IS 'Customer Name';
COMMENT ON COLUMN TB_CSTM.CSTM_AGE IS 'Age';
COMMENT ON COLUMN TB_CSTM.CSTM_GND IS 'Gender';
COMMENT ON COLUMN TB_CSTM.CSTM_PN IS 'Phone Number';
COMMENT ON COLUMN TB_CSTM.CSTM_ADR IS 'Address';

-- -- First, delete the foreign key constraint
-- ALTER TABLE IF EXISTS TB_USER 
-- DROP CONSTRAINT IF EXISTS tb_user_cstm_id_fkey;

-- DROP TABLE IF EXISTS TB_CSTM;

-- CREATE TABLE TB_CSTM
-- (
--   CSTM_ID     VARCHAR(20) not null,
--   CSTM_NM   VARCHAR(100),
--   CSTM_AGE   VARCHAR(3),
--   CSTM_GND  VARCHAR(1),
--   CSTM_PN    VARCHAR(20),
--   CSTM_ADR  VARCHAR(1000)
-- )
-- ;
-- comment on table TB_CSTM  is 'Customer';
-- comment on column TB_CSTM.CSTM_ID  is 'Customer ID';
-- comment on column TB_CSTM.CSTM_NM  is 'Customer Name';
-- comment on column TB_CSTM.CSTM_AGE  is 'Age';
-- comment on column TB_CSTM.CSTM_GND  is 'Gender';
-- comment on column TB_CSTM.CSTM_PN is 'Phone Number';
-- comment on column TB_CSTM.CSTM_ADR  is 'Address';
-- alter table TB_CSTM
--   add primary key (CSTM_ID);