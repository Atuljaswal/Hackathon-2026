/** Friendly messages for common Firebase Authentication and profile errors. */
export function authErrorMessage(error) {
  switch (error?.code) {
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try logging in.';
    case 'auth/weak-password':
      return 'Choose a stronger password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'permission-denied':
    case 'firestore/permission-denied':
      return 'Your account may have been created, but the profile could not be saved. Try logging in or contact the developer.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
