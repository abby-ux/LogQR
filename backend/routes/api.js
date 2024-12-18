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

        const result = await db.query(
            `INSERT INTO users (email, name, last_login_time) 
             VALUES ($1, $2, CURRENT_TIMESTAMP) 
             ON CONFLICT (email) 
             DO UPDATE SET last_login_time = CURRENT_TIMESTAMP, name = EXCLUDED.name
             RETURNING user_id`,
            [email, name]
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
router.get('/logs', auth, async (req, res) => {
    const userId = req.user.uid;
    // set a limit of 10 logs per page to handle possibly large amounts of data
    const { page = 1, limit = 10, status  } = req.query;
    const offset = (page - 1) * limit;

    // validate input
    // ...

    try {
        // verify that the user exists
        // const user = await new Promise((resolve, reject) => {
        //     db.get(`SELECT * FROM logs WHERE user_id = ?`, [userId], (err, row) => {
        //         if (err) reject (err);
        //         resolve(row);
        //     });
        // });

        const query = `SELECT * FROM logs WHERE user_id = $1`;
        const params = [userId];

        // conditionally add status filtering
        if (status) {
            query += ` AND status = $2`;
            params.push(status);
        }

        // order logs from newest to oldest by default 
        // limit the results per page, and add offset to jump to the right page
        query += ` ORDERED BY created_at DESC LIMIT $3 OFFSET $4`;
        params.push(limit, offset);

        // execute the query and send back the results to the client
        const result = await db.query(query, params);
        res.status(200).json(result.rows);


    } catch (error) {
        console.log('Failed to fetch logs', error);
        res.status(500).json({ message: 'Failed to fetch logs.' });
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
        // check for the rate limit
        const recentReviews = await db.query(
            'SELECT COUNT * FROM reviews WHERE log_id = $1 AND ip_adress = $2 AND submitted_at > NOW - INTERVAL \'1 day\'',
            [logId, clientIp]
        );
        // limit of 5 reviews per day
        if (recentReviews.rows[0].count >= 5) {
            return res.status(429).json({ error: 'Too many reviews submitted' });
        }

        const client = await db.pool.connection();
        try {
            // initialize transaction
            await client.query('BEGIN');

            // create a new review
            const reviewResult = await client.query(
                'INSERT INTO reviews (log_id, reviewer_name, ip_address) VALUES ($1, $2, $3) RETURNING review_id',
                [logId, reviewData.name, clientIp]
            );
            const reviewId = reviewResult.rows[0].review_id;

            // store individual review field values
            for (const [field, values] in Object.entries(reviewData)) {
                if (field !== 'name') { // we already stored the name
                    await client.query(
                        'INSERT INTO review_field_names (review_id, field_name, field_values) VALUES ($1, $2, $3)',
                        [reviewId, field, value]
                    );
                }
            }

            // update review count
            await client.query(
                'UPDATE log SET total_reviews = total_reviews + 1, last_review_at = CURRENT_TIMESTAMP WHERE log_id = $1',
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

module.exports = router;