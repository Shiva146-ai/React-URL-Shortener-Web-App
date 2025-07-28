import React, { useState, useEffect } from 'react';
import URLForm from '../components/URLForm';
import URLResults from '../components/URLResults';
import { URLFormData, ShortenedURL } from '../types';
import { urlShortenerService } from '../utils/urlShortener';
import { logger } from '../utils/logger';

const Home: React.FC = () => {
  const [createdUrls, setCreatedUrls] = useState<ShortenedURL[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    logger.info('Home page mounted', undefined, 'Home');
  }, []);

  const handleFormSubmit = async (urls: URLFormData[]) => {
    setIsSubmitting(true);
    logger.info('Processing URL creation request', { urlCount: urls.length }, 'Home');

    try {
      const newUrls: ShortenedURL[] = [];
      
      for (const urlData of urls) {
        try {
          const shortenedUrl = urlShortenerService.createShortenedURL(
            urlData.originalUrl,
            urlData.validityMinutes,
            urlData.customShortcode || undefined
          );
          newUrls.push(shortenedUrl);
        } catch (error) {
          logger.error('Failed to create shortened URL', { 
            error: error instanceof Error ? error.message : error,
            urlData 
          }, 'Home');
          throw error;
        }
      }

      setCreatedUrls(newUrls);
      logger.info('Successfully created all URLs', { count: newUrls.length }, 'Home');
    } catch (error) {
      logger.error('URL creation process failed', error, 'Home');
      alert(error instanceof Error ? error.message : 'An error occurred while creating URLs');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          AffordMed URL Shortener
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Create shortened URLs with custom expiration times and track detailed analytics.
          Perfect for managing temporary links and monitoring engagement.
        </p>
      </div>

      <URLForm onSubmit={handleFormSubmit} />
      
      {isSubmitting && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Creating your short URLs...</p>
        </div>
      )}

      <URLResults urls={createdUrls} />
    </div>
  );
};

export default Home;