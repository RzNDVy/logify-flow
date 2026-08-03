-- schema.sql

-- 1. Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Enums
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive');
CREATE TYPE project_status AS ENUM ('active', 'inactive');
CREATE TYPE module_status AS ENUM ('active', 'inactive');
CREATE TYPE activity_status AS ENUM ('draft', 'published');

-- 3. Create Tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT,
  position TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user',
  status user_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  color TEXT,
  icon TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id),
  module_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  activity_date DATE NOT NULL,
  activity_time TIME NOT NULL,
  status activity_status DEFAULT 'published',
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activity_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT,
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  entity TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 5. Helper Functions
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
DECLARE
  uid UUID;
BEGIN
  SELECT id INTO uid FROM users WHERE auth_id = auth.uid();
  RETURN uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS Policies
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth_id = auth.uid());
CREATE POLICY "Admins can manage all users" ON users FOR ALL USING (is_admin());

CREATE POLICY "Everyone can view projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Admins can manage projects" ON projects FOR ALL USING (is_admin());

CREATE POLICY "Everyone can view modules" ON modules FOR SELECT USING (true);
CREATE POLICY "Admins can manage modules" ON modules FOR ALL USING (is_admin());

CREATE POLICY "Admins can view all activities" ON activities FOR SELECT USING (is_admin());
CREATE POLICY "Users can view own activities" ON activities FOR SELECT USING (user_id = current_user_id());
CREATE POLICY "Users can insert own activities" ON activities FOR INSERT WITH CHECK (user_id = current_user_id());
CREATE POLICY "Users can update own activities <= 7 days" ON activities 
FOR UPDATE USING (user_id = current_user_id() AND (created_at >= NOW() - INTERVAL '7 days'));
CREATE POLICY "Admins can update any activities" ON activities FOR UPDATE USING (is_admin());
CREATE POLICY "Users can delete own activities <= 7 days" ON activities 
FOR DELETE USING (user_id = current_user_id() AND (created_at >= NOW() - INTERVAL '7 days'));
CREATE POLICY "Admins can delete any activities" ON activities FOR DELETE USING (is_admin());

CREATE POLICY "Users can view images for activities they can see" ON activity_images 
FOR SELECT USING (EXISTS (SELECT 1 FROM activities WHERE activities.id = activity_id));
CREATE POLICY "Users can insert images for their own activities" ON activity_images 
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM activities WHERE activities.id = activity_id AND user_id = current_user_id()));
CREATE POLICY "Users can delete images for their own activities <= 7 days" ON activity_images 
FOR DELETE USING (EXISTS (SELECT 1 FROM activities WHERE activities.id = activity_id AND user_id = current_user_id() AND activities.created_at >= NOW() - INTERVAL '7 days'));
CREATE POLICY "Admins can delete any images" ON activity_images FOR DELETE USING (is_admin());

CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL USING (user_id = current_user_id());

-- 7. Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 8. Admin RPC for updating user passwords
CREATE OR REPLACE FUNCTION admin_update_user_password(target_user_id UUID, new_password TEXT)
RETURNS VOID AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can update user passwords';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = (
    SELECT auth_id FROM users WHERE id = target_user_id OR auth_id = target_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
