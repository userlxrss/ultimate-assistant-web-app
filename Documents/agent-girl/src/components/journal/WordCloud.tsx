import React from 'react';
import { Hash } from 'lucide-react';

interface ExtendedJournalEntry {
  content: string;
  biggestWin?: string;
  learning?: string;
  tags?: string[];
}

interface WordCloudProps {
  entries: ExtendedJournalEntry[];
}

const WordCloud: React.FC<WordCloudProps> = ({ entries }) => {
  const getWordFrequency = () => {
    const wordFreq: { [key: string]: number } = {};
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'not', 'no', 'yes', 'so', 'if', 'then', 'else', 'my', 'your', 'his', 'her', 'its', 'our', 'their'];

    entries.forEach(entry => {
      const text = `${entry.content} ${entry.biggestWin || ''} ${entry.learning || ''} ${(entry.tags || []).join(' ')}`;
      const words = text.toLowerCase().match(/\b\w+\b/g) || [];

      words.forEach(word => {
        if (!stopWords.includes(word) && word.length > 3) {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
      });
    });

    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));
  };

  const wordData = getWordFrequency();
  const maxCount = Math.max(...wordData.map(d => d.count), 1);

  const getWordSize = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.8) return 'text-2xl font-bold';
    if (ratio > 0.6) return 'text-xl font-semibold';
    if (ratio > 0.4) return 'text-lg font-medium';
    if (ratio > 0.2) return 'text-base';
    return 'text-sm';
  };

  const getWordColor = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.8) return 'text-sage-600 dark:text-sage-400';
    if (ratio > 0.6) return 'text-dusty-blue-600 dark:text-dusty-blue-400';
    if (ratio > 0.4) return 'text-soft-lavender-600 dark:text-soft-lavender-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  if (wordData.length === 0) {
    return (
      <div className="glass-card">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-5 h-5 text-sage-600 dark:text-sage-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Word Cloud</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-center py-8">
          Start journaling to see your word patterns
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card">
      <div className="flex items-center gap-2 mb-4">
        <Hash className="w-5 h-5 text-sage-600 dark:text-sage-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Word Cloud</h3>
      </div>
      <div className="flex flex-wrap gap-2 justify-center items-center min-h-[150px]">
        {wordData.map(({ word, count }) => (
          <span
            key={word}
            className={`${getWordSize(count)} ${getWordColor(count)} hover:scale-110 transition-transform duration-200 cursor-default`}
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
};

export default WordCloud;