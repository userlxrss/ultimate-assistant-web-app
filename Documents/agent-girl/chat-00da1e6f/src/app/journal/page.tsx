'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Calendar, Heart, BookOpen, TrendingUp } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useJournalEntries, useAppActions } from '@/store/useAppStore'
import { JournalEntry } from '@/types'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export default function JournalPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)

  const journalEntries = useJournalEntries()
  const { addJournalEntry } = useAppActions()

  const filteredEntries = journalEntries.filter(entry =>
    entry.reflections.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const getMoodEmoji = (mood: number) => {
    if (mood >= 9) return '😄'
    if (mood >= 7) return '😊'
    if (mood >= 5) return '😐'
    if (mood >= 3) return '😔'
    return '😢'
  }

  const getMoodColor = (mood: number) => {
    if (mood >= 8) return 'text-green-600'
    if (mood >= 6) return 'text-blue-600'
    if (mood >= 4) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Journal
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Reflect on your day and track your emotional journey
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          New Entry
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="glass" hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Entries</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {journalEntries.length}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">7</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Mood</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {journalEntries.length > 0
                    ? (journalEntries.reduce((sum, entry) => sum + entry.mood, 0) / journalEntries.length).toFixed(1)
                    : '0'
                  }
                </p>
              </div>
              <Heart className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">5</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
            className="w-full"
          />
        </div>
        <Button variant="outline" icon={<Filter className="w-4 h-4" />}>
          Filter
        </Button>
      </div>

      {/* Journal Entries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEntries.map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card
              variant="glass"
              hover
              className="cursor-pointer"
              onClick={() => setSelectedEntry(entry)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {format(entry.date, 'MMMM d, yyyy')}
                  </CardTitle>
                  <span className={cn('text-2xl', getMoodColor(entry.mood))}>
                    {getMoodEmoji(entry.mood)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mood Score
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={cn(
                            'h-2 rounded-full transition-all duration-300',
                            entry.mood >= 8 ? 'bg-green-500' :
                            entry.mood >= 6 ? 'bg-blue-500' :
                            entry.mood >= 4 ? 'bg-yellow-500' : 'bg-red-500'
                          )}
                          style={{ width: `${(entry.mood / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {entry.mood}/10
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Reflections
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                      {entry.reflections}
                    </p>
                  </div>

                  {entry.biggestWin && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Biggest Win
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {entry.biggestWin}
                      </p>
                    </div>
                  )}

                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredEntries.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No journal entries found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start your journaling journey by creating your first entry.
          </p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Create Entry
          </Button>
        </div>
      )}

      {/* Create Entry Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Journal Entry"
        size="lg"
      >
        <JournalEntryForm
          onSubmit={(data) => {
            addJournalEntry(data)
            setIsCreateModalOpen(false)
          }}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Entry Detail Modal */}
      <Modal
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title={selectedEntry ? format(selectedEntry.date, 'MMMM d, yyyy') : ''}
        size="lg"
      >
        {selectedEntry && (
          <JournalEntryDetail entry={selectedEntry} />
        )}
      </Modal>
    </div>
  )
}

// Journal Entry Form Component
function JournalEntryForm({
  onSubmit,
  onCancel
}: {
  onSubmit: (data: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    date: new Date(),
    reflections: '',
    mood: 5,
    biggestWin: '',
    learning: '',
    tags: '',
    isPrivate: true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Date
        </label>
        <input
          type="date"
          value={format(formData.date, 'yyyy-MM-dd')}
          onChange={(e) => setFormData(prev => ({ ...prev, date: new Date(e.target.value) }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Mood (1-10)
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="range"
            min="1"
            max="10"
            value={formData.mood}
            onChange={(e) => setFormData(prev => ({ ...prev, mood: parseInt(e.target.value) }))}
            className="flex-1"
          />
          <span className="text-2xl font-bold text-gray-900 dark:text-white w-8">
            {formData.mood}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Reflections
        </label>
        <textarea
          value={formData.reflections}
          onChange={(e) => setFormData(prev => ({ ...prev, reflections: e.target.value }))}
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="How was your day? What happened? How did you feel?"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Biggest Win
        </label>
        <input
          type="text"
          value={formData.biggestWin}
          onChange={(e) => setFormData(prev => ({ ...prev, biggestWin: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="What was your biggest achievement today?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          What I Learned
        </label>
        <input
          type="text"
          value={formData.learning}
          onChange={(e) => setFormData(prev => ({ ...prev, learning: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="What new thing did you learn today?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tags
        </label>
        <input
          type="text"
          value={formData.tags}
          onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="work, personal, growth (comma separated)"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isPrivate"
          checked={formData.isPrivate}
          onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
          className="mr-2"
        />
        <label htmlFor="isPrivate" className="text-sm text-gray-700 dark:text-gray-300">
          Keep this entry private
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save Entry
        </Button>
      </div>
    </form>
  )
}

// Journal Entry Detail Component
function JournalEntryDetail({ entry }: { entry: JournalEntry }) {
  const getMoodEmoji = (mood: number) => {
    if (mood >= 9) return '😄'
    if (mood >= 7) return '😊'
    if (mood >= 5) return '😐'
    if (mood >= 3) return '😔'
    return '😢'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-4xl">{getMoodEmoji(entry.mood)}</span>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Mood Score</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {entry.mood}/10
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-400">Entry Date</p>
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            {format(entry.date, 'MMMM d, yyyy')}
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Reflections
        </h3>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {entry.reflections}
        </p>
      </div>

      {entry.biggestWin && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Biggest Win
          </h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {entry.biggestWin}
          </p>
        </div>
      )}

      {entry.learning && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            What I Learned
          </h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {entry.learning}
          </p>
        </div>
      )}

      {entry.tags.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {entry.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}