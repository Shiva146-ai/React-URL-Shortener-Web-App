import React, { useState, useEffect } from 'react';
import { Link, MousePointer, Clock, TrendingUp, Globe, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import StatisticsCard from '../components/StatisticsCard';
import { ShortenedURL } from '../types';
import { urlShortenerService } from '../utils/urlShortener';
import { format } from 'date-fns';
import { logger } from '../utils/logger';

const Statistics: React.FC = () => {
  const [urls, setUrls] = useState<ShortenedURL[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<ShortenedURL | null>(null);

  useEffect(() => {
    loadData();
    logger.info('Statistics page mounted', undefined, 'Statistics');
  }, []);

  const loadData = () => {
    const allUrls = urlShortenerService.getAllURLs();
    setUrls(allUrls);
    logger.info('Statistics data loaded', { urlCount: allUrls.length }, 'Statistics');
  };

  const handleDeleteUrl = (id: string) => {
    if (window.confirm('Are you sure you want to delete this URL?')) {
      urlShortenerService.deleteURL(id);
      loadData();
      if (selectedUrl?.id === id) {
        setSelectedUrl(null);
      }
      logger.info('URL deleted from statistics', { id }, 'Statistics');
    }
  };

  const totalClicks = urls.reduce((sum, url) => sum + url.clicks.length, 0);
  const activeUrls = urls.filter(url => !url.isExpired).length;
  const expiredUrls = urls.length - activeUrls;

  // Chart data for clicks over time
  const getClicksOverTime = () => {
    const clicksByDate: { [key: string]: number } = {};
    
    urls.forEach(url => {
      url.clicks.forEach(click => {
        const date = format(click.timestamp, 'MMM dd');
        clicksByDate[date] = (clicksByDate[date] || 0) + 1;
      });
    });

    return Object.entries(clicksByDate)
      .map(([date, clicks]) => ({ date, clicks }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Chart data for URL performance
  const getUrlPerformance = () => {
    return urls
      .map(url => ({
        shortCode: url.shortCode,
        clicks: url.clicks.length,
        isExpired: url.isExpired
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);
  };

  const clicksOverTime = getClicksOverTime();
  const urlPerformance = getUrlPerformance();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          URL Statistics & Analytics
        </h1>
        <p className="text-xl text-gray-600">
          Comprehensive analytics for all your shortened URLs
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatisticsCard
          title="Total URLs"
          value={urls.length}
          icon={Link}
        />
        <StatisticsCard
          title="Total Clicks"
          value={totalClicks}
          icon={MousePointer}
        />
        <StatisticsCard
          title="Active URLs"
          value={activeUrls}
          changeType="positive"
          icon={TrendingUp}
        />
        <StatisticsCard
          title="Expired URLs"
          value={expiredUrls}
          changeType="negative"
          icon={Clock}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Clicks Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={clicksOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="clicks" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing URLs</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={urlPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="shortCode" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="clicks" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* URL List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All URLs</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Short Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {urls.map((url) => (
                <tr key={url.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {url.originalUrl}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm font-mono text-blue-600">
                      {url.shortCode}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {url.clicks.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(url.createdAt, 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      url.isExpired 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {url.isExpired ? 'Expired' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedUrl(url)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleDeleteUrl(url.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* URL Details Modal */}
      {selectedUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">URL Details</h3>
              <button
                onClick={() => setSelectedUrl(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* URL Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Original URL</label>
                  <p className="mt-1 text-sm text-gray-900 break-all">{selectedUrl.originalUrl}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Short URL</label>
                  <p className="mt-1 text-sm text-blue-600 font-mono">{selectedUrl.shortUrl}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(selectedUrl.createdAt, 'MMM dd, yyyy HH:mm:ss')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expires</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(selectedUrl.expiresAt, 'MMM dd, yyyy HH:mm:ss')}
                  </p>
                </div>
              </div>

              {/* Click Details */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Click History ({selectedUrl.clicks.length} clicks)
                </h4>
                
                {selectedUrl.clicks.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Timestamp
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Source
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Location
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User Agent
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedUrl.clicks.map((click) => (
                          <tr key={click.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {format(click.timestamp, 'MMM dd, yyyy HH:mm:ss')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {click.source}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <Globe className="w-4 h-4 mr-1" />
                                {click.location}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                              {click.userAgent}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No clicks recorded yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;