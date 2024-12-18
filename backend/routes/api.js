const express = require('express');
const db = require('../db/index');
const router = express.Router();
const { auth } = require('../middleware/firebaseAuth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const qrcode = require('qrcode');

// Authentication Routes

// POST endpoint to either update (last login time) or insert (new user).
router.post('/verify', async (req, res) => {
    try {
        // get the email + name from the request body from the clien, happens after firebase auth is already done
        console.log('Received auth request:', req.body);
        const { email, name } = req.body;
        
        // insert or update operation (update if the user already exists), and return the user_id
        const result = await db.query(
            'INSERT INTO users (email, name) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET last_login_time = CURRENT_TIMESTAMP RETURNING user_id',
            [email, name]
        );
        
        console.log('Database response:', result.rows[0]);
        // send the user_id back to the client
        res.json({ userId: result.rows[0].user_id });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Failed to verify user' });
    }
});
  
// log mananegment route (create, create qrcode)
// creates a POST endpoint at logs. 'auth' ensures only authenicated users can create logs
// make async because of the multiple db operations
router.post('/logs', auth, async (req, res) => {
    // get data from request body from client
    const { title, description, fields } = req.body;
    const user_id = req.body.uid;

    try {
        // get connection to client from the connection pool 
        const client = await db.pool.connect();
        try {
            // use a database transaction to ensure consistency 
            await client.query('BEGIN');

            // create a new log, and return its log_id
            const logResult = await client.query(
                'INSERT INTO logs (user_id, title, descriptions) VALUES ($1, $2, $3) RETURNING log_id',
                [userId, title, description]
            );
            const logId = logResult.rows[0].log_id;

            // generate QR code
            const qrCodeUrl = await QRCode.toDataURL(`${process.env.APP_URL}/review/${logId}`);

            // update log with qr code url
            await client.query(
                'UPDATE logs SET qr_code_url = $1 WHERE log_id = $2',
                [qrCodeUrl, logId]
            );

            // create all the custom log fields
            // loop through all of the fields and insert their properties
            for (const [index, fields] of fields.entries()) {
                await client.query(
                    'INSERT INTO log_fields (log_id, field_name, is_enabled, is_required, display_order) VALUES ($1, $2, $3, $4, $5)',
                    [logId, field.name, field.enabled, field.required, index]
                );
            }

            // commit the transaction
            // send back the lodId and qrcode to the client
            await client.query('COMMIT');
            res.json({ logId, qrCodeUrl });
        } catch (error) {
            // cancel transaction if there was an error
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to create log' });
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