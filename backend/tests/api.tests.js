// backend/tests/api.test.js

const request = require('supertest');
const app = require('../app');
const db = require('../db');
const { generateTestToken } = require('./testHelpers');

describe('API Routes', () => {
    let testUser;
    let testToken;

    beforeAll(async () => {
        // Create test user and get auth token
        testToken = await generateTestToken();
        const userResult = await db.query(
            'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING user_id',
            ['test@example.com', 'Test User']
        );
        testUser = userResult.rows[0];
    });

    afterAll(async () => {
        // Clean up test data
        await db.query('DELETE FROM users WHERE email = $1', ['test@example.com']);
        await db.pool.end();
    });

    describe('Log Management', () => {
        test('Should create a new log', async () => {
            const response = await request(app)
                .post('/api/logs')
                .set('Authorization', `Bearer ${testToken}`)
                .send({
                    title: 'Test Log',
                    description: 'Test Description',
                    fields: [
                        { name: 'name', enabled: true, required: true },
                        { name: 'review', enabled: true, required: false }
                    ]
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('logId');
            expect(response.body).toHaveProperty('qrCodeUrl');

            // Verify log was created in database
            const logResult = await db.query('SELECT * FROM logs WHERE log_id = $1', [response.body.logId]);
            expect(logResult.rows).toHaveLength(1);
            expect(logResult.rows[0].title).toBe('Test Log');
        });

        test('Should fetch user logs', async () => {
            const response = await request(app)
                .get('/api/logs')
                .set('Authorization', `Bearer ${testToken}`)
                .query({ page: 1, limit: 10 });

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('Review Submission', () => {
        let testLogId;

        beforeAll(async () => {
            // Create a test log
            const logResult = await db.query(
                'INSERT INTO logs (user_id, title, description) VALUES ($1, $2, $3) RETURNING log_id',
                [testUser.user_id, 'Test Log', 'Test Description']
            );
            testLogId = logResult.rows[0].log_id;
        });

        test('Should fetch log configuration', async () => {
            const response = await request(app)
                .get(`/api/logs/${testLogId}/config`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('title');
            expect(response.body).toHaveProperty('fields');
        });

        test('Should submit a review', async () => {
            const response = await request(app)
                .post(`/api/logs/${testLogId}/reviews`)
                .send({
                    name: 'Test Reviewer',
                    review: 'Great experience!'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('reviewId');

            // Verify review was created
            const reviewResult = await db.query('SELECT * FROM reviews WHERE review_id = $1', [response.body.reviewId]);
            expect(reviewResult.rows).toHaveLength(1);
            expect(reviewResult.rows[0].reviewer_name).toBe('Test Reviewer');
        });
    });
});



/** Create a sepetate test DB:
 * 
 * 
# Connect to PostgreSQL
psql

# Create test database
CREATE DATABASE qr_logger_test;

# Connect to test database
\c qr_logger_test

# Run your schema.sql file
\i path/to/your/schema.sql

 */