/**
 * Maps database and authentication errors to user-friendly messages.
 * This prevents exposing internal database details to users.
 */
export function getUserFriendlyError(error: any): string {
  const errorCode = error?.code || error?.message || '';
  const errorMessage = error?.message || '';

  // PostgreSQL error codes
  const errorMap: Record<string, string> = {
    '23505': 'This record already exists.',
    '23503': 'Related record not found.',
    '23502': 'Required information is missing.',
    '23514': 'The data provided is not valid.',
    '42501': 'You do not have permission for this action.',
    '42P01': 'Unable to complete request.',
    'PGRST': 'Unable to complete request.',
  };

  // Check for known PostgreSQL error codes
  for (const [code, message] of Object.entries(errorMap)) {
    if (errorCode.includes(code) || errorMessage.includes(code)) {
      return message;
    }
  }

  // Authentication-specific errors (user-friendly messages from Supabase Auth)
  const authErrors: Record<string, string> = {
    'Invalid login credentials': 'Invalid email or password.',
    'Email not confirmed': 'Please verify your email address.',
    'User already registered': 'An account with this email already exists.',
    'Password should be at least': 'Password must be at least 6 characters.',
    'invalid_credentials': 'Invalid email or password.',
    'user_not_found': 'No account found with this email.',
    'email_taken': 'An account with this email already exists.',
  };

  for (const [pattern, message] of Object.entries(authErrors)) {
    if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
      return message;
    }
  }

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Generic fallback - never expose raw error messages
  return 'An error occurred. Please try again.';
}
