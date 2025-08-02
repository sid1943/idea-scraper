// api/scrape-twitter.js - Updated with Environment Variables Support

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Try to get credentials from request body (frontend settings)
    let { bearerToken } = req.body || {};
    
    // If not provided in request, try environment variables
    if (!bearerToken) {
      bearerToken = process.env.TWITTER_BEARER_TOKEN;
    }
    
    if (!bearerToken) {
      return res.status(400).json({ 
        error: 'Twitter Bearer Token required. Either configure in app settings or set TWITTER_BEARER_TOKEN environment variable.' 
      });
    }

    console.log('Starting Twitter scraping...');

    const ideas = [];

    // Hashtags to monitor for ideas
    const hashtags = [
      'buildinpublic',
      'indiehacker', 
      'startup',
      'appidea',
      'saas',
      'nocode',
      'webdev',
      'devtools'
    ];

    // Search for hashtag-based ideas
    for (const hashtag of hashtags) {
      try {
        console.log(`Scraping #${hashtag}...`);
        
        const response = await fetch(`https://api.twitter.com/2/tweets/search/recent?query=%23${hashtag} -is:retweet&tweet.fields=created_at,public_metrics,context_annotations,author_id&expansions=author_id&user.fields=username,name&max_results=50`, {
          headers: {
            'Authorization': `Bearer ${bearerToken}`
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Twitter API error for #${hashtag}:`, response.status, errorText);
          continue;
        }

        const data = await response.json();
        
        if (data.data) {
          data.data.forEach(tweet => {
            // Filter for idea-related tweets
            if (isIdeaPost(tweet.text)) {
              const author = data.includes?.users?.find(user => user.id === tweet.author_id);
              
              ideas.push({
                id: `twitter_${tweet.id}`,
                platform: 'twitter',
                source: `#${hashtag}`,
                title: extractTweetTitle(tweet.text),
                description: tweet.text,
                author: `@${author?.username || 'unknown'}`,
                authorName: author?.name || 'Unknown User',
                timestamp: tweet.created_at,
                likes: tweet.public_metrics.like_count || 0,
                retweets: tweet.public_metrics.retweet_count || 0,
                replies: tweet.public_metrics.reply_count || 0,
                category: categorizeIdea(tweet.text),
                tags: extractTwitterTags(tweet.text),
                complexity: assessComplexity(tweet.text),
                marketPotential: assessMarketPotential(tweet.text),
                url: `https://twitter.com/${author?.username}/status/${tweet.id}`,
                engagement: (tweet.public_metrics.like_count || 0) + (tweet.public_metrics.retweet_count || 0) + (tweet.public_metrics.reply_count || 0),
                impressions: tweet.public_metrics.impression_count || 0
              });
            }
          });
        }
      } catch (error) {
        console.error(`Error scraping #${hashtag}:`, error.message);
      }
    }

    // Monitor specific accounts known for sharing ideas
    const targetAccounts = [
      'IndieHackers',
      'ProductHunt',
      'StartupGrind',
      'ycombinator',
      'buildinpublic'
    ];

    for (const username of targetAccounts) {
      try {
        console.log(`Scraping @${username}...`);
        
        // Get user ID first
        const userResponse = await fetch(`https://api.twitter.com/2/users/by/username/${username}`, {
          headers: {
            'Authorization': `Bearer ${bearerToken}`
          }
        });

        if (!userResponse.ok) {
          console.error(`Failed to get user ID for @${username}`);
          continue;
        }

        const userData = await userResponse.json();
        const userId = userData.data.id;

        // Get user's recent tweets
        const tweetsResponse = await fetch(`https://api.twitter.com/2/users/${userId}/tweets?tweet.fields=created_at,public_metrics&max_results=25&exclude=retweets,replies`, {
          headers: {
            'Authorization': `Bearer ${bearerToken}`
          }
        });

        if (!tweetsResponse.ok) {
          console.error(`Failed to get tweets for @${username}`);
          continue;
        }

        const tweetsData = await tweetsResponse.json();
        
        if (tweetsData.data) {
          tweetsData.data.forEach(tweet => {
            if (isIdeaPost(tweet.text)) {
              ideas.push({
                id: `twitter_${tweet.id}`,
                platform: 'twitter', 
                source: `@${username}`,
                title: extractTweetTitle(tweet.text),
                description: tweet.text,
                author: `@${username}`,
                authorName: userData.data.name,
                timestamp: tweet.created_at,
                likes: tweet.public_metrics.like_count || 0,
                retweets: tweet.public_metrics.retweet_count || 0,
                replies: tweet.public_metrics.reply_count || 0,
                category: categorizeIdea(tweet.text),
                tags: extractTwitterTags(tweet.text),
                complexity: assessComplexity(tweet.text),
                marketPotential: assessMarketPotential(tweet.text),
                url: `https://twitter.com/${username}/status/${tweet.id}`,
                engagement: (tweet.public_metrics.like_count || 0) + (tweet.public_metrics.retweet_count || 0) + (tweet.public_metrics.reply_count || 0)
              });
            }
          });
        }
      } catch (error) {
        console.error(`Error scraping @${username}:`, error.message);
      }
    }

    console.log(`Twitter scraping complete. Found ${ideas.length} ideas.`);
    res.status(200).json({ ideas, count: ideas.length });

  } catch (error) {
    console.error('Twitter scraping error:', error);
    res.status(500).json({ error: `Twitter scraping failed: ${error.message}` });
  }
}

