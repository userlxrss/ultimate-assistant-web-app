import React, { useState } from 'react';
import { useTheme } from '../../index';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile: boolean;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  active?: boolean;
  children?: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, isMobile }) => {
  const { theme } = useTheme();
  const [expandedItems, setExpandedItems] = useState<string[]>(['dashboard']);

  const navigationItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      active: true,
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      badge: 12,
    },
    {
      id: 'journal',
      label: 'Journal',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      badge: 3,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      children: [
        { id: 'mood', label: 'Mood Trends', icon: null },
        { id: 'productivity', label: 'Productivity', icon: null },
        { id: 'goals', label: 'Goal Progress', icon: null },
      ],
    },
    {
      id: 'habits',
      label: 'Habits',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      id: 'goals',
      label: 'Goals',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id}>
        <button
          className={`
            premium-glass-card w-full mb-2 premium-hover-lift premium-padding-sm
            ${item.active ? 'premium-glow-blue' : ''}
            ${level > 0 ? 'ml-6' : ''}
          `}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            }
          }}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              {item.icon && <span className="mr-3 premium-icon-bg-blue p-2 rounded-lg">{item.icon}</span>}
              <span className="premium-text-secondary font-medium">{item.label}</span>
            </div>
            <div className="flex items-center">
              {item.badge && (
                <span className="premium-glass-card premium-padding-sm premium-text-primary premium-glow-blue mr-2 premium-rounded-lg">
                  {item.badge}
                </span>
              )}
              {hasChildren && (
                <svg
                  className={`w-4 h-4 premium-text-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          </div>
        </button>

        {hasChildren && isExpanded && (
          <div className="premium-gap-sm mt-2">
            {item.children!.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onToggle}
        />
      )}

      {/* Premium Sidebar */}
      <aside className={`
        premium-glass-sidebar
        fixed lg:relative h-screen z-50
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-72' : 'w-0 lg:w-20'}
        ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : ''}
        overflow-hidden
      `}>
        <div className="h-full flex flex-col premium-gap-lg">
          {/* Sidebar Header */}
          <div className="premium-padding-lg border-b premium-border-medium">
            <div className="flex items-center justify-between">
              <h2 className={`premium-text-primary premium-heading-3 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
                Navigation
              </h2>
              <button
                onClick={onToggle}
                className="premium-button-secondary premium-hover-lift p-3 premium-rounded-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 premium-padding-lg overflow-y-auto">
            <div className="premium-gap-md">
              {navigationItems.map(item => renderNavItem(item))}
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="premium-padding-lg border-t premium-border-medium">
            <div className={`premium-glass-card premium-padding-lg premium-hover-lift ${isOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
              <div className="flex items-center">
                <div className="w-10 h-10 premium-rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold shadow-lg">
                  P
                </div>
                <div className="ml-4">
                  <p className="premium-text-primary font-semibold">Premium Plan</p>
                  <p className="premium-text-tiny">Member since 2024</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};