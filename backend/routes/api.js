const express = require('express');
const db = require('../db/index');
const router = express.Router();
const admin = require('firebase-admin');
const { auth } = require('../middleware/firebaseAuth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const qrcode = require('qrcode');

// Authentication Routes

// POST endpoint to either update (last login time) or insert (new user).
router.post('/verify', async (req, res) => {
    try {
        // Add logging to help debug
        console.log('Received verify request:', {
            headers: req.headers,
            body: req.body
        });

        const token = req.headers.authorization?.split('Bearer ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Add try-catch specifically for token verification
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(token);
        } catch (tokenError) {
            console.error('Token verification failed:', tokenError);
            return res.status(401).json({ error: 'Invalid token' });
        }

        const { email, name } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Add logging for database operation
        console.log('Attempting database operation for:', { email, name });


        // const exists = await db.query(
        //     `SELECT * FROM users WHERE user_id = $1`,
        //     [decodedToken]
        // );




        const result = await db.query(
            `INSERT INTO users (user_id, email, name, last_login_time) 
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
             ON CONFLICT (email) 
             DO UPDATE SET last_login_time = CURRENT_TIMESTAMP, name = EXCLUDED.name
             RETURNING user_id`,
            [decodedToken, email, name]
        );
        
        // Add logging for successful operation
        console.log('Database operation successful:', result.rows[0]);

        res.json({ userId: result.rows[0].user_id });
    } catch (error) {
        // Enhanced error logging
        console.error('Verification error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        
        // Send more specific error messages based on the type of error
        if (error.code === '23505') { // Unique violation
            res.status(409).json({ error: 'User already exists' });
        } else if (error.code === '23502') { // Not null violation
            res.status(400).json({ error: 'Missing required fields' });
        } else {
            res.status(500).json({ 
                error: 'Failed to verify user',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
});
  
// log mananegment route (create, create qrcode)
// creates a POST endpoint at logs. 'auth' ensures only authenicated users can create logs
// make async because of the multiple db operations
router.post('/logs', auth, async (req, res) => {
    const { title, description, fields } = req.body;
    const userId = req.user.uid;
    const userEmail = req.user.email || '';
    const userName = req.user.name || 'Anonymous';
    
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // First ensure the user exists - this is important for maintaining data integrity
        let userResult = await client.query(
            'SELECT user_id FROM users WHERE user_id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            // If the user doesn't exist, create them first
            await client.query(
                'INSERT INTO users (user_id, email, name) VALUES ($1, $2, $3)',
                [userId, userEmail, userName]
            );
        }

        // Create the log entry
        const logResult = await client.query(
            'INSERT INTO logs (user_id, title, description) VALUES ($1, $2, $3) RETURNING log_id',
            [userId, title, description]
        );
        const logId = logResult.rows[0].log_id;

        // Generate the QR code for this log
        const qrCodeUrl = await qrcode.toDataURL(`${process.env.APP_URL}/review/${logId}`);
        await client.query(
            'UPDATE logs SET qr_code_url = $1 WHERE log_id = $2',
            [qrCodeUrl, logId]
        );

        // Now create the log fields, using the array index for display_order
        // This ensures fields appear in the same order they were specified
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            await client.query(
                `INSERT INTO log_fields 
                (log_id, field_name, is_enabled, is_required, display_order) 
                VALUES ($1, $2, $3, $4, $5)`,
                [logId, field.name, field.enabled, field.required, i]
            );
        } 

        await client.query('COMMIT');
        res.json({ logId, qrCodeUrl });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in log creation:', {
            errorMessage: error.message,
            userId,
            title,
            fieldsCount: fields?.length
        });
        res.status(500).json({ error: 'Failed to create log', details: error.message });
    } finally {
        client.release();
    }
});


// route to fetch all logs for a given user
// creates a GET endpoint, user must be authenticated first
// GET endpoint to fetch all logs for a user with pagination
router.get('/logs', auth, async (req, res) => {
    try {
        const userId = req.user.uid;
        
        // Extract and validate query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        
        // Validate page and limit
        if (page < 1) {
            return res.status(400).json({ error: 'Page must be greater than 0' });
        }
        if (limit < 1 || limit > 100) {
            return res.status(400).json({ error: 'Limit must be between 1 and 100' });
        }

        // Calculate offset
        const offset = (page - 1) * limit;

        // Build query and params array
        let query = `
            SELECT 
                l.*,
                COUNT(*) OVER() as total_count
            FROM logs l
            WHERE l.user_id = $1
        `;
        let params = [userId];
        let paramCount = 1;

        // Add status filter if provided
        if (status) {
            paramCount++;
            query += ` AND l.status = $${paramCount}`;
            params.push(status);
        }

        // Add ordering and pagination
        query += ` ORDER BY l.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);

        // Execute query
        const result = await db.query(query, params);
        
        // Extract total count and format response
        const totalCount = result.rows[0]?.total_count || 0;
        const totalPages = Math.ceil(totalCount / limit);

        // Return paginated response
        res.status(200).json({
            logs: result.rows.map(row => {
                const { total_count, ...logData } = row;
                return logData;
            }),
            pagination: {
                current_page: page,
                total_pages: totalPages,
                total_records: parseInt(totalCount),
                limit: limit
            }
        });

    } catch (error) {
        console.error('Failed to fetch logs:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// fetches config info for a specific log - tells us how a log's review form should be structured
router.get('/logs/:logId/config', async (req, res) => {
    try {
        // find the specific log and its information such as fields and if they are required
        // build the correct form fields dynamically 
        const logResult = await db.query(
            'SELECT l.*, array_agg(json_build_object(\'name\', lf.field_name, \'required\', lf.is_required)) as fields FROM logs l LEFT JOIN log_fields lf ON l.log_id = lf.log_id WHERE l.log_id = $1 AND l.status = \'active\' GROUP BY l.log_id',
            [req.params.logId]
        );

        // if a log doesn't exist, or its status is inactive
        if (logResult.rows.length === 0) {
            return res.status(404).json({ error: 'Log not found or inactive' });
        }

        res.json(logResult.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch log configuration' });
    }
});


// creates a POST endpoint to recieve reviews for a specific log
// upload.single(photo) handles the file submission
router.post('/logs/:logId/reviews', upload.single('photo'), async (req, res) => {
    const { logId } = req.params; // which log is being reviewd
    const reviewData = req.body; // what the review content is
    const clientIp = req.ip; // get the IP address to prevent spam

    try {
        console.log('Received review data:', reviewData);
        console.log('Received review data name:', reviewData.name);
        // check for the rate limit
        const recentReviews = await db.query(
            'SELECT COUNT(*) FROM reviews WHERE log_id = $1 AND ip_address = $2 AND submitted_at > NOW() - INTERVAL \'1 day\'',
            [logId, clientIp]
        );
        // limit of 5 reviews per day
        if (recentReviews.rows[0].count >= 20) {
            return res.status(429).json({ error: 'Too many reviews submitted' });
        }

        const client = await db.pool.connect();
        try {
            // initialize transaction
            await client.query('BEGIN');

            // create a new review
            const reviewResult = await client.query(
                'INSERT INTO reviews (log_id, reviewer_name, ip_address) VALUES ($1, $2, $3) RETURNING review_id',
                [logId, reviewData.name, clientIp]
            );
            const reviewId = reviewResult.rows[0].review_id;

            // Store individual review field values
            for (const [field, value] of Object.entries(reviewData)) {
                if (field !== 'name') { // we already stored the name
                    await client.query(
                        'INSERT INTO review_field_values (review_id, field_name, field_value) VALUES ($1, $2, $3)',
                        [reviewId, field, value]
                    );
                }
            }

            // update review count
            await client.query(
                'UPDATE logs SET total_reviews = total_reviews + 1, last_review_at = CURRENT_TIMESTAMP WHERE log_id = $1',
                [logId]
            );

            // commit transaction
            await client.query('COMMIT');
            res.json({ reviewId });
        } catch (error) {
            console.log('Transaction was canceled');
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.log('Unable to add in review.');
        res.status(500).json({ error: 'failed to submit review' });
    }
});

router.get('/logs/:logId/reviews', auth, async (req, res) => {
    console.log('Received request for log reviews:', {
        logId: req.params.logId,
        authHeader: req.headers.authorization ? 'Present' : 'Missing',
        userId: req.user?.uid || 'No user ID'
    });

    try {
        const logId = req.params.logId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // First verify the log exists and user has access to it
        const logCheck = await db.query(
            'SELECT user_id FROM logs WHERE log_id = $1',
            [logId]
        );

        console.log('Log check results:', {
            logFound: logCheck.rows.length > 0,
            logOwnerId: logCheck.rows[0]?.user_id,
            requestUserId: req.user?.uid
        });

        if (logCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Log not found' });
        }

        // Verify the user has access to this log
        if (logCheck.rows[0].user_id !== req.user.uid) {
            console.log('Authorization mismatch:', {
                logOwnerId: logCheck.rows[0].user_id,
                requestUserId: req.user.uid
            });
            return res.status(403).json({ error: 'Not authorized to view these reviews' });
        }

        // Fetch reviews with their field values
        const reviewsQuery = `
            WITH ReviewData AS (
                SELECT 
                    r.*,
                    COUNT(*) OVER() as total_count
                FROM reviews r
                WHERE r.log_id = $1 AND r.status = 'visible'
                ORDER BY r.submitted_at DESC
                LIMIT $2 OFFSET $3
            )
            SELECT 
                rd.*,
                json_agg(
                    json_build_object(
                        'value_id', rfv.value_id,
                        'field_name', rfv.field_name,
                        'field_value', rfv.field_value,
                        'file_url', rfv.file_url
                    ) ORDER BY rfv.field_name
                ) as field_values
            FROM ReviewData rd
            LEFT JOIN review_field_values rfv ON rd.review_id = rfv.review_id
            GROUP BY 
                rd.review_id, 
                rd.log_id, 
                rd.reviewer_name, 
                rd.submitted_at, 
                rd.submission_date,
                rd.ip_address, 
                rd.status,
                rd.total_count
        `;

        const result = await db.query(reviewsQuery, [logId, limit, offset]);
        console.log('Query results:', {
            reviewsFound: result.rows.length,
            totalCount: result.rows[0]?.total_count || 0
        });

        // If no reviews found, return empty array with pagination
        if (result.rows.length === 0) {
            return res.json({
                reviews: [],
                pagination: {
                    current_page: page,
                    total_pages: 0,
                    total_records: 0,
                    limit: limit
                }
            });
        }

        // Calculate pagination info
        const totalCount = parseInt(result.rows[0].total_count);
        const totalPages = Math.ceil(totalCount / limit);

        // Format the response
        const reviews = result.rows.map(row => {
            const { total_count, ...reviewData } = row;
            return {
                ...reviewData,
                field_values: reviewData.field_values || []
            };
        });

        res.json({
            reviews,
            pagination: {
                current_page: page,
                total_pages: totalPages,
                total_records: totalCount,
                limit: limit
            }
        });

    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// GET endpoint for fetching a specific review with its field values
router.get('/logs/:logId/reviews/:reviewId', auth, async (req, res) => {
    const { logId, reviewId } = req.params;

    try {
        // First verify that this review belongs to a log owned by the authenticated user
        const logCheck = await db.query(
            'SELECT user_id FROM logs WHERE log_id = $1',
            [logId]
        );

        if (logCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Log not found' });
        }

        if (logCheck.rows[0].user_id !== req.user.uid) {
            return res.status(403).json({ error: 'Not authorized to view this review' });
        }

        // Fetch the review and its field values
        const reviewResult = await db.query(
            `SELECT r.review_id, r.reviewer_name, r.submitted_at,
                    json_agg(json_build_object(
                        'field_name', rfv.field_name,
                        'field_value', rfv.field_value,
                        'file_url', rfv.file_url
                    )) as field_values
            FROM reviews r
            LEFT JOIN review_field_values rfv ON r.review_id = rfv.review_id
            WHERE r.review_id = $1 AND r.log_id = $2
            GROUP BY r.review_id, r.reviewer_name, r.submitted_at`,
            [reviewId, logId]
        );

        if (reviewResult.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }

        res.json(reviewResult.rows[0]);
    } catch (error) {
        console.error('Error fetching review:', error);
        res.status(500).json({ error: 'Failed to fetch review details' });
    }
});

// Delete a specific log
router.delete('/logs/:logId', auth, async (req, res) => {
    const logId = req.params.logId;
    const userId = req.user.uid;

    try {
        // Start a transaction
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // Verify the log belongs to the user
            const logResult = await client.query(
                'SELECT user_id FROM logs WHERE log_id = $1',
                [logId]
            );

            if (logResult.rows.length === 0) {
                return res.status(404).json({ error: 'Log not found' });
            }

            if (logResult.rows[0].user_id !== userId) {
                return res.status(403).json({ error: 'Not authorized to delete this log' });
            }

            // Delete related records first (due to foreign key constraints)
            await client.query('DELETE FROM review_field_values WHERE review_id IN (SELECT review_id FROM reviews WHERE log_id = $1)', [logId]);
            await client.query('DELETE FROM reviews WHERE log_id = $1', [logId]);
            await client.query('DELETE FROM log_fields WHERE log_id = $1', [logId]);
            await client.query('DELETE FROM logs WHERE log_id = $1', [logId]);

            await client.query('COMMIT');
            res.status(200).json({ message: 'Log deleted successfully' });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error deleting log:', error);
        res.status(500).json({ error: 'Failed to delete log' });
    }
});

module.exports = router;