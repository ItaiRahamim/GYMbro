import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/Global.css';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

// הגדרה נכונה יותר של CLIENT_ID עם בדיקת תקינות
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
// וידוא שה-CLIENT_ID קיים ותקין (מתחיל ב-CLIENT_ID של גוגל, בדרך כלל מתחיל ב-)
const isValidClientId = !!GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.length > 20 && !GOOGLE_CLIENT_ID.startsWith('GOCSPX-');

// לוג אבחון מפורט יותר
console.log('Google OAuth Setup:', {
  clientIdValue: GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 10)}...` : 'empty',
  clientIdLength: GOOGLE_CLIENT_ID.length,
  isValidClientId: isValidClientId,
  envVarExists: !!process.env.REACT_APP_GOOGLE_CLIENT_ID
});

if (!isValidClientId) {
  console.warn('Invalid Google Client ID detected - GoogleLogin functionality may not work correctly!');
  console.warn('Please check your .env.local file and make sure REACT_APP_GOOGLE_CLIENT_ID is set correctly.');
  console.warn('Current value appears to be a secret key rather than a Client ID.');
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider 
      clientId={isValidClientId ? GOOGLE_CLIENT_ID : "invalid-client-id-placeholder"}
      onScriptLoadError={() => {
        console.error('Google OAuth script failed to load');
      }}
    >
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
