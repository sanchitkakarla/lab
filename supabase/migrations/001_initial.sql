-- ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. TENANTS
CREATE TABLE tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(200) NOT NULL,
  address     TEXT,
  phone       VARCHAR(30),
  email       VARCHAR(200),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  is_active   BOOLEAN DEFAULT TRUE
);

-- 2. PRACTICES
CREATE TABLE practices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  address     TEXT,
  phone       VARCHAR(30),
  email       VARCHAR(200),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  is_active   BOOLEAN DEFAULT TRUE
);

-- 3. DOCTORS
CREATE TABLE doctors (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  practice_id    UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  first_name     VARCHAR(100) NOT NULL,
  last_name      VARCHAR(100) NOT NULL,
  email          VARCHAR(200) UNIQUE,
  phone          VARCHAR(30),
  portal_enabled BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRODUCTS
CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  sort_order  INTEGER DEFAULT 0
);

-- 5. USER PROFILES (lab staff)
CREATE TABLE user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  role        VARCHAR(20) NOT NULL CHECK (role IN ('owner','technician','front_desk')),
  first_name  VARCHAR(100),
  last_name   VARCHAR(100),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ORDERS
CREATE TABLE orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  practice_id           UUID NOT NULL REFERENCES practices(id),
  doctor_id             UUID NOT NULL REFERENCES doctors(id),
  patient_first_name    VARCHAR(100) NOT NULL,
  patient_last_name     VARCHAR(100) NOT NULL,
  patient_dob           DATE NOT NULL,
  product_id            UUID REFERENCES products(id),
  tooth_numbers         JSONB DEFAULT '[]',
  colour_shade          VARCHAR(50),
  order_date            TIMESTAMPTZ DEFAULT NOW(),
  case_start_date       DATE,
  estimated_pickup_date DATE NOT NULL,
  case_status           VARCHAR(50) NOT NULL DEFAULT 'Received'
                        CHECK (case_status IN (
                          'Received','Prep Started','In Fabrication','Ready','Delivered'
                        )),
  notes                 TEXT,
  created_by            UUID REFERENCES auth.users(id),
  is_archived           BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ORDER STAGE HISTORY
CREATE TABLE order_stage_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  stage_name VARCHAR(50) NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id),
  notes      TEXT
);

-- 8. INDEXES
CREATE INDEX idx_orders_tenant         ON orders(tenant_id);
CREATE INDEX idx_orders_practice       ON orders(tenant_id, practice_id);
CREATE INDEX idx_orders_doctor         ON orders(tenant_id, doctor_id);
CREATE INDEX idx_orders_status         ON orders(tenant_id, case_status);
CREATE INDEX idx_orders_patient_search ON orders(tenant_id, patient_last_name);
CREATE INDEX idx_orders_dates          ON orders(tenant_id, estimated_pickup_date);
CREATE INDEX idx_orders_archived       ON orders(tenant_id, is_archived);
CREATE INDEX idx_stage_history_order   ON order_stage_history(order_id);
CREATE INDEX idx_practices_tenant      ON practices(tenant_id);
CREATE INDEX idx_doctors_practice      ON doctors(practice_id);
CREATE INDEX idx_user_profiles_tenant  ON user_profiles(tenant_id);

-- 9. AUTO-UPDATE updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
