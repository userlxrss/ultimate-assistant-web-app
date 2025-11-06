import React from 'react';
import TasksPage from './components/tasks/TasksPage';
import { TimerProvider } from './contexts/TimerContext';

const TasksApp: React.FC = () => {
  return (
    <TimerProvider>
      <TasksPage />
    </TimerProvider>
  );
};

export default TasksApp;