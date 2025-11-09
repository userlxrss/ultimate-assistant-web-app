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
    case 'pattern': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    case 'recommendation': return 'text-green-400 bg-green-500/20 border-green-500/30';
    case 'motivation': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
    default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
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
      <div className="premium-card max-w-lg w-full p-6 animate-slide-up">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${getInsightColor(insight.type)}`}>
              {getInsightIcon(insight.type)}
            </div>
            <div>
              <h3 className="text-lg font-semibold premium-text-primary">
                {insight.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs premium-text-muted capitalize">
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
            className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-300"
          >
            <X className="w-5 h-5 premium-text-tertiary" />
          </button>
        </div>

        <p className="premium-text-secondary leading-relaxed mb-6">
          {insight.content}
        </p>

        <div className="flex gap-3">
          <button className="premium-button flex-1 text-center py-2 text-sm font-medium">
            Apply Recommendation
          </button>
          <button className="premium-button flex-1 text-center py-2 text-sm font-medium">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
};

export const AIInsightsEnhanced: React.FC<AIInsightsProps> = ({ insights }) => {
  const [expandedInsight, setExpandedInsight] = useState<AIInsight | null>(null);

  const highPriorityInsights = insights.filter(insight => insight.priority === 'high');
  const otherInsights = insights.filter(insight => insight.priority !== 'high');

  return (
    <>
      <div className="space-y-4">
        {highPriorityInsights.length > 0 && (
          <div className="premium-card border-l-4 border-red-500/50">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-semibold premium-text-primary">Priority Insights</h3>
              <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                {highPriorityInsights.length} urgent
              </span>
            </div>

            <div className="space-y-3">
              {highPriorityInsights.map((insight) => (
                <div
                  key={`${insight.type}-${insight.title}`}
                  className="flex items-start gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20 cursor-pointer hover:bg-red-500/15 hover:scale-[1.02] transition-all duration-300"
                  onClick={() => setExpandedInsight(insight)}
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className={`p-2 rounded-lg ${getInsightColor(insight.type)}`}>
                      {getInsightIcon(insight.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium premium-text-primary mb-1">
                      {insight.title}
                    </h4>
                    <p className="text-sm premium-text-secondary line-clamp-2">
                      {insight.content}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 premium-text-tertiary mt-1 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="premium-card">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold premium-text-primary">AI-Powered Insights</h3>
          </div>

          <div className="space-y-3">
            {otherInsights.map((insight) => (
              <div
                key={`${insight.type}-${insight.title}`}
                className="activity-item border-l-4 cursor-pointer hover:scale-[1.02] transition-all duration-300"
                style={{
                  borderLeftColor: insight.type === 'pattern' ? '#60A5FA' :
                                   insight.type === 'recommendation' ? '#4ADE80' :
                                   '#C084FC'
                }}
                onClick={() => setExpandedInsight(insight)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getInsightColor(insight.type)}`}>
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium premium-text-primary text-sm">
                        {insight.title}
                      </h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(insight.priority)}`}>
                        {insight.priority}
                      </span>
                    </div>
                    <p className="text-xs premium-text-secondary line-clamp-2">
                      {insight.content}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 premium-text-tertiary mt-1 flex-shrink-0" />
                </div>
              </div>
            ))}

            {insights.length === 0 && (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 premium-text-tertiary mx-auto mb-3" />
                <p className="premium-text-secondary">AI insights are being generated</p>
                <p className="text-sm premium-text-muted mt-1">
                  Check back soon for personalized recommendations
                </p>
              </div>
            )}
          </div>

          {insights.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <button className="w-full text-center text-sm text-blue-400 hover:text-blue-300 transition-all duration-300">
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