// Helper function to detect idea posts
function isIdeaPost(text) {
  const ideaKeywords = [
    'app idea', 'startup idea', 'build', 'create', 'develop', 'tool for',
    'looking for', 'need an app', 'feature request', 'would pay for',
    'market for', 'solution for', 'problem with', 'api for', 'saas for',
    'platform for', 'service that', 'app that', 'website that',
    'bot that', 'extension for', 'i wish there was', 'why doesn\'t exist',
    'business idea', 'mvp', 'minimum viable product', 'prototype',
    'side project', 'weekend project', 'coding challenge'
  ];

  const lowerText = text.toLowerCase();
  return ideaKeywords.some(keyword => lowerText.includes(keyword)) ||
         lowerText.includes('idea') ||
         lowerText.includes('building') ||
         (lowerText.includes('need') && lowerText.includes('app')) ||
         lowerText.includes('should exist');
}

// Helper function to categorize ideas  
function categorizeIdea(text) {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('saas') || lowerText.includes('subscription') || lowerText.includes('b2b')) return 'saas-ideas';
  if (lowerText.includes('mobile') || lowerText.includes('ios') || lowerText.includes('android')) return 'mobile-apps';
  if (lowerText.includes('api') || lowerText.includes('dev') || lowerText.includes('code') || lowerText.includes('github')) return 'developer-tools';
  if (lowerText.includes('productivity') || lowerText.includes('workflow') || lowerText.includes('automation')) return 'productivity';
  if (lowerText.includes('no-code') || lowerText.includes('nocode') || lowerText.includes('low-code')) return 'no-code';
  if (lowerText.includes('accessibility') || lowerText.includes('disabled') || lowerText.includes('inclusive')) return 'accessibility';
  
  return 'app-ideas';
}

// Helper function to extract Twitter hashtags and mentions
function extractTwitterTags(text) {
  const hashtags = text.match(/#\w+/g) || [];
  const mentions = text.match(/@\w+/g) || [];
  const techTags = [];
  
  // Add relevant hashtags
  hashtags.forEach(tag => {
    const cleanTag = tag.replace('#', '');
    if (['react', 'nodejs', 'python', 'ai', 'ml', 'saas', 'nocode', 'webdev'].includes(cleanTag.toLowerCase())) {
      techTags.push(cleanTag);
    }
  });
  
  // Add some manual tech detection
  const lowerText = text.toLowerCase();
  if (lowerText.includes('react')) techTags.push('React');
  if (lowerText.includes('ai') || lowerText.includes('artificial intelligence')) techTags.push('AI');
  if (lowerText.includes('mobile')) techTags.push('Mobile');
  if (lowerText.includes('api')) techTags.push('API');
  
  return [...new Set(techTags)].slice(0, 4); // Remove duplicates and limit to 4
}

// Helper function to extract tweet title
function extractTweetTitle(text) {
  // Remove URLs
  const cleanText = text.replace(/https?:\/\/\S+/g, '').trim();
  
  // Get first sentence or first 80 characters
  const sentences = cleanText.split(/[.!?]/);
  const firstSentence = sentences[0].trim();
  
  if (firstSentence.length > 80) {
    return firstSentence.substring(0, 80) + '...';
  }
  
  return firstSentence || cleanText.substring(0, 80) + '...';
}

// Helper function to assess complexity
function assessComplexity(text) {
  const lowerText = text.toLowerCase();
  
  const highComplexityTerms = ['ai', 'machine learning', 'blockchain', 'distributed', 'real-time', 'scalable', 'enterprise'];
  const mediumComplexityTerms = ['api', 'database', 'authentication', 'payment', 'integration', 'mobile'];
  
  if (highComplexityTerms.some(term => lowerText.includes(term))) return 'High';
  if (mediumComplexityTerms.some(term => lowerText.includes(term))) return 'Medium';
  return 'Low';
}

// Helper function to assess market potential
function assessMarketPotential(text) {
  const lowerText = text.toLowerCase();
  
  const highPotentialTerms = ['billion', 'market', 'enterprise', 'b2b', 'saas', 'subscription', 'platform'];
  const mediumPotentialTerms = ['startup', 'business', 'monetize', 'revenue', 'customers'];
  
  if (highPotentialTerms.some(term => lowerText.includes(term))) return 'High';
  if (mediumPotentialTerms.some(term => lowerText.includes(term))) return 'Medium';
  return 'Low';
}
