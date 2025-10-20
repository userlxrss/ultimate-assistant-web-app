'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Calendar as CalendarIcon, Clock, MapPin, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useEvents, useUpcomingEvents, useAppActions } from '@/store/useAppStore'
import { CalendarEvent } from '@/types'
import { cn } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'

export default function CalendarPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const events = useEvents()
  const upcomingEvents = useUpcomingEvents()
  const { addEvent, updateEvent, deleteEvent } = useAppActions()

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter(event => isSameDay(event.startTime, day))
  }

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800'
      case 'focus_time': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800'
      case 'personal': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800'
      case 'break': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Calendar
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your schedule and never miss an event
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          New Event
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="glass" hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Today's Events</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getEventsForDay(new Date()).length}
                </p>
              </div>
              <CalendarIcon className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {events.filter(event => {
                    const now = new Date()
                    const weekEnd = new Date()
                    weekEnd.setDate(weekEnd.getDate() + 7)
                    return event.startTime >= now && event.startTime <= weekEnd
                  }).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Meetings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {events.filter(e => e.type === 'meeting').length}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Focus Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {events.filter(e => e.type === 'focus_time').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            icon={<ChevronLeft className="w-4 h-4" />}
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button
            variant="outline"
            size="sm"
            icon={<ChevronRight className="w-4 h-4" />}
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          />
        </div>
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
            className="w-64"
          />
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              Day
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-gray-50 dark:bg-gray-800 p-3 text-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {day}
            </span>
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isToday = isSameDay(day, new Date())
          const isSelected = isSameDay(day, selectedDate)

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.01 }}
              className={cn(
                'bg-white dark:bg-gray-900 p-2 min-h-[100px] cursor-pointer transition-colors',
                !isCurrentMonth && 'bg-gray-50 dark:bg-gray-800',
                isToday && 'bg-blue-50 dark:bg-blue-900/20',
                isSelected && 'ring-2 ring-blue-500'
              )}
              onClick={() => setSelectedDate(day)}
            >
              <div className={cn(
                'text-sm font-medium mb-1',
                isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300',
                !isCurrentMonth && 'text-gray-400 dark:text-gray-600'
              )}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event, eventIndex) => (
                  <div
                    key={event.id}
                    className={cn(
                      'text-xs p-1 rounded truncate border',
                      getEventTypeColor(event.type)
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedEvent(event)
                    }}
                  >
                    {format(event.startTime, 'HH:mm')} {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Upcoming Events */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingEvents.slice(0, 5).map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    'w-3 h-3 rounded-full',
                    event.type === 'meeting' ? 'bg-blue-500' :
                    event.type === 'focus_time' ? 'bg-green-500' :
                    event.type === 'personal' ? 'bg-purple-500' :
                    event.type === 'break' ? 'bg-yellow-500' : 'bg-gray-500'
                  )} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {event.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(event.startTime, 'MMM d, HH:mm')}
                      {event.location && ` • ${event.location}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {event.attendees.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-500">
                        {event.attendees.length}
                      </span>
                    </div>
                  )}
                  {event.location && (
                    <MapPin className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </motion.div>
            ))}
            {upcomingEvents.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                No upcoming events
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Event Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Event"
        size="lg"
      >
        <EventForm
          onSubmit={(data) => {
            addEvent(data)
            setIsCreateModalOpen(false)
          }}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Event Detail Modal */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title}
        size="lg"
      >
        {selectedEvent && (
          <EventDetail
            event={selectedEvent}
            onUpdate={(data) => {
              updateEvent(selectedEvent.id, data)
              setSelectedEvent(null)
            }}
            onDelete={() => {
              deleteEvent(selectedEvent.id)
              setSelectedEvent(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}

// Event Form Component
function EventForm({
  onSubmit,
  onCancel
}: {
  onSubmit: (data: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    attendeeEmails: '',
    type: 'meeting' as CalendarEvent['type'],
    isRecurring: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const attendees = formData.attendeeEmails
      .split(',')
      .map(email => ({
        id: Math.random().toString(36),
        name: email.trim(),
        email: email.trim(),
        status: 'needs_action' as const,
        isOrganizer: false
      }))

    onSubmit({
      ...formData,
      startTime: new Date(formData.startTime),
      endTime: new Date(formData.endTime),
      attendees,
      type: formData.type,
      isRecurring: formData.isRecurring
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Event Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="Enter event title"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="Describe your event..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Time *
          </label>
          <input
            type="datetime-local"
            value={formData.startTime}
            onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            End Time *
          </label>
          <input
            type="datetime-local"
            value={formData.endTime}
            onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Location
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="Event location or meeting link"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Event Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as CalendarEvent['type'] }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="meeting">Meeting</option>
            <option value="focus_time">Focus Time</option>
            <option value="personal">Personal</option>
            <option value="break">Break</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Attendees
          </label>
          <input
            type="text"
            value={formData.attendeeEmails}
            onChange={(e) => setFormData(prev => ({ ...prev, attendeeEmails: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="email@example.com, email2@example.com"
          />
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isRecurring"
          checked={formData.isRecurring}
          onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
          className="mr-2"
        />
        <label htmlFor="isRecurring" className="text-sm text-gray-700 dark:text-gray-300">
          This is a recurring event
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Create Event
        </Button>
      </div>
    </form>
  )
}

// Event Detail Component
function EventDetail({
  event,
  onUpdate,
  onDelete
}: {
  event: CalendarEvent
  onUpdate: (data: Partial<CalendarEvent>) => void
  onDelete: () => void
}) {
  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'focus_time': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'personal': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'break': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className={cn("px-3 py-1 text-sm font-medium rounded-full", getEventTypeColor(event.type))}>
            {event.type.replace('_', ' ')}
          </span>
          <span className={cn(
            "px-3 py-1 text-sm font-medium rounded-full",
            event.status === 'confirmed' ? 'bg-green-100 text-green-800' :
            event.status === 'tentative' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          )}>
            {event.status}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {event.title}
        </h3>
        {event.description && (
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {event.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Start Time</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {format(event.startTime, 'MMMM d, yyyy HH:mm')}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">End Time</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {format(event.endTime, 'MMMM d, yyyy HH:mm')}
          </p>
        </div>
      </div>

      {event.location && (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
          <p className="font-medium text-gray-900 dark:text-white flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            {event.location}
          </p>
        </div>
      )}

      {event.attendees.length > 0 && (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Attendees ({event.attendees.length})
          </p>
          <div className="space-y-2">
            {event.attendees.map((attendee, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium">
                      {attendee.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {attendee.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {attendee.email}
                    </p>
                  </div>
                </div>
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full",
                  attendee.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  attendee.status === 'declined' ? 'bg-red-100 text-red-800' :
                  attendee.status === 'tentative' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                )}>
                  {attendee.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Created {format(event.createdAt, 'MMMM d, yyyy')}
        </p>
        <Button>
          {event.status === 'confirmed' ? 'Cancel Event' : 'Confirm Event'}
        </Button>
      </div>
    </div>
  )
}