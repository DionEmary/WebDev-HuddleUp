// lib/auth.js
import supabase from './supabase';

// Sign in with Google
export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });

  if (error) {
    console.error('Google sign-in error:', error.message);
    alert('Google sign-in failed');
  }
};

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Sign-out error:', error.message);
    alert('Sign-out failed');
  }
};

// Get the currently signed-in user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
};
