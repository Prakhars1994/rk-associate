-- RK ASSOCIATES PHASE 2 DATABASE SCHEMA
-- Supabase PostgreSQL
-- Created: Oct 26, 2026

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL DEFAULT 'student', -- student, trainer, admin, client
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- ============================================
-- COURSES & ENROLLMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  duration_days INTEGER,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completion_date TIMESTAMP,
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'enrolled', -- enrolled, completed, dropped
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed
  UNIQUE(user_id, course_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);

-- ============================================
-- CLIENT PORTAL - TICKETS & QUERIES
-- ============================================

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES users(id),
  category VARCHAR(100) NOT NULL, -- hr_policy, payroll, compliance, training, general
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(50) DEFAULT 'medium', -- low, medium, high, urgent
  status VARCHAR(50) DEFAULT 'open', -- open, in_progress, resolved, closed, reopened
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  response_time_minutes INTEGER,
  satisfaction_rating INTEGER, -- 1-5 stars after resolution
  INDEX idx_client_id (client_id),
  INDEX idx_status (status),
  INDEX idx_category (category),
  INDEX idx_ticket_number (ticket_number)
);

CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id),
  user_id UUID NOT NULL REFERENCES users(id),
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- FALSE = visible to client, TRUE = internal notes only
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ticket_id (ticket_id),
  INDEX idx_user_id (user_id)
);

-- ============================================
-- FILE SHARING & DOCUMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id),
  user_id UUID NOT NULL REFERENCES users(id),
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50), -- pdf, doc, xlsx, img, etc
  file_size_bytes INTEGER,
  file_url VARCHAR(1024) NOT NULL, -- Cloud storage URL (S3/Cloudflare R2)
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  visibility VARCHAR(50) DEFAULT 'private', -- private, shared, public
  shared_with_users UUID[],
  scan_status VARCHAR(50) DEFAULT 'pending', -- pending, scanned, safe, infected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_ticket_id (ticket_id),
  INDEX idx_upload_date (upload_date)
);

CREATE TABLE IF NOT EXISTS file_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES files(id),
  downloaded_by UUID NOT NULL REFERENCES users(id),
  download_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  INDEX idx_file_id (file_id),
  INDEX idx_downloaded_by (downloaded_by)
);

-- ============================================
-- PAYMENTS & TRANSACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id),
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  razorpay_signature VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
  payment_method VARCHAR(50), -- razorpay, card, upi, bank_transfer
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  receipt_url VARCHAR(1024),
  notes TEXT,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_razorpay_payment_id (razorpay_payment_id)
);

-- ============================================
-- CERTIFICATES & ACHIEVEMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id),
  user_id UUID NOT NULL REFERENCES users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  certificate_url VARCHAR(1024),
  issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiry_date TIMESTAMP,
  verification_code VARCHAR(100) UNIQUE,
  is_digital BOOLEAN DEFAULT TRUE,
  is_printed BOOLEAN DEFAULT FALSE,
  INDEX idx_user_id (user_id),
  INDEX idx_verification_code (verification_code)
);

-- ============================================
-- ACTIVITY LOGS & ANALYTICS
-- ============================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL, -- login, course_view, module_complete, file_upload, ticket_create, etc
  resource_type VARCHAR(100), -- course, ticket, file, enrollment, payment
  resource_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_action (action)
);

CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(100) NOT NULL, -- enrollments, revenue, active_users, course_completion, etc
  metric_value INTEGER,
  metric_date DATE NOT NULL,
  additional_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(metric_type, metric_date),
  INDEX idx_metric_date (metric_date)
);

-- ============================================
-- SYSTEM SETTINGS & CONFIGURATION
-- ============================================

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(50), -- string, number, boolean, json
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(id),
  INDEX idx_setting_key (setting_key)
);

-- ============================================
-- BACKUP & AUDIT TRAIL
-- ============================================

CREATE TABLE IF NOT EXISTS audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID,
  action VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES users(id),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_table_name (table_name),
  INDEX idx_timestamp (timestamp)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tickets_client_status ON tickets(client_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON enrollments(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_files_user_created ON files(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_user_action ON activity_logs(user_id, action);

-- ============================================
-- SAMPLE DATA (Optional)
-- ============================================

-- Insert sample courses
INSERT INTO courses (title, description, price, duration_days) VALUES
('Professional HR Course', 'Complete practical HR program covering recruitment, onboarding, PF/ESIC, payroll, labour law, POSH, policies and L&D', 4999, 45),
('PF & ESIC Practical Training', 'Hands-on PF and ESIC workflows from registration through monthly compliance and employee support', 6999, 30),
('Payroll & Compliance', 'Practical payroll processing with GST, TDS, compliance and employee support', 5999, 28),
('HR Fundamentals', 'Foundation level HR training for freshers and professionals', 2999, 21)
ON CONFLICT DO NOTHING;
