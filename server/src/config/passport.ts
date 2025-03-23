import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User, { IUser } from '../models/User';
import { Document } from 'mongoose';

// Configure Google OAuth Strategy only if credentials are available
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// מגדיר כתובת קבועה במקום משתנה דינמי
const SERVER_URL = process.env.NODE_ENV === 'production' 
  ? `https://localhost:${process.env.HTTPS_PORT || '5443'}`
  : `http://localhost:${process.env.PORT || '5000'}`;

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  // לוג מפורט של ההגדרות הנוכחיות
  console.log(`Configuring Google OAuth with:
  - Client ID: ${GOOGLE_CLIENT_ID ? GOOGLE_CLIENT_ID.substring(0, 10) + '...' : 'missing'}
  - Callback URL: ${SERVER_URL}/api/auth/google/callback`);
  
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${SERVER_URL}/api/auth/google/callback`,
        // הוספת פרמטרים נוספים שיכולים לעזור עם הבעיה
        scope: ['profile', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            return done(null, user as any);
          }

          // Check if user exists with the same email
          const email = profile.emails && profile.emails[0].value;
          if (email) {
            user = await User.findOne({ email });
            
            if (user) {
              // Link Google account to existing user
              user.googleId = profile.id;
              await user.save();
              return done(null, user as any);
            }
          }

          // Create new user
          const newUser = new User({
            googleId: profile.id,
            email: email || '',
            username: profile.displayName || `user_${profile.id}`,
            profilePicture: profile.photos && profile.photos[0].value
          });

          await newUser.save();
          return done(null, newUser as any);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
} else {
  console.warn('Google OAuth credentials not found. Google authentication will not be available.');
}

// Serialize and deserialize user
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user as any);
  } catch (error) {
    done(error);
  }
}); 