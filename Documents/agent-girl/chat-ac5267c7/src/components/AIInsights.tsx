import React, { useState } from 'react';
import { AIInsight } from '../types';
import { Brain, TrendingUp, Lightbulb, ChevronRight, X } from 'lucide-react';

interface AIInsightsProps {
  insights: AIInsight[];
}

const getInsightIcon = (type: AIInsight['type']) => {
  switch (type) {
    case 'pattern': return <TrendingUp className="w-5 h-5" />;
    case 'recommendation': return <Lightbulb className="w-5 h-5" />;
    case 'motivation': return <Brain className="w-5 h-5" />;
    default: return <Brain className="w-5 h-5" />;
  }
};

const getInsightColor = (type: AIInsight['type']) => {
  switch (type) {
    case 'pattern': return 'text-dusty-blue-600 dark:text-dusty-blue-400 bg-dusty-blue-500/20 border-dusty-blue-500/30';
    case 'recommendation': return 'text-sage-600 dark:text-sage-400 bg-sage-500/20 border-sage-500/30';
    case 'motivation': return 'text-soft-lavender-600 dark:text-soft-lavender-400 bg-soft-lavender-500/20 border-soft-lavender-500/30';
    default: return 'text-gray-600 dark:text-gray-400 bg-gray-500/20 border-gray-500/30';
  }
};

const getPriorityColor = (priority: AIInsight['priority']) => {
  switch (priority) {
    case 'high': return 'bg-red-500 text-white';
    case 'medium': return 'bg-yellow-500 text-white';
    case 'low': return 'bg-green-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

const ExpandedInsight: React.FC<{
  insight: AIInsight;
  onClose: () => void;
}> = ({ insight, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card max-w-lg w-full p-6 animate-slide-up">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${getInsightColor(insight.type)}`}>
              {getInsightIcon(insight.type)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {insight.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {insight.type}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(insight.priority)}`}>
                  {insight.priority} priority
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
          {insight.content}
        </p>

        <div className="flex gap-3">
          <button className="glass-button flex-1 text-center py-2 text-sm font-medium text-sage-600 dark:text-sage-400">
            Apply Recommendation
          </button>
          <button className="glass-button flex-1 text-center py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
};

export const AIInsights: React.FC<AIInsightsProps> = ({ insights }) => {
  const [expandedInsight, setExpandedInsight] = useState<AIInsight | null>(null);

  const highPriorityInsights = insights.filter(insight => insight.priority === 'high');
  const otherInsights = insights.filter(insight => insight.priority !== 'high');

  return (
    <>
      <div className="space-y-4">
        {highPriorityInsights.length > 0 && (
          <div className="glass-card border-l-4 border-red-500/50">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Priority Insights</h3>
              <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                {highPriorityInsights.length} urgent
              </span>
            </div>

            <div className="space-y-3">
              {highPriorityInsights.map((insight) => (
                <div
                  key={`${insight.type}-${insight.title}`}
                  className="flex items-start gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20 cursor-pointer hover:bg-red-500/15 transition-colors duration-200"
                  onClick={() => setExpandedInsight(insight)}
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className={`p-2 rounded-lg ${getInsightColor(insight.type)}`}>
                      {getInsightIcon(insight.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {insight.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                      {insight.content}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="glass-card">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-sage-600 dark:text-sage-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI-Powered Insights</h3>
          </div>

          <div className="space-y-3">
            {otherInsights.map((insight) => (
              <div
                key={`${insight.type}-${insight.title}`}
                className="activity-item border-l-4 cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                style={{
                  borderLeftColor: insight.type === 'pattern' ? 'rgb(104, 134, 180)' :
                                   insight.type === 'recommendation' ? 'rgb(105, 180, 145)' :
                                   'rgb(185, 164, 225)'
                }}
                onClick={() => setExpandedInsight(insight)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getInsightColor(insight.type)}`}>
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {insight.title}
                      </h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(insight.priority)}`}>
                        {insight.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                      {insight.content}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                </div>
              </div>
            ))}

            {insights.length === 0 && (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">AI insights are being generated</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Check back soon for personalized recommendations
                </p>
              </div>
            )}
          </div>

          {insights.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10 dark:border-white/5">
              <button className="w-full text-center text-sm text-sage-600 dark:text-sage-400 hover:text-sage-500 dark:hover:text-sage-300 transition-colors duration-200">
                View all insights ({insights.length} total) →
              </button>
            </div>
          )}
        </div>
      </div>

      {expandedInsight && (
        <ExpandedInsight
          insight={expandedInsight}
          onClose={() => setExpandedInsight(null)}
        />
      )}
    </>
  );
};