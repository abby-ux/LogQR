import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';

export default function SignUp() {
    // Add name to our state variables alongside email and password
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // First, create the user in Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log('Firebase signup successful');

            // Update the user's profile with their name in Firebase
            await updateProfile(userCredential.user, {
                displayName: name
            });
            console.log('Updated user profile with name');

            // Get the authentication token
            const token = await userCredential.user.getIdToken();
            console.log('Got Firebase token');

            // Store the token
            localStorage.setItem('token', token);

            // Now verify with our backend, sending the proper name
            const response = await fetch('http://localhost:5000/api/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: email,
                    name: name  // Now we use the actual name from the form
                })
            });

            // Log response details for debugging
            console.log('Backend response status:', response.status);
            const data = await response.json();
            console.log('Backend response data:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Failed to verify with backend');
            }

            // If everything worked, navigate to home
            navigate('/');
        } catch (error) {
            console.error('Signup error:', error);
            // Provide more user-friendly error messages
            if (error.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters');
            } else if (error.code === 'auth/email-already-in-use') {
                setError('This email is already registered');
            } else {
                setError(error.message || 'Failed to sign up');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
                <h2 className="text-3xl font-bold text-center">Sign up for LogQR</h2>
                {error && <div className="text-red-500 text-center">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Add name input field */}
                    <div>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Full Name"
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Sign up
                    </button>
                </form>
                <p className="text-center">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 hover:text-blue-800">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}