-- First, let's create the users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_time TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Then create the logs table
CREATE TABLE logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    qr_code_url TEXT,
    last_review_at TIMESTAMP,
    total_reviews INTEGER DEFAULT 0,
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'archived'))
);

-- Create the log_fields table
CREATE TABLE log_fields (
    log_field_id SERIAL PRIMARY KEY,
    log_id INTEGER REFERENCES logs(log_id),
    field_name VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    is_required BOOLEAN DEFAULT false,
    display_order INTEGER NOT NULL,
    CONSTRAINT valid_field_name CHECK (field_name IN ('name', 'photo', 'review', 'note'))
);

-- Create the reviews table
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    log_id INTEGER REFERENCES logs(log_id),
    reviewer_name VARCHAR(100),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submission_date DATE DEFAULT CURRENT_DATE,
    ip_address VARCHAR(45),
    status VARCHAR(20) DEFAULT 'visible',
    CONSTRAINT valid_review_status CHECK (status IN ('visible', 'hidden', 'flagged')),
    CONSTRAINT unique_review_per_ip_per_day UNIQUE (log_id, ip_address, submission_date)
);

-- Create the review_field_values table
CREATE TABLE review_field_values (
    value_id SERIAL PRIMARY KEY,
    review_id INTEGER REFERENCES reviews(review_id) ON DELETE CASCADE,
    field_name VARCHAR(50) NOT NULL,
    field_value TEXT,
    file_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_field_name_review CHECK (field_name IN ('name', 'photo', 'review', 'note'))
);

-- Create indexes after all tables exist
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_reviews_log_id ON reviews(log_id);
CREATE INDEX idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX idx_logs_user_status ON logs(user_id, status);
CREATE INDEX idx_review_values_review_id ON review_field_values(review_id);
CREATE INDEX idx_log_fields_log_id ON log_fields(log_id);
CREATE INDEX idx_reviews_submitted_at ON reviews(submitted_at DESC);
CREATE INDEX idx_reviews_log_recent ON reviews(log_id, submitted_at DESC);