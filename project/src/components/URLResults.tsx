import React, { useState } from 'react';
import { Copy, ExternalLink, Clock, Check, AlertCircle } from 'lucide-react';
import { ShortenedURL } from '../types';
import { format } from 'date-fns';
import { logger } from '../utils/logger';

interface URLResultsProps {
  urls: ShortenedURL[];
}

const URLResults: React.FC<URLResultsProps> = ({ urls }) => {
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIds(prev => new Set(prev).add(id));
      logger.info('URL copied to clipboard', { id, url: text }, 'URLResults');
      
      setTimeout(() => {
        setCopiedIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      logger.error('Failed to copy URL to clipboard', error, 'URLResults');
    }
  };

  const openInNewTab = (url: string) => {
    window.open(url, '_blank');
    logger.info('URL opened in new tab', { url }, 'URLResults');
  };

  if (urls.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Created Short URLs</h2>
      
      <div className="space-y-4">
        {urls.map((url) => (
          <div key={url.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {url.originalUrl}
                  </h3>
                  {url.isExpired && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Expired
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>Created: {format(url.createdAt, 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>Expires: {format(url.expiresAt, 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                  <span>{url.clicks.length} clicks</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-md">
              <code className="flex-1 text-blue-600 font-mono text-sm">
                {url.shortUrl}
              </code>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyToClipboard(url.shortUrl, url.id)}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  {copiedIds.has(url.id) ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => openInNewTab(url.shortUrl)}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Visit</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default URLResults;