-- Users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Logs Table
-- Each log is connected to a user and contains the basic log information
CREATE TABLE logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    qr_code_url TEXT,
    last_review_at TIMESTAMP,
    total_reviews INTEGER DEFAULT 0
);

-- Log Fields Table
-- Tracks which fields are enabled for each log
CREATE TABLE log_fields (
    log_field_id SERIAL PRIMARY KEY,
    log_id INTEGER REFERENCES logs(log_id),
    field_name VARCHAR(50) NOT NULL CHECK (field_name IN ('name', 'photo', 'review', 'note')),
    is_enabled BOOLEAN DEFAULT true,
    is_required BOOLEAN DEFAULT false,
    display_order INTEGER NOT NULL,
    -- UNIQUE (log_id, field_name) -- prevents duplicate fields per log
);

-- Reviews Table
-- Stores the submitted reviews for each log
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    log_id INTEGER REFERENCES logs(log_id),
    reviewer_name VARCHAR(100),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45), -- spam prevention
    status VARCHAR(20) DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'flagged')),
    CONSTRAINT unique_review_per_ip_per_day UNIQUE (log_id, ip_address, DATE(submitted_at))
);

-- Review Field Values Table
-- Stores the actual content for each field in each review
CREATE TABLE review_field_values (
    value_id SERIAL PRIMARY KEY,
    review_id INTEGER REFERENCES reviews(review_id) ON DELETE CASCADE,
    field_name VARCHAR(50) NOT NULL,
    field_value TEXT,
    file_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_field_name CHECK (field_name IN ('name', 'photo', 'review', 'note'))
);

-- Create indexes for common queries
CREATE INDEX idx_users_email ON users(email); -- for fast login lookups
CREATE INDEX idx_logs_user_id ON logs(user_id); -- for finding all logs by a specific user
CREATE INDEX idx_reviews_log_id ON reviews(log_id); -- for finding all reviews in a specific log
CREATE INDEX idx_logs_created_at ON logs(created_at DESC); -- to easily sort logs by creation date
CREATE INDEX idx_logs_user_status ON logs(user_id, status); -- easily filter active/inactive logs from a user
CREATE INDEX idx_review_values_review_id ON review_field_values(review_id); -- fetch all review values on a specific review
CREATE INDEX idx_log_fields_log_id ON log_fields(log_id); -- fetch field configuration for a specific log
CREATE INDEX idx_reviews_submitted_at ON reviews(submitted_at DESC); -- to sort reviews chronologically 
CREATE INDEX idx_reviews_log_recent ON reviews(log_id, submitted_at DESC); -- for queries that need to show recent reviews on specific log