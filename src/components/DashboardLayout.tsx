'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: string;
  badge?: number;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: '🏠' },
  { name: 'Cases', href: '/cases', icon: '📁' },
  { name: 'Evidence Analysis', href: '/analysis', icon: '🔍' },
  { name: 'Agent Status', href: '/agents', icon: '🤖' },
  { name: 'Live Response', href: '/live', icon: '🔴' },
  { name: 'Script Generator', href: '/scripts', icon: '📝' },
  { name: 'System Monitor', href: '/system', icon: '📊' },
  { name: 'Timeline', href: '/timeline', icon: '⏰' },
];

export default function DashboardLayout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 z-50 flex w-64 flex-col transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-800 px-6 pb-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center">
            <Image
              src="/aegis-logo.png"
              alt="Aegis Forensics"
              width={40}
              height={40}
              className="h-10 w-auto"
            />
            <span className="ml-3 text-xl font-bold text-slate-100">
              Aegis Forensics
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`
                            group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors
                            ${isActive 
                              ? 'bg-slate-700 text-white' 
                              : 'text-slate-300 hover:text-white hover:bg-slate-700'
                            }
                          `}
                        >
                          <span className="text-lg">{item.icon}</span>
                          {item.name}
                          {item.badge && (
                            <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>

              {/* User section */}
              <li className="mt-auto">
                <Link 
                  href="/profile"
                  className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center">
                    <span className="text-sm">👤</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-200">Admin User</p>
                    <p className="text-xs text-slate-400">admin@company.com</p>
                  </div>
                  <span className="text-slate-400 hover:text-slate-200">
                    ⚙️
                  </span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white px-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-slate-700 dark:text-slate-300 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 lg:hidden" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Status indicator */}
              <div className="flex items-center gap-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">System Online</span>
              </div>

              {/* Notifications */}
              <button
                type="button"
                className="-m-2.5 p-2.5 text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400"
              >
                <span className="sr-only">View notifications</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </button>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  type="button"
                  className="-m-1.5 flex items-center p-1.5"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-slate-500 flex items-center justify-center">
                    <span className="text-sm text-white">A</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
