export interface MappedError {
  message: string;
  field?: string;
  fieldErrors?: Record<string, string>;
}

const FIELD_MAPPING = [
  { keys: ['email', 'почт'], field: 'email', label: 'Email address' },
  { keys: ['password', 'парол'], field: 'password', label: 'Password' },
  { keys: ['username', 'displayname', 'имя', 'пользовател', 'логин'], field: 'displayName', label: 'Username' },
  { keys: ['name', 'назван', 'заголовок', 'title'], field: 'name', label: 'Name' },
  { keys: ['description', 'описан'], field: 'description', label: 'Description' },
  { keys: ['teamsize', 'размер', 'команд', 'участник'], field: 'teamSize', label: 'Team size' },
  { keys: ['apikey', 'api key', 'ключ'], field: 'apiKey', label: 'API key' },
  { keys: ['ollamabaseurl', 'url', 'ссылк', 'адрес'], field: 'ollamaBaseUrl', label: 'Ollama URL' },
  { keys: ['provider', 'провайдер'], field: 'provider', label: 'AI provider' },
  { keys: ['model', 'модель'], field: 'model', label: 'AI model' },
];

const RULE_PATTERNS = [
  {
    patterns: [
      'не должно быть пустым', 'не может быть пустым', 'обязательно', 'не заполнено', 'пуст',
      'must not be blank', 'must not be empty', 'must not be null', 'required', 'blank', 'empty', 'null'
    ],
    template: '{field} is required.'
  },
  {
    patterns: [
      'уже зарегистрирован', 'уже занят', 'уже существует', 'дубликат',
      'already registered', 'already taken', 'already exists', 'taken', 'exists', 'duplicate', 'conflict'
    ],
    template: '{field} is already taken.'
  },
  {
    patterns: [
      'неверный формат', 'некорректный формат', 'некорректная', 'неправильный', 'невалидн',
      'invalid', 'must be a valid', 'format', 'well-formed'
    ],
    template: 'Invalid {field} format.'
  },
  {
    patterns: [
      'слишком короткий', 'не менее', 'минимальная длина',
      'too short', 'minimum length', 'must be at least', 'min'
    ],
    template: '{field} is too short.'
  },
  {
    patterns: [
      'слишком длинный', 'не более', 'максимальная длина',
      'too long', 'maximum length', 'must be at most', 'max'
    ],
    template: '{field} is too long.'
  },
  {
    patterns: [
      'должно быть больше', 'положительное',
      'positive', 'greater than', 'must be a positive number'
    ],
    template: '{field} must be a positive number.'
  }
];

const translateAndFormatMessage = (
  message: string,
  contextField?: string
): { message: string; field?: string } => {
  const lowerMsg = message.toLowerCase();

  let detectedField = contextField;
  let fieldLabel = 'Field';

  if (detectedField) {
    const found = FIELD_MAPPING.find(item => item.field === detectedField);
    if (found) {
      fieldLabel = found.label;
    }
  } else {
    for (const item of FIELD_MAPPING) {
      if (item.keys.some(k => lowerMsg.includes(k))) {
        detectedField = item.field;
        fieldLabel = item.label;
        break;
      }
    }
  }

  if (!detectedField && !/[а-яА-ЯёЁ]/.test(message)) {
    return {
      message: message.charAt(0).toUpperCase() + message.slice(1),
      field: undefined
    };
  }

  let matchedRuleTemplate: string | undefined;
  for (const rule of RULE_PATTERNS) {
    if (rule.patterns.some(p => lowerMsg.includes(p))) {
      matchedRuleTemplate = rule.template;
      break;
    }
  }

  let finalMessage: string;
  if (matchedRuleTemplate) {
    finalMessage = matchedRuleTemplate.replace('{field}', fieldLabel);

    if (detectedField === 'email') {
      if (matchedRuleTemplate.includes('already taken')) {
        finalMessage = 'Email is already registered.';
      } else if (matchedRuleTemplate.includes('invalid') || matchedRuleTemplate.includes('format')) {
        finalMessage = 'Please enter a valid email address.';
      }
    } else if (detectedField === 'displayName') {
      if (matchedRuleTemplate.includes('already taken')) {
        finalMessage = 'Username is already taken.';
      } else if (matchedRuleTemplate.includes('required')) {
        finalMessage = 'Username is required.';
      }
    } else if (detectedField === 'password') {
      if (matchedRuleTemplate.includes('required')) {
        finalMessage = 'Password is required.';
      } else if (lowerMsg.includes('8') || lowerMsg.includes('длин') || lowerMsg.includes('символ') || lowerMsg.includes('at least')) {
        finalMessage = 'Password must be at least 8 characters long.';
      }
    }
  } else {
    if (!/[а-яА-ЯёЁ]/.test(message)) {
      finalMessage = message.charAt(0).toUpperCase() + message.slice(1);
    } else {
      finalMessage = detectedField ? `Invalid ${fieldLabel.toLowerCase()}.` : message;
    }
  }

  return {
    message: finalMessage,
    field: detectedField
  };
};

