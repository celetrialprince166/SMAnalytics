/**
 * Real-time Account Name Validation Hook
 * 
 * Checks if account name is available as user types
 */

import { useState, useEffect, useCallback } from 'react';

interface ValidationState {
  isValidating: boolean;
  isValid: boolean | null;
  error: string | null;
}

// Inline debounce hook to avoid import issues
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useAccountNameValidation(
  name: string,
  secondaryAccountId: string | undefined,
  excludeAccountId?: string
) {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: false,
    isValid: null,
    error: null,
  });

  // Debounce the name to avoid too many API calls
  const debouncedName = useDebounce(name, 500);

  const validateName = useCallback(async (nameToValidate: string, secondaryId: string) => {
    if (!nameToValidate.trim() || !secondaryId) {
      setValidationState({
        isValidating: false,
        isValid: null,
        error: null,
      });
      return;
    }

    setValidationState(prev => ({ ...prev, isValidating: true, error: null }));

    try {
      const response = await fetch('/api/accounts/validate-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameToValidate.trim(),
          secondaryAccountId: secondaryId,
          excludeAccountId,
        }),
      });

      const data = await response.json();
      console.log('Validation API response:', { status: response.status, data });

      if (response.ok) {
        setValidationState({
          isValidating: false,
          isValid: true,
          error: null,
        });
      } else {
        // Extract the actual error message from the API response
        let errorMessage = 'Name validation failed';
        
        if (typeof data.message === 'string') {
          errorMessage = data.message;
        } else if (typeof data.error === 'string') {
          errorMessage = data.error;
        } else if (data.message && typeof data.message === 'object') {
          errorMessage = JSON.stringify(data.message);
        }
        
        console.log('Extracted error message:', errorMessage);
        
        setValidationState({
          isValidating: false,
          isValid: false,
          error: errorMessage,
        });
      }
    } catch (error) {
      console.error('Validation API error:', error);
      setValidationState({
        isValidating: false,
        isValid: null,
        error: 'Unable to validate name. Please check your connection.',
      });
    }
  }, [excludeAccountId]);

  useEffect(() => {
    if (debouncedName && secondaryAccountId) {
      validateName(debouncedName, secondaryAccountId);
    } else {
      setValidationState({
        isValidating: false,
        isValid: null,
        error: null,
      });
    }
  }, [debouncedName, secondaryAccountId, validateName]);

  return validationState;
}

