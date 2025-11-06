import { ExtendedJournalEntry } from '../types/journal';

export const generateRealisticJournalEntries = (count: number, daysSpan: number): ExtendedJournalEntry[] => {
  const entries: ExtendedJournalEntry[] = [];
  const today = new Date();

  const templates = ['Morning Pages', 'Evening Reflection', 'Gratitude', 'Goal Review'];

  const reflections = [
    "Had a productive morning meeting with the team. The new project proposal was well-received and I feel optimistic about our direction.",
    "Struggled with focus today, but managed to complete the quarterly report. Need to work on time management.",
    "Great conversation with a mentor today. Learned so much about leadership and career growth.",
    "Feeling grateful for the support of my colleagues. We really pulled together to meet the deadline.",
    "Tried a new approach to problem-solving and it paid off. Innovation requires patience.",
    "Reflection moment: realized I need to set better boundaries with work hours.",
    "Celebrated a small win today - fixed that bug that's been bothering me for days!",
    "Learning experience: asked for help earlier instead of struggling alone. Teamwork makes the dream work.",
    "Meditation session was really helpful. Starting the day with mindfulness makes such a difference.",
    "Challenging day but growth comes from discomfort. Tomorrow is a new opportunity.",
    "Made progress on my side project today. Even small steps forward count.",
    "Had a difficult conversation but it was necessary for the team's health.",
    "Experimented with a new workflow technique. Still adjusting but promising results.",
    "Took a proper lunch break away from my desk. Small changes make big differences.",
    "Finished reading that book I've been meaning to get to. Knowledge is power.",
    "Helped a new team member get oriented. Paying it forward feels good.",
    "Realized I've been more consistent with my habits lately. Progress is visible.",
    "Weather was beautiful today, went for a walk during lunch. Nature resets the mind.",
    "Practiced saying no to protect my time and energy. Setting boundaries is healthy.",
    "Learned a new keyboard shortcut that will save me time. Efficiency matters."
  ];

  const wins = [
    "Completed the project proposal ahead of schedule",
    "Successfully resolved the client's concerns",
    "Led a productive team meeting",
    "Finished the online course module",
    "Helped a colleague solve a complex problem",
    "Implemented a new workflow that saved time",
    "Received positive feedback from my manager",
    "Overcame a fear and gave a presentation",
    "Made progress on a personal goal",
    "Maintained work-life balance despite pressure",
    "Fixed a critical bug in production",
    "Secured a new partnership opportunity",
    "Completed a challenging workout",
    "Had a breakthrough idea during brainstorming",
    "Successfully negotiated better terms",
    "Organized my workspace for better productivity",
    "Finished a book I've been reading",
    "Reached a milestone in my side project",
    "Connected with an old friend",
    "Tried something new and enjoyed it"
  ];

  const learnings = [
    "The importance of clear communication in remote work",
    "How to delegate tasks more effectively",
    "New technique for managing stress under pressure",
    "Better ways to organize my digital workspace",
    "The value of taking regular breaks",
    "How to give and receive constructive feedback",
    "Methods for improving concentration",
    "Understanding different communication styles",
    "The power of saying no to protect my time",
    "Techniques for better decision making",
    "Learning to embrace discomfort as growth",
    "The importance of celebrating small wins",
    "How to ask for help more effectively",
    "Ways to improve my morning routine",
    "The impact of sleep on productivity",
    "New methods for prioritizing tasks",
    "Understanding my energy patterns",
    "The benefit of reflective thinking",
    "How to handle difficult conversations",
    "Ways to stay motivated during challenges"
  ];

  const tags = [
    'work', 'personal', 'growth', 'productivity', 'mindfulness', 'health',
    'learning', 'relationships', 'creativity', 'leadership', 'balance',
    'challenges', 'success', 'reflection', 'goals', 'habits', 'wellness',
    'career', 'family', 'friends', 'gratitude', 'innovation', 'teamwork'
  ];

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * daysSpan);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);

    // Normal distribution of mood (more 5-8, fewer extremes)
    let mood = Math.floor(Math.random() * 10) + 1;
    const random = Math.random();
    if (random < 0.15) {
      // 15% chance of low mood (1-3)
      mood = Math.floor(Math.random() * 3) + 1;
    } else if (random < 0.25) {
      // 10% chance of high mood (9-10)
      mood = Math.floor(Math.random() * 2) + 9;
    } else {
      // 75% chance of medium mood (4-8)
      mood = Math.floor(Math.random() * 5) + 4;
    }

    // Generate tags
    const entryTags: string[] = [];
    const numTags = Math.floor(Math.random() * 4) + 1;
    const availableTags = [...tags];
    for (let j = 0; j < numTags && availableTags.length > 0; j++) {
      const tagIndex = Math.floor(Math.random() * availableTags.length);
      entryTags.push(availableTags[tagIndex]);
      availableTags.splice(tagIndex, 1);
    }

    // Generate themes and insights based on content
    const selectedReflection = reflections[Math.floor(Math.random() * reflections.length)];
    const themes = entryTags.slice(0, 2);
    const insights = [
      `Important insight about ${entryTags[0] || 'personal growth'}`,
      `Learning moment from today's experiences`
    ];

    entries.push({
      id: `journal-${Date.now()}-${i}`,
      date,
      content: selectedReflection,
      mood,
      themes,
      insights,
      biggestWin: wins[Math.floor(Math.random() * wins.length)],
      learning: learnings[Math.floor(Math.random() * learnings.length)],
      tags: entryTags,
      template: templates[Math.floor(Math.random() * templates.length)],
      isDraft: Math.random() < 0.05, // 5% chance of draft
      lastSaved: new Date(date.getTime() + Math.random() * 3600000) // Within an hour of creation
    });
  }

  // Sort by date (newest first)
  return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const calculateMoodTrends = (entries: ExtendedJournalEntry[]) => {
  if (entries.length === 0) return 0;

  const recentEntries = entries.slice(-7); // Last 7 entries
  const olderEntries = entries.slice(-14, -7); // Previous 7 entries

  if (olderEntries.length === 0) return 0;

  const recentAvg = recentEntries.reduce((sum, entry) => sum + entry.mood, 0) / recentEntries.length;
  const olderAvg = olderEntries.reduce((sum, entry) => sum + entry.mood, 0) / olderEntries.length;

  return recentAvg - olderAvg;
};

export const getMostUsedTags = (entries: ExtendedJournalEntry[], limit: number = 10) => {
  const tagCounts: { [key: string]: number } = {};

  entries.forEach(entry => {
    entry.tags?.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  return Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
};

export const getJournalStats = (entries: ExtendedJournalEntry[]) => {
  const totalEntries = entries.length;
  const avgMood = totalEntries > 0
    ? entries.reduce((sum, entry) => sum + entry.mood, 0) / totalEntries
    : 0;

  const entriesThisMonth = entries.filter(entry => {
    const now = new Date();
    return entry.date.getMonth() === now.getMonth() &&
           entry.date.getFullYear() === now.getFullYear();
  }).length;

  const entriesWithWins = entries.filter(entry => entry.biggestWin).length;
  const entriesWithLearnings = entries.filter(entry => entry.learning).length;

  return {
    totalEntries,
    avgMood: Math.round(avgMood * 10) / 10,
    entriesThisMonth,
    entriesWithWins,
    entriesWithLearnings,
    completionRate: totalEntries > 0 ? ((entriesWithWins + entriesWithLearnings) / (totalEntries * 2)) * 100 : 0
  };
};