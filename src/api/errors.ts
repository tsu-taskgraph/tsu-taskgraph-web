export interface MappedError {
  message: string;
  field?: string;
}

export const mapServerErrorToEnglish = (
  apiMessage: string,
  status: number | undefined,
  context?: { isLogin?: boolean }
): MappedError => {
  const lowerMessage = apiMessage.toLowerCase();
  const isLogin = context?.isLogin ?? false;

  if (status === 401) {
    return {
      message: isLogin ? 'Invalid email or password.' : 'Session expired or unauthorized.'
    };
  }

  if (status === 409) {
    if (lowerMessage.includes('email') || lowerMessage.includes('почт')) {
      return { message: 'Email is already registered.', field: 'email' };
    }
    if (
      lowerMessage.includes('username') ||
      lowerMessage.includes('имя') ||
      lowerMessage.includes('пользовател') ||
      lowerMessage.includes('displayname') ||
      lowerMessage.includes('display name')
    ) {
      return { message: 'Username is already taken.', field: 'displayName' };
    }
    return { message: 'This account is already registered.' };
  }

  if (status === 400) {
    if (lowerMessage.includes('email') || lowerMessage.includes('почт')) {
      return { message: 'Please enter a valid email address.', field: 'email' };
    }
    if (lowerMessage.includes('password') || lowerMessage.includes('парол')) {
      if (
        lowerMessage.includes('8') ||
        lowerMessage.includes('длин') ||
        lowerMessage.includes('символ') ||
        lowerMessage.includes('коротк')
      ) {
        return { message: 'Password must be at least 8 characters long.', field: 'password' };
      }
      return { message: 'Invalid password. Please try another one.', field: 'password' };
    }
    if (
      lowerMessage.includes('username') ||
      lowerMessage.includes('имя') ||
      lowerMessage.includes('пользовател') ||
      lowerMessage.includes('displayname') ||
      lowerMessage.includes('display name')
    ) {
      return { message: 'Username is required.', field: 'displayName' };
    }
    return { message: 'Invalid request parameters. Please verify your inputs.' };
  }

  if (status === 404) {
    return { message: 'Requested resource not found.' };
  }

  if (status === 500) {
    return { message: 'Internal server error. Please try again later.' };
  }

  return {
    message: 'Failed to connect to the server. Please check your connection and try again.'
  };
};
