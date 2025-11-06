import React, { useMemo } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Task, CalendarEvent, Email, Contact } from '../types';
import { format, isThisWeek, subDays } from 'date-fns';
import { productivityChartOptions, doughnutChartOptions } from '../utils/chartUtils';

interface ProductivityMetricsProps {
  tasks: Task[];
  events: CalendarEvent[];
  emails: Email[];
  contacts: Contact[];
}

export const ProductivityMetrics: React.FC<ProductivityMetricsProps> = ({
  tasks,
  events,
  emails,
  contacts
}) => {
  const thirtyDaysAgo = subDays(new Date(), 30);

  const taskData = useMemo(() => {
    const last30Days = tasks.filter(task => task.createdAt >= thirtyDaysAgo);
    const createdByDate: Record<string, number> = {};
    const completedByDate: Record<string, number> = {};

    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      createdByDate[date] = 0;
      completedByDate[date] = 0;
    }

    last30Days.forEach(task => {
      const createdDate = format(task.createdAt, 'yyyy-MM-dd');
      if (createdByDate[createdDate] !== undefined) {
        createdByDate[createdDate]++;
      }

      if (task.completedAt) {
        const completedDate = format(task.completedAt, 'yyyy-MM-dd');
        if (completedByDate[completedDate] !== undefined) {
          completedByDate[completedDate]++;
        }
      }
    });

    const labels = Object.keys(createdByDate).map(date => format(new Date(date), 'MMM dd'));

    return {
      labels,
      datasets: [
        {
          label: 'Tasks Created',
          data: Object.values(createdByDate),
          borderColor: 'rgba(105, 180, 145, 0.8)',
          backgroundColor: 'rgba(105, 180, 145, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Tasks Completed',
          data: Object.values(completedByDate),
          borderColor: 'rgba(104, 134, 180, 0.8)',
          backgroundColor: 'rgba(104, 134, 180, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
        }
      ]
    };
  }, [tasks]);

  const eventData = useMemo(() => {
    const thisWeekEvents = events.filter(event => isThisWeek(event.date));
    const eventTypes = thisWeekEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(eventTypes).map(type => type.charAt(0).toUpperCase() + type.slice(1)),
      datasets: [
        {
          data: Object.values(eventTypes),
          backgroundColor: [
            'rgba(105, 180, 145, 0.7)',
            'rgba(185, 164, 225, 0.7)',
            'rgba(104, 134, 180, 0.7)',
            'rgba(248, 113, 113, 0.7)',
            'rgba(251, 191, 36, 0.7)'
          ],
          borderColor: [
            'rgba(105, 180, 145, 1)',
            'rgba(185, 164, 225, 1)',
            'rgba(104, 134, 180, 1)',
            'rgba(248, 113, 113, 1)',
            'rgba(251, 191, 36, 1)'
          ],
          borderWidth: 2,
        }
      ]
    };
  }, [events]);

  const emailActivity = useMemo(() => {
    const thisWeekEmails = emails.filter(email => isThisWeek(email.date));
    const sent = thisWeekEmails.filter(email => email.sent).length;
    const received = thisWeekEmails.filter(email => !email.sent).length;

    return {
      labels: ['Sent', 'Received'],
      datasets: [
        {
          data: [sent, received],
          backgroundColor: ['rgba(104, 134, 180, 0.7)', 'rgba(185, 164, 225, 0.7)'],
          borderColor: ['rgba(104, 134, 180, 1)', 'rgba(185, 164, 225, 1)'],
          borderWidth: 2,
        }
      ]
    };
  }, [emails]);

  const contactGrowth = useMemo(() => {
    const last30Days = contacts.filter(contact => contact.createdAt >= thirtyDaysAgo);
    const cumulativeCount: number[] = [];
    const labels: string[] = [];

    let count = 0;
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayCount = last30Days.filter(contact => format(contact.createdAt, 'yyyy-MM-dd') <= dateStr).length;
      cumulativeCount.push(dayCount);
      labels.push(format(date, 'MMM dd'));
    }

    return {
      labels,
      datasets: [
        {
          label: 'Total Contacts',
          data: cumulativeCount,
          borderColor: 'rgba(185, 164, 225, 0.8)',
          backgroundColor: 'rgba(185, 164, 225, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
        }
      ]
    };
  }, [contacts]);

  const completionRate = useMemo(() => {
    const last30Days = tasks.filter(task => task.createdAt >= thirtyDaysAgo);
    const completed = last30Days.filter(task => task.completed).length;
    return last30Days.length > 0 ? Math.round((completed / last30Days.length) * 100) : 0;
  }, [tasks]);

  return (
    <div className="space-y-6">
      <div className="glass-card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Task Completion Rate</h3>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-3xl font-bold text-sage-600 dark:text-sage-400">{completionRate}%</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Last 30 days</p>
          </div>
          <div className="w-32 h-32">
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute inset-0 bg-sage-500/20 rounded-full"></div>
              <div
                className="absolute inset-0 bg-sage-500 rounded-full transition-all duration-1000"
                style={{
                  clipPath: `polygon(50% 50%, 50% 0%, ${50 + (completionRate / 2) * Math.cos((completionRate - 90) * Math.PI / 180)}% ${50 + (completionRate / 2) * Math.sin((completionRate - 90) * Math.PI / 180)}%)`
                }}
              ></div>
              <span className="relative text-lg font-bold text-gray-900 dark:text-white">{completionRate}%</span>
            </div>
          </div>
        </div>
        <div className="h-48">
          <Line data={taskData} options={productivityChartOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Calendar Event Breakdown</h3>
          <div className="h-64">
            <Doughnut data={eventData} options={doughnutChartOptions} />
          </div>
        </div>

        <div className="glass-card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Email Activity</h3>
          <div className="h-64">
            <Doughnut data={emailActivity} options={doughnutChartOptions} />
          </div>
        </div>
      </div>

      <div className="glass-card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Growth</h3>
        <div className="h-48">
          <Line data={contactGrowth} options={productivityChartOptions} />
        </div>
      </div>
    </div>
  );
};