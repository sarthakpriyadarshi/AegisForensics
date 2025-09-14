'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  phone: string;
  timezone: string;
  avatar: string;
  lastLogin: string;
  createdAt: string;
  preferences: {
    notifications: {
      email: boolean;
      browser: boolean;
      mobile: boolean;
    };
    theme: 'light' | 'dark' | 'auto';
    language: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
  };
  security: {
    twoFactorEnabled: boolean;
    lastPasswordChange: string;
    activeSessions: number;
  };
}

interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    id: 'user-001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@aegis.com',
    role: 'Senior Forensic Analyst',
    department: 'Digital Forensics',
    phone: '+1 (555) 123-4567',
    timezone: 'UTC-05:00 (Eastern Time)',
    avatar: '',
    lastLogin: '2024-01-15T09:30:00Z',
    createdAt: '2023-06-15T10:00:00Z',
    preferences: {
      notifications: {
        email: true,
        browser: true,
        mobile: false
      },
      theme: 'light',
      language: 'English',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h'
    },
    security: {
      twoFactorEnabled: true,
      lastPasswordChange: '2023-12-01T14:00:00Z',
      activeSessions: 3
    }
  });

  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileUpdate = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowPasswordForm(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setProfile(prev => ({
        ...prev,
        security: {
          ...prev.security,
          lastPasswordChange: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error('Failed to change password:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferenceChange = (category: string, key: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [category]: typeof prev.preferences[category as keyof typeof prev.preferences] === 'object'
          ? { ...(prev.preferences[category as keyof typeof prev.preferences] as Record<string, any>), [key]: value }
          : value
      }
    }));
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'preferences', name: 'Preferences', icon: '⚙️' }
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
            <p className="mt-2 text-gray-600">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Profile Card */}
          <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-slate-600 flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className="text-gray-600">{profile.role}</p>
                <p className="text-sm text-gray-500">{profile.department}</p>
              </div>
              <div className="ml-auto">
                <div className="text-sm text-gray-500">
                  Last login: {new Date(profile.lastLogin).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-slate-500 text-slate-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="rounded-lg bg-white shadow-sm">
            {activeTab === 'profile' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
                  <button
                    onClick={() => isEditing ? handleProfileUpdate() : setIsEditing(true)}
                    disabled={isSaving}
                    className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Edit Profile'}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <input
                      type="text"
                      value={profile.role}
                      disabled
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50 text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={profile.department}
                      disabled
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50 text-gray-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Security Settings</h3>

                <div className="space-y-6">
                  {/* Password Section */}
                  <div className="border-b border-gray-200 pb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-md font-medium text-gray-900">Password</h4>
                        <p className="text-sm text-gray-500">
                          Last changed: {new Date(profile.security.lastPasswordChange).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Change Password
                      </button>
                    </div>

                    {showPasswordForm && (
                      <div className="mt-4 rounded-lg bg-gray-50 p-4">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Current Password
                            </label>
                            <input
                              type="password"
                              value={passwordForm.currentPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              New Password
                            </label>
                            <input
                              type="password"
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Confirm New Password
                            </label>
                            <input
                              type="password"
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                            />
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={handlePasswordChange}
                              disabled={isSaving}
                              className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                            >
                              {isSaving ? 'Changing...' : 'Change Password'}
                            </button>
                            <button
                              onClick={() => setShowPasswordForm(false)}
                              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="border-b border-gray-200 pb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-md font-medium text-gray-900">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-500">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`text-sm font-medium ${
                          profile.security.twoFactorEnabled ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {profile.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <button
                          onClick={() => setProfile(prev => ({
                            ...prev,
                            security: {
                              ...prev.security,
                              twoFactorEnabled: !prev.security.twoFactorEnabled
                            }
                          }))}
                          className={`rounded-lg px-4 py-2 text-sm font-medium ${
                            profile.security.twoFactorEnabled
                              ? 'border border-red-300 text-red-700 hover:bg-red-50'
                              : 'bg-slate-600 text-white hover:bg-slate-700'
                          }`}
                        >
                          {profile.security.twoFactorEnabled ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Active Sessions */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-md font-medium text-gray-900">Active Sessions</h4>
                        <p className="text-sm text-gray-500">
                          You have {profile.security.activeSessions} active sessions
                        </p>
                      </div>
                      <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Manage Sessions
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Preferences</h3>

                <div className="space-y-6">
                  {/* Notifications */}
                  <div className="border-b border-gray-200 pb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Notifications</h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Email notifications</span>
                        <input
                          type="checkbox"
                          checked={profile.preferences.notifications.email}
                          onChange={(e) => handlePreferenceChange('notifications', 'email', e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Browser notifications</span>
                        <input
                          type="checkbox"
                          checked={profile.preferences.notifications.browser}
                          onChange={(e) => handlePreferenceChange('notifications', 'browser', e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Mobile notifications</span>
                        <input
                          type="checkbox"
                          checked={profile.preferences.notifications.mobile}
                          onChange={(e) => handlePreferenceChange('notifications', 'mobile', e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Theme and Display */}
                  <div className="border-b border-gray-200 pb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Theme & Display</h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Theme
                        </label>
                        <select
                          value={profile.preferences.theme}
                          onChange={(e) => setProfile(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              theme: e.target.value as 'light' | 'dark' | 'auto'
                            }
                          }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="auto">Auto</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Language
                        </label>
                        <select
                          value={profile.preferences.language}
                          onChange={(e) => setProfile(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              language: e.target.value
                            }
                          }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                        >
                          <option value="English">English</option>
                          <option value="Spanish">Spanish</option>
                          <option value="French">French</option>
                          <option value="German">German</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Date & Time</h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date Format
                        </label>
                        <select
                          value={profile.preferences.dateFormat}
                          onChange={(e) => setProfile(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              dateFormat: e.target.value
                            }
                          }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time Format
                        </label>
                        <select
                          value={profile.preferences.timeFormat}
                          onChange={(e) => setProfile(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              timeFormat: e.target.value as '12h' | '24h'
                            }
                          }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                        >
                          <option value="12h">12 Hour</option>
                          <option value="24h">24 Hour</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => handleProfileUpdate()}
                    disabled={isSaving}
                    className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
