# 🚀 Idea Scraper

A real-time web application that discovers trending developer and app ideas from Reddit and Twitter.

## ✨ Features

- 🔍 **Real-time scraping** from Reddit and Twitter APIs
- 🏷️ **Smart categorization** of ideas (SaaS, Mobile Apps, Developer Tools, etc.)
- 📊 **Engagement metrics** and trending analysis  
- 🔧 **Complexity assessment** (Low/Medium/High)
- 💰 **Market potential** evaluation
- 📱 **Mobile-responsive** design with PWA support
- ⚡ **Fast search** and filtering capabilities
- 🎯 **Real-time status** indicators

## 🎯 Live Demo

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/idea-scraper)

## 🛠️ Quick Setup

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/idea-scraper.git
cd idea-scraper
npm install
```

### 2. Get API Credentials

#### Reddit API:
1. Go to [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
2. Click "Create App" → Choose "script" type
3. Copy Client ID and Secret

#### Twitter API:
1. Apply at [developer.twitter.com](https://developer.twitter.com)
2. Create new project/app
3. Generate Bearer Token

### 3. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### 4. Configure API Keys
- Open your deployed app
- Click Settings ⚙️
- Enter your Reddit and Twitter credentials
- Click "Save Configuration"

## 📡 Data Sources

### Reddit Subreddits Monitored:
- r/SomebodyMakeThis
- r/AppIdeas  
- r/Entrepreneur
- r/startups
- r/IndieDev
- r/webdev
- r/programming
- r/SaaS
- r/nocode

### Twitter Sources:
- **Hashtags**: #buildinpublic, #indiehacker, #startup, #appidea, #saas, #nocode
- **Accounts**: @IndieHackers, @ProductHunt, @ycombinator, @StartupGrind

## 🔧 Tech Stack

- **Frontend**: React 18, Tailwind CSS, Lucide Icons
- **Backend**: Vercel Serverless Functions
- **APIs**: Reddit API v1, Twitter API v2
- **Deployment**: Vercel
- **Storage**: LocalStorage for settings

## 📊 Features Overview

### Smart Analysis
- **Idea Detection**: AI-powered keyword matching
- **Auto-Categorization**: SaaS, Mobile, DevTools, etc.
- **Complexity Scoring**: Technical difficulty assessment
- **Market Potential**: Business opportunity evaluation

### Real-Time Features
- **Live Scraping**: Fresh ideas from both platforms
- **Status Indicators**: Visual scraping progress
- **Error Handling**: Graceful API failure management
- **Rate Limiting**: Respects platform API limits

### User Experience
- **Search & Filter**: Find specific types of ideas
- **Sort Options**: Trending, newest, most popular
- **Mobile Ready**: Responsive design + PWA
- **Dark Mode**: Coming soon!

## 🚨 Important Notes

### API Limits
- **Reddit**: 60 requests/minute (free)
- **Twitter**: Varies by plan (Basic: $100/month for full access)

### Rate Limiting
The app automatically handles rate limits and includes:
- Request throttling
- Error recovery
- Status indicators

### Privacy
- API keys stored locally in browser
- No data sent to external servers
- Respects platform terms of service

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - feel free to use for personal and commercial projects!

## 🆘 Support

Having issues? 
- Check the [Issues](https://github.com/yourusername/idea-scraper/issues) page
- Review API setup instructions
- Verify your credentials in Settings

## 🎯 Roadmap

- [ ] Hacker News integration
- [ ] Product Hunt API
- [ ] Email notifications
- [ ] Data export (CSV/JSON)
- [ ] Idea bookmarking
- [ ] Trending alerts
- [ ] Dark mode
- [ ] Advanced analytics

---

**Built with ❤️ for the indie hacker community**