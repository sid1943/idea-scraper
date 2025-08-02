import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, TrendingUp, Users, MessageCircle, Heart, Share2, ExternalLink, Code, Lightbulb, Rocket, Star, BookOpen, Zap, ArrowUp, Eye, Calendar, Tag, Globe, Settings, AlertCircle, CheckCircle, X } from 'lucide-react';

const App = () => {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('trending');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [scrapingStatus, setScrapingStatus] = useState({ reddit: 'idle', twitter: 'idle' });
  const [error, setError] = useState(null);

  // API Configuration
  const [apiConfig, setApiConfig] = useState({
    reddit: {
      enabled: false,
      clientId: '',
      clientSecret: ''
    },
    twitter: {
      enabled: false,
      bearerToken: ''
    }
  });

  const categories = [
    { key: 'all', label: 'All Ideas', icon: Lightbulb },
    { key: 'app-ideas', label: 'App Ideas', icon: Rocket },
    { key: 'saas-ideas', label: 'SaaS Ideas', icon: Globe },
    { key: 'developer-tools', label: 'Developer Tools', icon: Code },
    { key: 'productivity', label: 'Productivity', icon: Zap },
    { key: 'no-code', label: 'No-Code', icon: BookOpen },
    { key: 'mobile-apps', label: 'Mobile Apps', icon: Star },
    { key: 'accessibility', label: 'Accessibility', icon: Users }
  ];

  const complexityColors = {
    'Low': 'bg-green-100 text-green-700',
    'Medium': 'bg-yellow-100 text-yellow-700',
    'High': 'bg-red-100 text-red-700'
  };

  const marketPotentialColors = {
    'Low': 'bg-gray-100 text-gray-700',
    'Medium': 'bg-blue-100 text-blue-700',
    'High': 'bg-purple-100 text-purple-700'
  };

  useEffect(() => {
    // Load saved API configuration
    const savedConfig = localStorage.getItem('ideaScraperConfig');
    if (savedConfig) {
      try {
        setApiConfig(JSON.parse(savedConfig));
      } catch (error) {
        console.error('Error loading saved config:', error);
      }
    }
  }, []);

  // Real Reddit API scraping function
  const scrapeRedditIdeas = async () => {
    if (!apiConfig.reddit.enabled || !apiConfig.reddit.clientId) {
      throw new Error('Reddit API not configured');
    }

    setScrapingStatus(prev => ({ ...prev, reddit: 'scraping' }));

    try {
      const response = await fetch('/api/scrape-reddit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: apiConfig.reddit.clientId,
          clientSecret: apiConfig.reddit.clientSecret
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Reddit API failed: ${response.status}`);
      }

      const data = await response.json();
      setScrapingStatus(prev => ({ ...prev, reddit: 'success' }));
      return data.ideas || [];
    } catch (error) {
      setScrapingStatus(prev => ({ ...prev, reddit: 'error' }));
      throw error;
    }
  };

  // Real Twitter API scraping function  
  const scrapeTwitterIdeas = async () => {
    if (!apiConfig.twitter.enabled || !apiConfig.twitter.bearerToken) {
      throw new Error('Twitter API not configured');
    }

    setScrapingStatus(prev => ({ ...prev, twitter: 'scraping' }));

    try {
      const response = await fetch('/api/scrape-twitter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bearerToken: apiConfig.twitter.bearerToken
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Twitter API failed: ${response.status}`);
      }

      const data = await response.json();
      setScrapingStatus(prev => ({ ...prev, twitter: 'success' }));
      return data.ideas || [];
    } catch (error) {
      setScrapingStatus(prev => ({ ...prev, twitter: 'error' }));
      throw error;
    }
  };

  // Main scraping function
  const scrapeIdeas = async () => {
    setLoading(true);
    setError(null);
    setScrapingStatus({ reddit: 'idle', twitter: 'idle' });

    try {
      const allIdeas = [];

      // Scrape Reddit if configured
      if (apiConfig.reddit.enabled) {
        try {
          const redditIdeas = await scrapeRedditIdeas();
          allIdeas.push(...redditIdeas);
        } catch (error) {
          console.error('Reddit scraping failed:', error);
          setError(`Reddit: ${error.message}`);
        }
      }

      // Scrape Twitter if configured  
      if (apiConfig.twitter.enabled) {
        try {
          const twitterIdeas = await scrapeTwitterIdeas();
          allIdeas.push(...twitterIdeas);
        } catch (error) {
          console.error('Twitter scraping failed:', error);
          setError(prev => prev ? `${prev} | Twitter: ${error.message}` : `Twitter: ${error.message}`);
        }
      }

      // Remove duplicates and sort by engagement
      const uniqueIdeas = allIdeas.filter((idea, index, self) => 
        index === self.findIndex(i => i.title === idea.title)
      );

      setIdeas(uniqueIdeas);
      setLastUpdated(new Date());

      if (uniqueIdeas.length === 0 && !error) {
        setError('No ideas found. Check your API configuration and try again.');
      }

    } catch (error) {
      setError(`Scraping failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveApiConfig = () => {
    localStorage.setItem('ideaScraperConfig', JSON.stringify(apiConfig));
    setShowSettings(false);
  };

  const getFilteredAndSortedIdeas = () => {
    let filtered = ideas;

    if (activeFilter !== 'all') {
      filtered = filtered.filter(idea => idea.platform === activeFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(idea => idea.category === categoryFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(idea =>
        idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (idea.tags && idea.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }

    switch (sortBy) {
      case 'trending':
        filtered.sort((a, b) => (b.engagement || 0) - (a.engagement || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        break;
      case 'popular':
        filtered.sort((a, b) => {
          const aScore = (a.upvotes || 0) + (a.likes || 0);
          const bScore = (b.upvotes || 0) + (b.likes || 0);
          return bScore - aScore;
        });
        break;
      default:
        break;
    }

    return filtered;
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = now - then;
    
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scraping': return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const IdeaCard = ({ idea }) => {
    const isReddit = idea.platform === 'reddit';
    
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold ${
                isReddit ? 'bg-orange-500' : 'bg-blue-500'
              }`}>
                {isReddit ? '🤖' : '🐦'}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900 capitalize">{idea.platform}</span>
                  <span className="text-sm text-gray-500">{idea.source}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{formatTimeAgo(idea.timestamp)}</span>
                  <span>by {idea.author}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {idea.complexity && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${complexityColors[idea.complexity]}`}>
                  {idea.complexity}
                </span>
              )}
              {idea.marketPotential && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${marketPotentialColors[idea.marketPotential]}`}>
                  {idea.marketPotential} Market
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
            {idea.title}
          </h3>
          
          <p className="text-gray-700 leading-relaxed mb-4 line-clamp-3">
            {idea.description}
          </p>

          {idea.tags && idea.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {idea.tags.map((tag, index) => (
                <span key={index} className="bg-blue-50 text-blue-600 text-xs font-medium px-2 py-1 rounded-full flex items-center space-x-1">
                  <Tag className="w-3 h-3" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-6">
              {isReddit ? (
                <>
                  <div className="flex items-center space-x-2 text-orange-600">
                    <ArrowUp className="w-4 h-4" />
                    <span className="text-sm font-medium">{idea.upvotes || 0}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{idea.comments || 0}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-2 text-red-600">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm font-medium">{idea.likes || 0}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-green-600">
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm font-medium">{idea.retweets || 0}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{idea.replies || 0}</span>
                  </div>
                </>
              )}
              
              <div className="flex items-center space-x-2 text-gray-500">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">{idea.engagement || 0}</span>
              </div>
            </div>

            <a 
              href={idea.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="text-sm font-medium">View</span>
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Real-Time Idea Scraper</h1>
              <p className="text-gray-600">
                Live scraping of developer and app ideas from Reddit & Twitter
                {lastUpdated && (
                  <span className="ml-2 text-sm">
                    • Last updated {formatTimeAgo(lastUpdated)}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Scraping Status */}
              <div className="flex items-center space-x-2">
                {getStatusIcon(scrapingStatus.reddit)}
                <span className="text-xs text-gray-500">Reddit</span>
                {getStatusIcon(scrapingStatus.twitter)}
                <span className="text-xs text-gray-500">Twitter</span>
              </div>

              <button
                onClick={() => setShowSettings(true)}
                className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <button
                onClick={scrapeIdeas}
                disabled={loading || (!apiConfig.reddit.enabled && !apiConfig.twitter.enabled)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Scrape Now</span>
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search ideas, tags, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'All', icon: TrendingUp },
                { key: 'reddit', label: 'Reddit', icon: MessageCircle },
                { key: 'twitter', label: 'Twitter', icon: Share2 }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === key
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="trending">Trending</option>
              <option value="newest">Newest</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {categories.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setCategoryFilter(key)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  categoryFilter === key
                    ? 'bg-purple-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Configuration Warning */}
        {!apiConfig.reddit.enabled && !apiConfig.twitter.enabled && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">API Configuration Required</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Configure your Reddit and/or Twitter API credentials in settings to start scraping real ideas.
                </p>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="ml-auto px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
              >
                Configure
              </button>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Ideas</p>
                <p className="text-xl font-bold text-gray-900">
                  {getFilteredAndSortedIdeas().length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Reddit Ideas</p>
                <p className="text-xl font-bold text-gray-900">
                  {ideas.filter(idea => idea.platform === 'reddit').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Share2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Twitter Ideas</p>
                <p className="text-xl font-bold text-gray-900">
                  {ideas.filter(idea => idea.platform === 'twitter').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Engagement</p>
                <p className="text-xl font-bold text-gray-900">
                  {ideas.length > 0 ? Math.round(ideas.reduce((sum, idea) => sum + (idea.engagement || 0), 0) / ideas.length) : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ideas Feed */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Scraping ideas from Reddit and Twitter...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {getFilteredAndSortedIdeas().map(idea => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
        )}

        {!loading && getFilteredAndSortedIdeas().length === 0 && !error && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No ideas found</h3>
            <p className="text-gray-600">
              {searchTerm || categoryFilter !== 'all' 
                ? 'Try adjusting your search terms or filters' 
                : 'Configure your API settings and click "Scrape Now" to discover ideas'
              }
            </p>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">API Configuration</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Reddit Configuration */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <span className="text-xl">🤖</span>
                    <span>Reddit Configuration</span>
                  </h4>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={apiConfig.reddit.enabled}
                      onChange={(e) => setApiConfig(prev => ({
                        ...prev,
                        reddit: { ...prev.reddit, enabled: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">Enable</span>
                  </label>
                </div>
                
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="Bearer Token"
                    value={apiConfig.twitter.bearerToken}
                    onChange={(e) => setApiConfig(prev => ({
                      ...prev,
                      twitter: { ...prev.twitter, bearerToken: e.target.value }
                    }))}
                    disabled={!apiConfig.twitter.enabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                
                <div className="mt-3 text-sm text-gray-600">
                  <p><strong>Sources monitored:</strong></p>
                  <p>@IndieHackers, @ProductHunt, @StartupGrind, @ycombinator, @buildinpublic</p>
                  <p>Hashtags: #buildinpublic, #indiehacker, #startup, #appidea, #saas, #nocode, #webdev, #devtools</p>
                </div>
              </div>

              {/* Setup Instructions */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Setup Instructions</h4>
                <div className="space-y-3 text-sm text-gray-600">
                  <div>
                    <p className="font-medium">Reddit API Setup:</p>
                    <ol className="list-decimal list-inside ml-4 space-y-1">
                      <li>Go to <a href="https://www.reddit.com/prefs/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">reddit.com/prefs/apps</a></li>
                      <li>Click "Create App" and choose "script" type</li>
                      <li>Copy the Client ID and Secret</li>
                    </ol>
                  </div>
                  
                  <div>
                    <p className="font-medium">Twitter API Setup:</p>
                    <ol className="list-decimal list-inside ml-4 space-y-1">
                      <li>Apply for Twitter Developer account at <a href="https://developer.twitter.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">developer.twitter.com</a></li>
                      <li>Create a new project/app</li>
                      <li>Generate Bearer Token</li>
                      <li>Enable Twitter API v2 access</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveApiConfig}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
