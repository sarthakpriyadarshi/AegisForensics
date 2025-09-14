"use client"

import type React from "react"
import { useState } from "react"
import DashboardLayout from "@/components/DashboardLayout"

interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  department: string
  phone: string
  timezone: string
  avatar: string
  lastLogin: string
  createdAt: string
  preferences: {
    notifications: {
      email: boolean
      browser: boolean
      mobile: boolean
    }
    theme: "light" | "dark" | "auto"
    language: string
    dateFormat: string
    timeFormat: "12h" | "24h"
  }
  security: {
    twoFactorEnabled: boolean
    lastPasswordChange: string
    activeSessions: number
  }
}

interface PasswordChangeForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "preferences">("profile")
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  const [profile, setProfile] = useState<UserProfile>({
    id: "user-001",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@aegis.com",
    role: "Senior Forensic Analyst",
    department: "Digital Forensics",
    phone: "+1 (555) 123-4567",
    timezone: "UTC-05:00 (Eastern Time)",
    avatar: "",
    lastLogin: "2024-01-15T09:30:00Z",
    createdAt: "2023-06-15T10:00:00Z",
    preferences: {
      notifications: {
        email: true,
        browser: true,
        mobile: false,
      },
      theme: "light",
      language: "English",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
    },
    security: {
      twoFactorEnabled: true,
      lastPasswordChange: "2023-12-01T14:00:00Z",
      activeSessions: 3,
    },
  })

  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleProfileUpdate = async () => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update profile:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Passwords do not match")
      return
    }

    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setShowPasswordForm(false)
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setProfile((prev) => ({
        ...prev,
        security: {
          ...prev.security,
          lastPasswordChange: new Date().toISOString(),
        },
      }))
    } catch (error) {
      console.error("Failed to change password:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreferenceChange = (category: string, key: string, value: any) => {
    setProfile((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [category]:
          typeof prev.preferences[category as keyof typeof prev.preferences] === "object"
            ? { ...(prev.preferences[category as keyof typeof prev.preferences] as Record<string, any>), [key]: value }
            : value,
      },
    }))
  }

  const tabs = [
    { id: "profile", name: "Profile", icon: "👤" },
    { id: "security", name: "Security", icon: "🔒" },
    { id: "preferences", name: "Preferences", icon: "⚙️" },
  ]

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8 animate-slide-up">
            <div className="inline-flex items-center px-4 py-2 glass-subtle rounded-full text-sm text-purple-200 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Account Management
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 text-balance">User Profile</h1>
            <p className="text-xl text-slate-300 text-pretty">
              Manage your account settings, security preferences, and system configuration.
            </p>
          </div>

          {/* Profile Card */}
          <div className="mb-8 glass-strong rounded-3xl p-8 animate-scale-in">
            <div className="flex items-center space-x-6">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl font-bold">
                  {profile.firstName.charAt(0)}
                  {profile.lastName.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className="text-purple-300 text-lg font-medium">{profile.role}</p>
                <p className="text-slate-400">{profile.department}</p>
              </div>
              <div className="text-right">
                <div className="glass-subtle rounded-2xl px-4 py-3">
                  <p className="text-sm text-slate-400 mb-1">Last login</p>
                  <p className="text-white font-medium">{new Date(profile.lastLogin).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="glass-subtle rounded-2xl p-2">
              <nav className="flex space-x-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                        : "text-slate-300 hover:text-white hover:bg-white/10"
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
          <div className="glass-strong rounded-3xl overflow-hidden">
            {activeTab === "profile" && (
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-white">Profile Information</h3>
                  <button
                    onClick={() => (isEditing ? handleProfileUpdate() : setIsEditing(true))}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-2xl font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all duration-300"
                  >
                    {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Edit Profile"}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {[
                    { label: "First Name", key: "firstName", type: "text", editable: true },
                    { label: "Last Name", key: "lastName", type: "text", editable: true },
                    { label: "Email Address", key: "email", type: "email", editable: true },
                    { label: "Phone Number", key: "phone", type: "tel", editable: true },
                    { label: "Role", key: "role", type: "text", editable: false },
                    { label: "Department", key: "department", type: "text", editable: false },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-semibold text-white mb-3">{field.label}</label>
                      <input
                        type={field.type}
                        value={profile[field.key as keyof UserProfile] as string}
                        onChange={(e) =>
                          field.editable && setProfile((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        disabled={!field.editable || !isEditing}
                        className={`w-full rounded-2xl border px-4 py-4 text-white transition-all duration-300 ${
                          field.editable && isEditing
                            ? "border-white/20 bg-white/10 backdrop-blur-sm focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                            : "border-white/10 bg-white/5 text-slate-400"
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-8">Security Settings</h3>

                <div className="space-y-8">
                  {/* Password Section */}
                  <div className="border-b border-white/10 pb-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">Password</h4>
                        <p className="text-slate-400">
                          Last changed: {new Date(profile.security.lastPasswordChange).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                        className="glass-subtle hover:glass-strong px-6 py-3 rounded-2xl text-white font-medium transition-all duration-300 border border-white/20 hover:border-white/30"
                      >
                        Change Password
                      </button>
                    </div>

                    {showPasswordForm && (
                      <div className="glass-subtle rounded-2xl p-6 animate-scale-in">
                        <div className="space-y-6">
                          {[
                            { label: "Current Password", key: "currentPassword" },
                            { label: "New Password", key: "newPassword" },
                            { label: "Confirm New Password", key: "confirmPassword" },
                          ].map((field) => (
                            <div key={field.key}>
                              <label className="block text-sm font-semibold text-white mb-3">{field.label}</label>
                              <input
                                type="password"
                                value={passwordForm[field.key as keyof PasswordChangeForm]}
                                onChange={(e) => setPasswordForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                                className="w-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-4 text-white placeholder-slate-400 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all duration-300"
                              />
                            </div>
                          ))}
                          <div className="flex space-x-4 pt-4">
                            <button
                              onClick={handlePasswordChange}
                              disabled={isSaving}
                              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-2xl font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all duration-300"
                            >
                              {isSaving ? "Changing..." : "Change Password"}
                            </button>
                            <button
                              onClick={() => setShowPasswordForm(false)}
                              className="glass-subtle hover:glass-strong px-6 py-3 rounded-2xl text-white font-medium transition-all duration-300 border border-white/20 hover:border-white/30"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="border-b border-white/10 pb-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">Two-Factor Authentication</h4>
                        <p className="text-slate-400">Add an extra layer of security to your account</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span
                          className={`text-sm font-semibold px-3 py-1 rounded-full ${
                            profile.security.twoFactorEnabled
                              ? "bg-green-500/20 text-green-300 border border-green-500/30"
                              : "bg-gray-500/20 text-gray-300 border border-gray-500/30"
                          }`}
                        >
                          {profile.security.twoFactorEnabled ? "Enabled" : "Disabled"}
                        </span>
                        <button
                          onClick={() =>
                            setProfile((prev) => ({
                              ...prev,
                              security: {
                                ...prev.security,
                                twoFactorEnabled: !prev.security.twoFactorEnabled,
                              },
                            }))
                          }
                          className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                            profile.security.twoFactorEnabled
                              ? "bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30"
                              : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                          }`}
                        >
                          {profile.security.twoFactorEnabled ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Active Sessions */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">Active Sessions</h4>
                        <p className="text-slate-400">You have {profile.security.activeSessions} active sessions</p>
                      </div>
                      <button className="glass-subtle hover:glass-strong px-6 py-3 rounded-2xl text-white font-medium transition-all duration-300 border border-white/20 hover:border-white/30">
                        Manage Sessions
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "preferences" && (
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-8">Preferences</h3>

                <div className="space-y-8">
                  {/* Notifications */}
                  <div className="border-b border-white/10 pb-8">
                    <h4 className="text-lg font-semibold text-white mb-6">Notifications</h4>
                    <div className="space-y-4">
                      {[
                        { key: "email", label: "Email notifications" },
                        { key: "browser", label: "Browser notifications" },
                        { key: "mobile", label: "Mobile notifications" },
                      ].map((notification) => (
                        <label
                          key={notification.key}
                          className="flex items-center justify-between p-4 glass-subtle rounded-2xl hover:glass-strong transition-all duration-300"
                        >
                          <span className="text-white font-medium">{notification.label}</span>
                          <input
                            type="checkbox"
                            checked={
                              profile.preferences.notifications[
                                notification.key as keyof typeof profile.preferences.notifications
                              ]
                            }
                            onChange={(e) =>
                              handlePreferenceChange("notifications", notification.key, e.target.checked)
                            }
                            className="w-5 h-5 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-500/30 focus:ring-2"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Theme and Display */}
                  <div className="border-b border-white/10 pb-8">
                    <h4 className="text-lg font-semibold text-white mb-6">Theme & Display</h4>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-semibold text-white mb-3">Theme</label>
                        <select
                          value={profile.preferences.theme}
                          onChange={(e) =>
                            setProfile((prev) => ({
                              ...prev,
                              preferences: {
                                ...prev.preferences,
                                theme: e.target.value as "light" | "dark" | "auto",
                              },
                            }))
                          }
                          className="w-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-4 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all duration-300"
                        >
                          <option value="light" className="bg-slate-800">
                            Light
                          </option>
                          <option value="dark" className="bg-slate-800">
                            Dark
                          </option>
                          <option value="auto" className="bg-slate-800">
                            Auto
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-white mb-3">Language</label>
                        <select
                          value={profile.preferences.language}
                          onChange={(e) =>
                            setProfile((prev) => ({
                              ...prev,
                              preferences: {
                                ...prev.preferences,
                                language: e.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-4 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all duration-300"
                        >
                          {["English", "Spanish", "French", "German"].map((lang) => (
                            <option key={lang} value={lang} className="bg-slate-800">
                              {lang}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-6">Date & Time</h4>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-semibold text-white mb-3">Date Format</label>
                        <select
                          value={profile.preferences.dateFormat}
                          onChange={(e) =>
                            setProfile((prev) => ({
                              ...prev,
                              preferences: {
                                ...prev.preferences,
                                dateFormat: e.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-4 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all duration-300"
                        >
                          {["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"].map((format) => (
                            <option key={format} value={format} className="bg-slate-800">
                              {format}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-white mb-3">Time Format</label>
                        <select
                          value={profile.preferences.timeFormat}
                          onChange={(e) =>
                            setProfile((prev) => ({
                              ...prev,
                              preferences: {
                                ...prev.preferences,
                                timeFormat: e.target.value as "12h" | "24h",
                              },
                            }))
                          }
                          className="w-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-4 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all duration-300"
                        >
                          <option value="12h" className="bg-slate-800">
                            12 Hour
                          </option>
                          <option value="24h" className="bg-slate-800">
                            24 Hour
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/10">
                  <button
                    onClick={() => handleProfileUpdate()}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-2xl font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all duration-300"
                  >
                    {isSaving ? "Saving..." : "Save Preferences"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ProfilePage
