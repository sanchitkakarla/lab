-- PICKUP REQUESTS TABLE
CREATE TABLE pickup_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  doctor_id             UUID NOT NULL REFERENCES doctors(id),
  practice_id           UUID NOT NULL REFERENCES practices(id),
  patient_first_name    VARCHAR(100) NOT NULL,
  patient_last_name     VARCHAR(100) NOT NULL,
  patient_dob           DATE NOT NULL,
  product_id            UUID REFERENCES products(id),
  tooth_numbers         JSONB DEFAULT '[]',
  colour_shade          VARCHAR(50),
  preferred_pickup_date DATE NOT NULL,
  notes                 TEXT,
  status                VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected')),
  order_id              UUID REFERENCES orders(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pickup_requests_tenant  ON pickup_requests(tenant_id);
CREATE INDEX idx_pickup_requests_doctor  ON pickup_requests(doctor_id);
CREATE INDEX idx_pickup_requests_status  ON pickup_requests(tenant_id, status);

CREATE TRIGGER pickup_requests_updated_at
  BEFORE UPDATE ON pickup_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE pickup_requests ENABLE ROW LEVEL SECURITY;

-- Lab staff: full access within their tenant
CREATE POLICY "lab_staff_pickup_requests" ON pickup_requests
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('owner', 'technician', 'front_desk')
  );

-- Doctors: insert and select only their own requests
CREATE POLICY "doctor_pickup_requests_insert" ON pickup_requests
  FOR INSERT WITH CHECK (
    doctor_id = current_doctor_id()
    AND current_doctor_id() IS NOT NULL
  );

CREATE POLICY "doctor_pickup_requests_select" ON pickup_requests
  FOR SELECT USING (
    doctor_id = current_doctor_id()
    AND current_doctor_id() IS NOT NULL
  );
