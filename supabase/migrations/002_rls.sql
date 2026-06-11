-- Enable RLS on every table
ALTER TABLE tenants             ENABLE ROW LEVEL SECURITY;
ALTER TABLE practices           ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors             ENABLE ROW LEVEL SECURITY;
ALTER TABLE products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_stage_history ENABLE ROW LEVEL SECURITY;

-- Helper: current user's tenant_id
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: current user's role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: doctor_id for portal users
CREATE OR REPLACE FUNCTION current_doctor_id()
RETURNS UUID AS $$
  SELECT id FROM doctors WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- LAB STAFF POLICIES
CREATE POLICY "lab_staff_orders" ON orders
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('owner','technician','front_desk')
  );

CREATE POLICY "lab_staff_practices" ON practices
  FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY "lab_staff_doctors" ON doctors
  FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY "lab_staff_products" ON products
  FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY "lab_staff_history" ON order_stage_history
  FOR ALL USING (tenant_id = current_tenant_id());

-- DOCTOR PORTAL POLICIES (read-only)
CREATE POLICY "doctor_portal_orders_read" ON orders
  FOR SELECT USING (
    doctor_id = current_doctor_id()
    AND current_doctor_id() IS NOT NULL
  );

CREATE POLICY "doctor_portal_history_read" ON order_stage_history
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE doctor_id = current_doctor_id()
    )
  );

-- OWNER-ONLY POLICIES
CREATE POLICY "owner_only_delete_orders" ON orders
  FOR DELETE USING (
    tenant_id = current_tenant_id()
    AND current_user_role() = 'owner'
  );

CREATE POLICY "owner_manage_user_profiles" ON user_profiles
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND current_user_role() = 'owner'
  );