export const mapServerErrorToEnglish = (
  errorData: unknown,
  status: number | undefined,
  context?: { isLogin?: boolean }
): MappedError => {
  const isLogin = context?.isLogin ?? false;

  if (status === 401) {
    return {
      message: isLogin ? 'Invalid email or password.' : 'Session expired or unauthorized.'
    };
  }
  if (status === 404) {
    return { message: 'Requested resource not found.' };
  }
  if (status === 413) {
    return { message: 'File is too large.' };
  }
  if (status === 500) {
    return { message: 'Internal server error. Please try again later.' };
  }
  if (!status) {
    return { message: 'Failed to connect to the server. Please check your connection and try again.' };
  }

  let apiMessage = '';
  const fieldErrors: Record<string, string> = {};

  if (errorData) {
    if (typeof errorData === 'string') {
      apiMessage = errorData;
    } else if (typeof errorData === 'object' && errorData !== null) {
      const dataObj = errorData as Record<string, unknown>;
      apiMessage = typeof dataObj.message === 'string' ? dataObj.message : '';

      const errorsList = dataObj.errors || dataObj.validationErrors;
      if (Array.isArray(errorsList)) {
        for (const err of errorsList) {
          if (err && typeof err === 'object') {
            const errObj = err as Record<string, unknown>;
            const fieldName = typeof errObj.field === 'string' ? errObj.field : '';
            const rawMsg = typeof errObj.message === 'string' ? errObj.message : '';
            const parsed = translateAndFormatMessage(rawMsg || fieldName, fieldName);
            const resolvedField = parsed.field || fieldName;
            if (resolvedField) {
              fieldErrors[resolvedField] = parsed.message;
            }
          }
        }
      } else {
        const errorsObj = dataObj.errors || dataObj.validationErrors;
        if (errorsObj && typeof errorsObj === 'object') {
          for (const [fieldName, rawMsg] of Object.entries(errorsObj)) {
            if (typeof rawMsg === 'string') {
              const parsed = translateAndFormatMessage(rawMsg, fieldName);
              const resolvedField = parsed.field || fieldName;
              fieldErrors[resolvedField] = parsed.message;
            }
          }
        }
      }
    }
  }

  if (Object.keys(fieldErrors).length === 0 && apiMessage) {
    const parsed = translateAndFormatMessage(apiMessage);
    if (parsed.field) {
      fieldErrors[parsed.field] = parsed.message;
    } else {
      const translatedGeneral = translateAndFormatMessage(apiMessage).message;
      return { message: translatedGeneral };
    }
  }

  const keys = Object.keys(fieldErrors);
  if (keys.length > 0) {
    const firstField = keys[0];
    return {
      message: keys.length === 1
        ? fieldErrors[firstField]
        : 'Several fields contain invalid values. Please check your inputs.',
      field: firstField,
      fieldErrors
    };
  }

  if (status === 400) {
    return { message: 'Invalid request parameters. Please verify your inputs.' };
  }
  if (status === 409) {
    return { message: 'Conflict occurred. Please verify your inputs.' };
  }

  return { message: apiMessage || 'An unexpected error occurred. Please try again.' };
};
