import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { urlShortenerService } from '../utils/urlShortener';
import { logger } from '../utils/logger';
import { ExternalLink, AlertCircle, Clock } from 'lucide-react';

const Redirect: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [status, setStatus] = useState<'loading' | 'found' | 'expired' | 'notfound'>('loading');
  const [originalUrl, setOriginalUrl] = useState<string>('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!shortCode) {
      setStatus('notfound');
      return;
    }

    logger.info('Redirect request initiated', { shortCode }, 'Redirect');

    const url = urlShortenerService.getURLByShortCode(shortCode);
    
    if (!url) {
      setStatus('notfound');
      logger.warn('Short code not found', { shortCode }, 'Redirect');
      return;
    }

    if (url.isExpired) {
      setStatus('expired');
      logger.warn('Attempted redirect to expired URL', { shortCode, expiresAt: url.expiresAt }, 'Redirect');
      return;
    }

    // Record the click
    const source = document.referrer || 'direct';
    urlShortenerService.recordClick(shortCode, source);
    
    setOriginalUrl(url.originalUrl);
    setStatus('found');
    
    logger.info('Successful redirect', { 
      shortCode, 
      originalUrl: url.originalUrl, 
      source 
    }, 'Redirect');

    // Start countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          window.location.href = url.originalUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [shortCode]);

  const handleManualRedirect = () => {
    if (originalUrl) {
      logger.info('Manual redirect initiated', { shortCode, originalUrl }, 'Redirect');
      window.location.href = originalUrl;
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'found') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full mx-4">
          <div className="mb-6">
            <div className="bg-blue-100 p-3 rounded-full inline-block mb-4">
              <ExternalLink className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Redirecting...</h1>
            <p className="text-gray-600 mb-4">
              You will be redirected to your destination in {countdown} seconds.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-600 mb-2">Destination:</p>
            <p className="text-blue-600 break-all font-medium">{originalUrl}</p>
          </div>

          <button
            onClick={handleManualRedirect}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Go Now</span>
          </button>
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full mx-4">
          <div className="bg-yellow-100 p-3 rounded-full inline-block mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Link Expired</h1>
          <p className="text-gray-600 mb-6">
            This shortened URL has expired and is no longer valid.
          </p>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  // Not found
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full mx-4">
        <div className="bg-red-100 p-3 rounded-full inline-block mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Link Not Found</h1>
        <p className="text-gray-600 mb-6">
          The shortened URL you're looking for doesn't exist or has been removed.
        </p>
        <Navigate to="/" replace />
      </div>
    </div>
  );
};

export default Redirect;