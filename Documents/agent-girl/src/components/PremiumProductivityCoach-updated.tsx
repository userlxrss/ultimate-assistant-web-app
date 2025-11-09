import React, { useState } from 'react';

interface ProductivityArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  readTime: string;
  category: 'focus' | 'time-management' | 'habits' | 'wellness' | 'goals' | 'energy' | 'mindfulness' | 'tasks' | 'procrastination';
  icon: string;
  personalizations: string[];
  relevanceScore: number;
  content?: string;
}

interface UserProfile {
  pendingTasks: number;
  completedTasks: number;
  avgMood: number;
  avgEnergy: number;
  journalStreak: number;
  upcomingMeetings: number;
  hasHighPriorityTasks: boolean;
  hasOverdueTasks: boolean;
  recentEnergyTrend: 'low' | 'medium' | 'high';
  recentMoodTrend: 'low' | 'medium' | 'high';
}

// Premium Productivity Coach Component with Enhanced Dark Mode
const PremiumProductivityCoachComponent: React.FC<{
  articles: ProductivityArticle[];
  userProfile: UserProfile;
  onRefresh?: () => void;
  onArticleClick?: (article: ProductivityArticle) => void;
}> = ({ articles, userProfile, onRefresh, onArticleClick }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showAllArticles, setShowAllArticles] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    setTimeout(() => {
      onRefresh?.();
      setIsLoading(false);
    }, 1500);
  };

  const visibleArticles = showAllArticles
    ? articles
    : articles.slice(0, 4);

  const handleReadArticle = (article: ProductivityArticle) => {
    if (onArticleClick) {
      onArticleClick(article);
    } else if (article.sourceUrl && article.sourceUrl !== '#') {
      window.open(article.sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (articles.length === 0 && !isLoading) {
    return (
      <div className="relative overflow-hidden bg-white dark:bg-slate-800/60 dark:backdrop-blur-2xl dark:border dark:border-white/10 p-8 rounded-3xl shadow-md">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>

        <div className="relative">
          <div className="w-16 h-16 premium-glass-bg rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
            <span className="text-3xl">🧠</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Your Personal Productivity Coach</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Generating personalized insights based on your data...
          </p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500/30 border-t-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-800/60 dark:backdrop-blur-2xl dark:border dark:border-white/10 p-8 rounded-3xl shadow-md">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>

      <div className="relative">
        {/* Premium Header */}
        <div className="px-0 py-0 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="relative">
                    🧠
                    <span className="absolute inset-0 blur-xl bg-blue-500/30 rounded-full"></span>
                  </span>
                  AI Insights
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 dark:bg-white/5 border border-blue-500/20 text-emerald-600 dark:text-emerald-400">
                  Updated today
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your personalized productivity coach
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 bg-white/10 dark:bg-white/5 rounded-lg transition-all duration-200 border border-gray-200/10 dark:border-gray-700/30"
              title="Refresh articles"
              disabled={isLoading}
            >
              <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Premium Content */}
        <div className="space-y-5 relative z-10">
          {isLoading ? (
            // Premium loading skeleton cards
            <div className="space-y-5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="bg-white/10 dark:bg-white/5 rounded-xl p-6 border border-gray-200/10 dark:border-gray-700/30">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-white/10 dark:bg-white/5 rounded-xl flex-shrink-0 border border-gray-200/10"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-5 bg-white/10 dark:bg-white/5 rounded w-3/4"></div>
                        <div className="h-4 bg-white/10 dark:bg-white/5 rounded w-full"></div>
                        <div className="h-4 bg-white/10 dark:bg-white/5 rounded w-5/6"></div>
                        <div className="h-4 bg-white/10 dark:bg-white/5 rounded w-2/3"></div>
                        <div className="flex items-center justify-between pt-3">
                          <div className="flex items-center gap-4">
                            <div className="h-3 bg-white/10 dark:bg-white/5 rounded w-20"></div>
                            <div className="h-3 bg-white/10 dark:bg-white/5 rounded w-16"></div>
                          </div>
                          <div className="h-3 bg-white/10 dark:bg-white/5 rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {visibleArticles.map((article, index) => (
                <div
                  key={article.id}
                  className="group/article rounded-xl p-6 hover:bg-white/5 dark:hover:bg-white/10 cursor-pointer relative overflow-hidden border border-gray-200/10 dark:border-gray-700/30 transition-all duration-300"
                  style={{
                    animation: `fadeInUp 0.6s ease ${index * 0.08}s both`
                  }}
                  onClick={() => handleReadArticle(article)}
                >
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-transparent opacity-0 group-hover/article:opacity-100 transition-opacity duration-500 rounded-xl"></div>

                  {/* Premium Article Content */}
                  <div className="flex items-start gap-5 relative z-10">
                    <div className="w-10 h-10 bg-white/10 dark:bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-200/10 dark:border-gray-700/30 transition-transform duration-300">
                      <span className="text-xl">{article.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 leading-tight group-hover/article:text-blue-600 dark:group-hover/article:text-blue-400 transition-all duration-300">
                        {article.title}
                      </h4>

                      {/* Article Summary */}
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4 line-clamp-3">
                        {article.summary}
                      </p>

                      {/* Premium Personalization Box */}
                      {article.personalizations.length > 0 && (
                        <div className="bg-white/10 dark:bg-white/5 rounded-lg p-4 mb-4 border border-blue-500/10 dark:border-blue-500/20">
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <span className="relative">
                              💡
                              <span className="absolute inset-0 blur-sm bg-yellow-500/30 rounded-full"></span>
                            </span>
                            Why this matters for you:
                          </p>
                          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                            {article.personalizations.slice(0, 2).map((personalization, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-emerald-500 dark:text-emerald-400 mt-1.5 text-xs">•</span>
                                <span>{personalization}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Premium Footer */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-5 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            {article.source}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {article.readTime}
                          </span>
                        </div>
                        <button className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-150 group-hover/article:text-blue-500 dark:group-hover/article:text-blue-300">
                          Read more
                          <svg className="w-4 h-4 transition-transform duration-200 group-hover/article:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Premium Load More Button */}
              {articles.length > 4 && !showAllArticles && (
                <button
                  onClick={() => setShowAllArticles(true)}
                  className="w-full py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white/10 dark:bg-white/5 rounded-lg transition-all duration-200 border border-gray-200/10 dark:border-gray-700/30"
                >
                  Load {articles.length - 4} more articles
                  <svg className="w-4 h-4 inline-block ml-2 transition-transform duration-200 group-hover:translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}

              {showAllArticles && (
                <button
                  onClick={() => setShowAllArticles(false)}
                  className="w-full py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white/10 dark:bg-white/5 rounded-lg transition-all duration-200 border border-gray-200/10 dark:border-gray-700/30"
                >
                  Show fewer articles
                  <svg className="w-4 h-4 inline-block ml-2 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default PremiumProductivityCoachComponent;