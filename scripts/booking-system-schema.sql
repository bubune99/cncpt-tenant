-- Booking System Schema
-- Custom booking calendar for consultations and appointments

-- ============================================
-- 1. Booking Services (types of appointments)
-- ============================================
CREATE TABLE IF NOT EXISTS booking_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price_cents INTEGER DEFAULT 0, -- 0 = free
  buffer_minutes INTEGER DEFAULT 15, -- time between appointments
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  color VARCHAR(7) DEFAULT '#3B82F6', -- hex color for calendar
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Booking Availability (recurring schedule)
-- ============================================
CREATE TABLE IF NOT EXISTS booking_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- ============================================
-- 3. Booking Blocked Dates (holidays, vacation)
-- ============================================
CREATE TABLE IF NOT EXISTS booking_blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocked_date DATE NOT NULL UNIQUE,
  reason VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. Bookings (appointments)
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES booking_services(id) ON DELETE SET NULL,

  -- Client info
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50),
  company_name VARCHAR(255),
  website_url VARCHAR(500),

  -- Appointment details
  scheduled_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  timezone VARCHAR(100) DEFAULT 'America/New_York',

  -- Intake form responses
  project_type VARCHAR(100),
  project_description TEXT,
  budget_range VARCHAR(100),
  how_did_you_hear VARCHAR(255),
  intake_responses JSONB DEFAULT '{}',

  -- Status tracking
  status VARCHAR(50) DEFAULT 'scheduled',
  -- statuses: scheduled, confirmed, completed, cancelled, no_show, rescheduled

  -- Cancellation info
  cancelled_at TIMESTAMPTZ,
  cancelled_by VARCHAR(50), -- 'client' or 'admin'
  cancellation_reason TEXT,

  -- Rescheduling
  rescheduled_from UUID REFERENCES bookings(id),
  reschedule_count INTEGER DEFAULT 0,

  -- Meeting details
  meeting_link VARCHAR(500),
  meeting_password VARCHAR(100),

  -- Admin notes
  admin_notes TEXT,
  follow_up_notes TEXT,

  -- Email tracking
  confirmation_sent_at TIMESTAMPTZ,
  reminder_24h_sent_at TIMESTAMPTZ,
  reminder_1h_sent_at TIMESTAMPTZ,
  follow_up_sent_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. Booking Email Log
-- ============================================
CREATE TABLE IF NOT EXISTS booking_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  email_type VARCHAR(50) NOT NULL, -- confirmation, reminder_24h, reminder_1h, cancelled, rescheduled, follow_up
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'sent', -- sent, failed, bounced
  error_message TEXT
);

-- ============================================
-- 6. Booking Settings
-- ============================================
CREATE TABLE IF NOT EXISTS booking_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled ON bookings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_client_email ON bookings(client_email);
CREATE INDEX IF NOT EXISTS idx_bookings_service ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_booking_availability_day ON booking_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_booking_blocked_dates ON booking_blocked_dates(blocked_date);
CREATE INDEX IF NOT EXISTS idx_booking_email_log_booking ON booking_email_log(booking_id);

-- ============================================
-- Seed Default Data
-- ============================================

-- Default service: Free 30-minute consultation
INSERT INTO booking_services (name, slug, description, duration_minutes, price_cents, buffer_minutes, sort_order)
VALUES (
  'Free Consultation',
  'free-consultation',
  'A free 30-minute call to discuss your project goals, get expert recommendations, and receive a ballpark estimate.',
  30,
  0,
  15,
  1
) ON CONFLICT (slug) DO NOTHING;

-- Default availability: Monday-Friday, 9 AM - 5 PM
INSERT INTO booking_availability (day_of_week, start_time, end_time) VALUES
  (1, '09:00', '17:00'), -- Monday
  (2, '09:00', '17:00'), -- Tuesday
  (3, '09:00', '17:00'), -- Wednesday
  (4, '09:00', '17:00'), -- Thursday
  (5, '09:00', '17:00')  -- Friday
ON CONFLICT DO NOTHING;

-- Default settings
INSERT INTO booking_settings (setting_key, setting_value) VALUES
  ('timezone', 'America/New_York'),
  ('min_notice_hours', '24'),
  ('max_advance_days', '30'),
  ('confirmation_email_enabled', 'true'),
  ('reminder_24h_enabled', 'true'),
  ('reminder_1h_enabled', 'true'),
  ('admin_notification_email', ''),
  ('booking_page_title', 'Book a Free Consultation'),
  ('booking_page_description', 'Schedule a free 30-minute call to discuss your project.'),
  ('cancellation_policy', 'Please cancel at least 24 hours in advance.')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- Output summary
-- ============================================
SELECT 'Booking Services' as table_name, COUNT(*) as count FROM booking_services
UNION ALL
SELECT 'Booking Availability', COUNT(*) FROM booking_availability
UNION ALL
SELECT 'Booking Settings', COUNT(*) FROM booking_settings;
