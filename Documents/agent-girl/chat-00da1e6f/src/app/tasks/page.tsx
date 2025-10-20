'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Calendar, CheckCircle, Clock, AlertCircle, MoreVertical, Edit, Trash2, Play } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useTasks, useTodayTasks, useOverdueTasks, useAppActions } from '@/store/useAppStore'
import { Task } from '@/types'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export default function TasksPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const tasks = useTasks()
  const todayTasks = useTodayTasks()
  const overdueTasks = useOverdueTasks()
  const { addTask, updateTask, deleteTask, toggleTaskComplete } = useAppActions()

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesFilter = filterStatus === 'all' || task.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'in_progress': return <Play className="w-4 h-4 text-blue-500" />
      case 'pending': return <Clock className="w-4 h-4 text-gray-500" />
      case 'cancelled': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const TaskCard = ({ task, index }: { task: Task; index: number }) => (
    <motion.div
      key={task.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card variant="glass" hover className="cursor-pointer" onClick={() => setSelectedTask(task)}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3 flex-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleTaskComplete(task.id)
                }}
                className="mt-1 flex-shrink-0"
              >
                <div className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                  task.status === 'completed'
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                )}>
                  {task.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                </div>
              </button>
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "font-medium text-gray-900 dark:text-white truncate",
                  task.status === 'completed' && 'line-through text-gray-500'
                )}>
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <span className={cn(
                "px-2 py-1 text-xs font-medium rounded-full",
                getPriorityColor(task.priority)
              )}>
                {task.priority}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  // Show task options
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                {getStatusIcon(task.status)}
                <span>{task.status.replace('_', ' ')}</span>
              </div>
              {task.dueDate && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{format(task.dueDate, 'MMM d')}</span>
                </div>
              )}
            </div>
            {task.labels.length > 0 && (
              <div className="flex space-x-1">
                {task.labels.slice(0, 2).map((label, i) => (
                  <span key={i} className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                    {label}
                  </span>
                ))}
                {task.labels.length > 2 && (
                  <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                    +{task.labels.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tasks
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your tasks and boost your productivity
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          New Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="glass" hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tasks.length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Due Today</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {todayTasks.length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {overdueTasks.length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tasks.filter(t => t.status === 'in_progress').length}
                </p>
              </div>
              <Play className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-4 w-full sm:w-auto">
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
            className="flex-1"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            Kanban
          </Button>
        </div>
      </div>

      {/* Tasks List */}
      {viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredTasks.map((task, index) => (
            <TaskCard key={task.id} task={task} index={index} />
          ))}
        </div>
      ) : (
        <KanbanBoard tasks={filteredTasks} onTaskUpdate={updateTask} />
      )}

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No tasks found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first task to get started.
          </p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Create Task
          </Button>
        </div>
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Task"
        size="lg"
      >
        <TaskForm
          onSubmit={(data) => {
            addTask(data)
            setIsCreateModalOpen(false)
          }}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Task Detail Modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title={selectedTask?.title}
        size="lg"
      >
        {selectedTask && (
          <TaskDetail
            task={selectedTask}
            onUpdate={(data) => {
              updateTask(selectedTask.id, data)
              setSelectedTask(null)
            }}
            onDelete={() => {
              deleteTask(selectedTask.id)
              setSelectedTask(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}

// Kanban Board Component
function KanbanBoard({ tasks, onTaskUpdate }: { tasks: Task[]; onTaskUpdate: (id: string, data: Partial<Task>) => void }) {
  const columns = [
    { id: 'pending', title: 'To Do', color: 'border-gray-300' },
    { id: 'in_progress', title: 'In Progress', color: 'border-blue-300' },
    { id: 'completed', title: 'Done', color: 'border-green-300' },
    { id: 'cancelled', title: 'Cancelled', color: 'border-red-300' }
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {columns.map(column => {
        const columnTasks = tasks.filter(task => task.status === column.id)

        return (
          <div key={column.id} className="space-y-4">
            <div className={cn("border-l-4 pl-4", column.color)}>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {column.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {columnTasks.length} tasks
              </p>
            </div>
            <div className="space-y-3">
              {columnTasks.map(task => (
                <Card key={task.id} variant="glass" className="p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    )}>
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(task.dueDate, 'MMM d')}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Task Form Component
function TaskForm({
  onSubmit,
  onCancel
}: {
  onSubmit: (data: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    status: 'pending' as Task['status'],
    dueDate: '',
    estimatedDuration: '',
    labels: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : undefined,
      labels: formData.labels.split(',').map(label => label.trim()).filter(Boolean)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="Enter task title"
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
          placeholder="Describe your task..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Priority
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Task['status'] }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Due Date
          </label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Est. Duration (min)
          </label>
          <input
            type="number"
            value={formData.estimatedDuration}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="60"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Labels
        </label>
        <input
          type="text"
          value={formData.labels}
          onChange={(e) => setFormData(prev => ({ ...prev, labels: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="work, important, follow-up (comma separated)"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Create Task
        </Button>
      </div>
    </form>
  )
}

// Task Detail Component
function TaskDetail({
  task,
  onUpdate,
  onDelete
}: {
  task: Task
  onUpdate: (data: Partial<Task>) => void
  onDelete: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className={cn(
            "px-3 py-1 text-sm font-medium rounded-full",
            task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
            task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          )}>
            {task.priority}
          </span>
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
            {task.status.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" icon={<Edit className="w-4 h-4" />}>
            Edit
          </Button>
          <Button variant="destructive" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {task.title}
        </h3>
        {task.description && (
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {task.dueDate && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Due Date</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {format(task.dueDate, 'MMMM d, yyyy')}
            </p>
          </div>
        )}
        {task.estimatedDuration && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Duration</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {task.estimatedDuration} minutes
            </p>
          </div>
        )}
      </div>

      {task.labels.length > 0 && (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Labels</p>
          <div className="flex flex-wrap gap-2">
            {task.labels.map((label, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-sm rounded-full"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Created {format(task.createdAt, 'MMMM d, yyyy')}
        </p>
        <Button onClick={() => onUpdate({ status: task.status === 'completed' ? 'pending' : 'completed' })}>
          {task.status === 'completed' ? 'Reopen Task' : 'Mark Complete'}
        </Button>
      </div>
    </div>
  )
}