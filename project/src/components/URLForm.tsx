import React, { useState } from 'react';
import { Plus, X, Link, Clock, Code } from 'lucide-react';
import { URLFormData } from '../types';
import { logger } from '../utils/logger';

interface URLFormProps {
  onSubmit: (urls: URLFormData[]) => void;
  maxUrls?: number;
}

const URLForm: React.FC<URLFormProps> = ({ onSubmit, maxUrls = 5 }) => {
  const [urls, setUrls] = useState<URLFormData[]>([
    { originalUrl: '', validityMinutes: 30, customShortcode: '' }
  ]);
  const [errors, setErrors] = useState<string[]>([]);

  const addURL = () => {
    if (urls.length < maxUrls) {
      setUrls([...urls, { originalUrl: '', validityMinutes: 30, customShortcode: '' }]);
      logger.info('Added new URL form', { currentCount: urls.length + 1 }, 'URLForm');
    }
  };

  const removeURL = (index: number) => {
    if (urls.length > 1) {
      const newUrls = urls.filter((_, i) => i !== index);
      setUrls(newUrls);
      setErrors(errors.filter((_, i) => i !== index));
      logger.info('Removed URL form', { index, newCount: newUrls.length }, 'URLForm');
    }
  };

  const updateURL = (index: number, field: keyof URLFormData, value: string | number) => {
    const newUrls = [...urls];
    newUrls[index] = { ...newUrls[index], [field]: value };
    setUrls(newUrls);
  };

  const validateURL = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateShortcode = (shortcode: string): boolean => {
    return shortcode === '' || /^[a-zA-Z0-9]{1,20}$/.test(shortcode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logger.info('Form submission started', { urlCount: urls.length }, 'URLForm');

    const newErrors: string[] = [];

    urls.forEach((url, index) => {
      let error = '';

      if (!url.originalUrl.trim()) {
        error = 'URL is required';
      } else if (!validateURL(url.originalUrl)) {
        error = 'Invalid URL format';
      } else if (url.validityMinutes < 1 || url.validityMinutes > 10080) {
        error = 'Validity must be between 1 and 10080 minutes';
      } else if (!validateShortcode(url.customShortcode)) {
        error = 'Shortcode must be alphanumeric and 1-20 characters';
      }

      newErrors[index] = error;
    });

    setErrors(newErrors);

    if (newErrors.some(error => error !== '')) {
      logger.warn('Form validation failed', { errors: newErrors }, 'URLForm');
      return;
    }

    const validUrls = urls.filter(url => url.originalUrl.trim() !== '');
    logger.info('Form validation successful', { validUrlCount: validUrls.length }, 'URLForm');
    onSubmit(validUrls);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create Short URLs</h2>
        <span className="text-sm text-gray-500">
          {urls.length} of {maxUrls} URLs
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {urls.map((url, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">URL #{index + 1}</h3>
              {urls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeURL(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Link className="w-4 h-4" />
                <span>Original URL</span>
              </label>
              <input
                type="url"
                value={url.originalUrl}
                onChange={(e) => updateURL(index, 'originalUrl', e.target.value)}
                placeholder="https://example.com/very-long-url"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              {errors[index] && (
                <p className="mt-1 text-sm text-red-600">{errors[index]}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4" />
                  <span>Validity (minutes)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="10080"
                  value={url.validityMinutes}
                  onChange={(e) => updateURL(index, 'validityMinutes', parseInt(e.target.value) || 30)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Code className="w-4 h-4" />
                  <span>Custom Shortcode (optional)</span>
                </label>
                <input
                  type="text"
                  value={url.customShortcode}
                  onChange={(e) => updateURL(index, 'customShortcode', e.target.value)}
                  placeholder="my-link"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between">
          {urls.length < maxUrls && (
            <button
              type="button"
              onClick={addURL}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another URL</span>
            </button>
          )}

          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            <Link className="w-4 h-4" />
            <span>Create Short URLs</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default URLForm;