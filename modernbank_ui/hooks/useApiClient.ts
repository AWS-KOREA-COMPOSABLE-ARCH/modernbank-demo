import { useLanguage } from '@/contexts/LanguageContext';
import { apiRequest, createApiHeaders } from '@/lib/api-client';
import { useCallback } from 'react';

export function useApiClient() {
  const { language } = useLanguage();

  // Generate headers matching current language settings
  const createHeaders = useCallback((additionalHeaders: Record<string, string> = {}) => {
    return createApiHeaders(language, additionalHeaders);
  }, [language]);

  // Language-synchronized API request function
  const request = useCallback(async (
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> => {
    return apiRequest(url, options, language);
  }, [language]);

  // Convenience methods
  const get = useCallback(async (url: string, additionalHeaders: Record<string, string> = {}) => {
    return request(url, {
      method: 'GET',
      headers: createHeaders(additionalHeaders)
    });
  }, [request, createHeaders]);

  const post = useCallback(async (url: string, data?: any, additionalHeaders: Record<string, string> = {}) => {
    return request(url, {
      method: 'POST',
      headers: createHeaders(additionalHeaders),
      body: data ? JSON.stringify(data) : undefined
    });
  }, [request, createHeaders]);

  const put = useCallback(async (url: string, data?: any, additionalHeaders: Record<string, string> = {}) => {
    return request(url, {
      method: 'PUT',
      headers: createHeaders(additionalHeaders),
      body: data ? JSON.stringify(data) : undefined
    });
  }, [request, createHeaders]);

  const del = useCallback(async (url: string, additionalHeaders: Record<string, string> = {}) => {
    return request(url, {
      method: 'DELETE',
      headers: createHeaders(additionalHeaders)
    });
  }, [request, createHeaders]);

  return {
    language,
    createHeaders,
    request,
    get,
    post,
    put,
    delete: del
  };
}