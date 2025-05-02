# QRuestBook

QRuestBook is a web application that allows users to create and manage guestbook forms that can be accesses through QR codes for collecting fun guest memories and silly reviews. Users can create customized forms, generate QR codes, and collect responses from people who scan them.

The Knock Knock Bathroom Guestbook inspired me to create this project. My family owns the Knock Knock Couch Guestbook, but no one ever fills it out. I thought a great way to solve this issue would be to create the form digitally, and have users scan a QR code to fill it out. I have link the Knock Knock Bathroom Guestbook and website below:
https://knockknockstuff.com/
https://knockknockstuff.com/products/bathroom-guestbook-2022-edition?_pos=1&_sid=197250704&_ss=r

## Features

- User authentication with Firebase
- Create customizable feedback forms
- Generate unique QR codes for each form
- Collect and manage reviews
- View analytics and responses
- Mobile-responsive design

## Future Features

- More customization for forms (general guest form, couch guestbook, etc)
- Cuter (and possibly customizable as well) styling
- Email notifcation system to see when someone has filled out a form you created

## Tech Stack

### Frontend
- React
- Tailwind CSS
- Firebase Authentication
- React Router

### Backend
- Node.js
- Express
- PostgreSQL
- Firebase Admin SDK
- QR Code generation

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd QRuestBook
```

2. Install dependencies:

For the backend:
```bash
cd backend
npm install
```

For the frontend:
```bash
cd frontend
npm install
```

3. Set up environment variables:

Create a `.env` file in the backend directory:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qrreview_db
DB_USER=postgres
DB_PASSWORD=your_password
TEST_DB_NAME=logreview_test_db
PORT=5000
APP_URL=http://localhost:3000
```

4. Set up the database:
```bash
psql -U postgres -f backend/db/schema.js
```

## Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server:
```bash
cd frontend
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
├── backend/
│   ├── db/
│   │   ├── index.js
│   │   ├── database.js
│   │   └── schema.js
│   ├── middleware/
│   │   └── FirebaseAuth.js
│   ├── routes/
│   │   └── api.js
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── firebase.js
│   └── package.json
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/verify` - Verify user token and create/update user

### Logs
- `POST /api/logs` - Create a new log
- `GET /api/logs` - Get all logs for a user
- `GET /api/logs/:logId/config` - Get log configuration
- `PUT /api/logs/:logId` - Update a log
- `DELETE /api/logs/:logId` - Delete a log

### Reviews
- `POST /api/logs/:logId/reviews` - Submit a review
- `GET /api/logs/:logId/reviews` - Get all reviews for a log
- `GET /api/logs/:logId/reviews/:reviewId` - Get a specific review

## Database Schema

The application uses the following main tables:
- `users` - User information
- `logs` - Log/form configurations
- `log_fields` - Form field settings
- `reviews` - Submitted reviews
- `review_field_values` - Review content

## Security

- Firebase Authentication for user management
- Rate limiting for review submissions
- IP-based spam prevention
- Secure file uploads with Multer

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

