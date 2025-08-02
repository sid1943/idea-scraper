// api/scrape-reddit.js - Vercel Serverless Function for Reddit Scraping

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
    const { clientId, clientSecret } = req.body;
    
    if (!clientId || !clientSecret) {
      return res.status(400).json({ error: 'Reddit credentials required' });
    }

    console.log('Starting Reddit scraping...');

    // Get Reddit access token
    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'IdeaScraperApp/1.0 by yourusername'
      },
      body: 'grant_type=client_credentials'
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Reddit token error:', errorText);
      return res.status(401).json({ error: 'Failed to authenticate with Reddit API' });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log('Reddit token obtained successfully');

    // Subreddits to scrape for ideas
    const subreddits = [
      'SomebodyMakeThis',
      'AppIdeas', 
      'Entrepreneur',
      'startups',
      'IndieDev',
      'webdev',
      'programming',
      'SaaS',
      'nocode'
    ];

    const ideas = [];

    // Scrape each subreddit
    for (const subreddit of subreddits) {
      try {
        console.log(`Scraping r/${subreddit}...`);
        
        const response = await fetch(`https://oauth.reddit.com/r/${subreddit}/hot?limit=15`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'IdeaScraperApp/1.0 by yourusername'
          }
        });

        if (!response.ok) {
          console.error(`Failed to fetch r/${subreddit}:`, response.status);
          continue;
        }

        const data = await response.json();
        
        if (data.data && data.data.children) {
          data.data.children.forEach(post => {
            const postData = post.data;
            
            // Filter for idea-related posts
            if (isIdeaPost(postData.title, postData.selftext)) {
              ideas.push({
                id: `reddit_${postData.id}`,
                platform: 'reddit',
                source: `r/${subreddit}`,
                title: postData.title,
                description: postData.selftext || postData.title,
                author: `u/${postData.author}`,
                timestamp: new Date(postData.created_utc * 1000).toISOString(),
                upvotes: postData.ups || 0,
                comments: postData.num_comments || 0,
                category: categorizeIdea(postData.title, postData.selftext),
                tags: extractTags(postData.title, postData.selftext),
                complexity: assessComplexity(postData.title, postData.selftext),
                marketPotential: assessMarketPotential(postData.title, postData.selftext),
                url: `https://reddit.com${postData.permalink}`,
                engagement: (postData.ups || 0) + (postData.num_comments || 0),
                awards: postData.all_awardings?.length || 0
              });
            }
          });
        }
      } catch (error) {
        console.error(`Error scraping r/${subreddit}:`, error.message);
      }
    }

    console.log(`Reddit scraping complete. Found ${ideas.length} ideas.`);
    res.status(200).json({ ideas, count: ideas.length });

  } catch (error) {
    console.error('Reddit scraping error:', error);
    res.status(500).json({ error: `Reddit scraping failed: ${error.message}` });
  }
}

// Helper function to detect idea posts
function isIdeaPost(title, content = '') {
  const ideaKeywords = [
    'app idea', 'startup idea', 'build', 'create', 'develop', 'tool for',
    'somebody make', 'looking for', 'need an app', 'feature request',
    'would pay for', 'market for', 'solution for', 'problem with',
    'api for', 'saas for', 'platform for', 'service that',
    'app that', 'website that', 'bot that', 'extension for',
    'i wish there was', 'why doesn\'t exist', 'business idea'
  ];

  const text = (title + ' ' + content).toLowerCase();
  return ideaKeywords.some(keyword => text.includes(keyword)) || 
         title.toLowerCase().includes('idea') ||
         title.toLowerCase().includes('need') ||
         title.toLowerCase().includes('make');
}

// Helper function to categorize ideas
function categorizeIdea(title, content = '') {
  const text = (title + ' ' + content).toLowerCase();
  
  if (text.includes('saas') || text.includes('subscription') || text.includes('platform')) return 'saas-ideas';
  if (text.includes('mobile') || text.includes('ios') || text.includes('android')) return 'mobile-apps';
  if (text.includes('api') || text.includes('dev') || text.includes('code') || text.includes('github')) return 'developer-tools';
  if (text.includes('productivity') || text.includes('workflow') || text.includes('automation')) return 'productivity';
  if (text.includes('no-code') || text.includes('nocode') || text.includes('drag and drop')) return 'no-code';
  if (text.includes('accessibility') || text.includes('disabled') || text.includes('inclusive')) return 'accessibility';
  
  return 'app-ideas';
}

// Helper function to extract technology tags
function extractTags(title, content = '') {
  const text = (title + ' ' + content).toLowerCase();
  const techTags = [];
  
  const techKeywords = {
    'React': ['react', 'jsx', 'next.js', 'nextjs'],
    'AI': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'gpt', 'openai', 'chatgpt'],
    'Mobile': ['mobile', 'ios', 'android', 'react native', 'flutter'],
    'API': ['api', 'rest', 'graphql', 'webhook'],
    'Blockchain': ['blockchain', 'crypto', 'web3', 'nft', 'ethereum'],
    'SaaS': ['saas', 'subscription', 'b2b', 'enterprise'],
    'No-Code': ['no-code', 'nocode', 'low-code', 'zapier', 'airtable'],
    'DevTools': ['devtools', 'developer', 'github', 'vscode', 'debugging'],
    'E-commerce': ['ecommerce', 'e-commerce', 'shopify', 'store', 'marketplace'],
    'Social': ['social', 'community', 'messaging', 'chat', 'network']
  };

  Object.entries(techKeywords).forEach(([tag, keywords]) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      techTags.push(tag);
    }
  });

  return techTags.slice(0, 4);
}

// Helper function to assess complexity
function assessComplexity(title, content = '') {
  const text = (title + ' ' + content).toLowerCase();
  
  const highComplexityTerms = ['ai', 'machine learning', 'blockchain', 'distributed', 'real-time', 'scalable', 'enterprise', 'infrastructure'];
  const mediumComplexityTerms = ['api', 'database', 'authentication', 'payment', 'integration', 'mobile', 'backend'];
  
  if (highComplexityTerms.some(term => text.includes(term))) return 'High';
  if (mediumComplexityTerms.some(term => text.includes(term))) return 'Medium';
  return 'Low';
}

// Helper function to assess market potential
function assessMarketPotential(title, content = '') {
  const text = (title + ' ' + content).toLowerCase();
  
  const highPotentialTerms = ['billion', 'market', 'enterprise', 'b2b', 'saas', 'subscription', 'platform', 'scale', 'unicorn'];
  const mediumPotentialTerms = ['startup', 'business', 'monetize', 'revenue', 'customers', 'users', 'growth'];
  
  if (highPotentialTerms.some(term => text.includes(term))) return 'High';
  if (mediumPotentialTerms.some(term => text.includes(term))) return 'Medium';
  return 'Low';
}