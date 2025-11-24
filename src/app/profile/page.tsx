"use client"

import type React from "react"
import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { AuthGuard } from "@/components/AuthGuard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Shield, Settings, Edit, Save, X, AlertCircle } from "lucide-react"

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

interface ApiUserProfile {
  id: number
  full_name: string
  email: string
  organization: string
  timezone: string
  avatar_base64: string | null
  is_admin: boolean
  created_at: string
  last_login: string | null
  password_expires_at: string
  is_active: boolean
}

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "preferences">("profile")
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [profile, setProfile] = useState<UserProfile>({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    department: "",
    phone: "",
    timezone: "",
    avatar: "",
    lastLogin: "",
    createdAt: "",
    preferences: {
      notifications: {
        email: true,
        browser: true,
        mobile: false,
      },
      theme: "dark",
      language: "English",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
    },
    security: {
      twoFactorEnabled: false,
      lastPasswordChange: "",
      activeSessions: 1,
    },
  })

  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Load profile data from API
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem("aegis_token")
        if (!token) {
          window.location.href = "/auth/login"
          return
        }

        const response = await fetch("http://localhost:8000/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data: ApiUserProfile = await response.json()
          const nameParts = data.full_name.split(" ")
          const firstName = nameParts[0] || ""
          const lastName = nameParts.slice(1).join(" ") || ""

          setProfile({
            id: data.id.toString(),
            firstName,
            lastName,
            email: data.email,
            role: data.is_admin ? "Administrator" : "Forensic Analyst",
            department: data.organization,
            phone: "",
            timezone: data.timezone,
            avatar: data.avatar_base64 || "",
            lastLogin: data.last_login || "",
            createdAt: data.created_at,
            preferences: {
              notifications: {
                email: true,
                browser: true,
                mobile: false,
              },
              theme: "dark",
              language: "English",
              dateFormat: "MM/DD/YYYY",
              timeFormat: "12h",
            },
            security: {
              twoFactorEnabled: false,
              lastPasswordChange: data.password_expires_at,
              activeSessions: 1,
            },
          })
        } else if (response.status === 401) {
          localStorage.removeItem("aegis_token")
          window.location.href = "/auth/login"
        }
      } catch (error) {
        console.error("Error loading profile:", error)
        setError("Failed to load profile data")
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleProfileUpdate = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem("aegis_token")
      if (!token) {
        window.location.href = "/auth/login"
        return
      }

      const response = await fetch("http://localhost:8000/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: `${profile.firstName} ${profile.lastName}`,
          organization: profile.department,
          timezone: profile.timezone,
          avatar_base64: profile.avatar || null,
        }),
      })

      if (response.ok) {
        setIsEditing(false)
        setError(null)
      } else if (response.status === 401) {
        localStorage.removeItem("aegis_token")
        window.location.href = "/auth/login"
      } else {
        throw new Error("Failed to update profile")
      }
    } catch (error) {
      console.error("Failed to update profile:", error)
      setError("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsSaving(true)
    try {
      const token = localStorage.getItem("aegis_token")
      if (!token) {
        window.location.href = "/auth/login"
        return
      }

      const response = await fetch("http://localhost:8000/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
        }),
      })

      if (response.ok) {
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
        setShowPasswordForm(false)
        setError(null)
        alert("Password changed successfully")
      } else if (response.status === 401) {
        localStorage.removeItem("aegis_token")
        window.location.href = "/auth/login"
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to change password")
      }
    } catch (error) {
      console.error("Failed to change password:", error)
      setError("Failed to change password: " + (error as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreferenceChange = (category: string, key: string, value: boolean | string) => {
    setProfile((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [category]:
          typeof prev.preferences[category as keyof typeof prev.preferences] === "object"
            ? {
                ...(prev.preferences[category as keyof typeof prev.preferences] as Record<string, boolean | string>),
                [key]: value,
              }
            : value,
      },
    }))
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-6">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="border-primary/20 text-primary">
                  <User className="w-3 h-3 mr-1" />
                  Account Management
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-foreground">User Profile</h1>
              <p className="text-lg text-muted-foreground">
                Manage your account settings, security preferences, and system configuration.
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <Card className="border-destructive/50 bg-destructive/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Profile Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={profile.avatar || "/placeholder.svg"}
                    alt={`${profile.firstName} ${profile.lastName}`}
                  />
                  <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                    {profile.firstName.charAt(0)}
                    {profile.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold mb-2">
                    {profile.firstName} {profile.lastName}
                  </h2>
                  <p className="text-lg font-medium text-primary">{profile.role}</p>
                  <p className="text-muted-foreground">{profile.department}</p>
                </div>
                <Card className="w-full md:w-auto">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Last login</p>
                      <p className="font-medium">{new Date(profile.lastLogin).toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Tab Content */}
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "profile" | "security" | "preferences")}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Preferences
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>Update your personal information and contact details</CardDescription>
                    </div>
                    <Button
                      onClick={() => (isEditing ? handleProfileUpdate() : setIsEditing(true))}
                      disabled={isSaving}
                      className={isEditing ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {isSaving ? (
                        "Saving..."
                      ) : isEditing ? (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      ) : (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Profile
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {[
                      { label: "First Name", key: "firstName", type: "text", editable: true },
                      { label: "Last Name", key: "lastName", type: "text", editable: true },
                      { label: "Email Address", key: "email", type: "email", editable: true },
                      { label: "Phone Number", key: "phone", type: "tel", editable: true },
                      { label: "Role", key: "role", type: "text", editable: false },
                      { label: "Department", key: "department", type: "text", editable: false },
                    ].map((field) => (
                      <div key={field.key} className="space-y-2">
                        <Label htmlFor={field.key}>{field.label}</Label>
                        <Input
                          id={field.key}
                          type={field.type}
                          value={profile[field.key as keyof UserProfile] as string}
                          onChange={(e) =>
                            field.editable && setProfile((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          disabled={!field.editable || !isEditing}
                          className={!field.editable || !isEditing ? "bg-muted" : ""}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account security and authentication</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Password Section */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-semibold">Password</h4>
                        <p className="text-sm text-muted-foreground">
                          Last changed: {new Date(profile.security.lastPasswordChange).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => setShowPasswordForm(!showPasswordForm)} className="w-full sm:w-auto">
                        Change Password
                      </Button>
                    </div>

                    {showPasswordForm && (
                      <Card>
                        <CardContent className="p-6 space-y-4">
                          {[
                            { label: "Current Password", key: "currentPassword" },
                            { label: "New Password", key: "newPassword" },
                            { label: "Confirm New Password", key: "confirmPassword" },
                          ].map((field) => (
                            <div key={field.key} className="space-y-2">
                              <Label htmlFor={field.key}>{field.label}</Label>
                              <Input
                                id={field.key}
                                type="password"
                                value={passwordForm[field.key as keyof PasswordChangeForm]}
                                onChange={(e) => setPasswordForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                              />
                            </div>
                          ))}
                          <div className="flex space-x-4 pt-4">
                            <Button
                              onClick={handlePasswordChange}
                              disabled={isSaving}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {isSaving ? "Changing..." : "Change Password"}
                            </Button>
                            <Button variant="outline" onClick={() => setShowPasswordForm(false)}>
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4">
                    <div>
                      <h4 className="text-lg font-semibold">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                    <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
                      <Badge variant={profile.security.twoFactorEnabled ? "default" : "secondary"}>
                        {profile.security.twoFactorEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                      <Button
                        variant={profile.security.twoFactorEnabled ? "destructive" : "default"}
                        onClick={() =>
                          setProfile((prev) => ({
                            ...prev,
                            security: {
                              ...prev.security,
                              twoFactorEnabled: !prev.security.twoFactorEnabled,
                            },
                          }))
                        }
                      >
                        {profile.security.twoFactorEnabled ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>

                  {/* Active Sessions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4">
                    <div>
                      <h4 className="text-lg font-semibold">Active Sessions</h4>
                      <p className="text-sm text-muted-foreground">
                        You have {profile.security.activeSessions} active sessions
                      </p>
                    </div>
                    <Button variant="outline" className="w-full sm:w-auto">Manage Sessions</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>Customize your experience and notification settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Notifications */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">Notifications</h4>
                    <div className="space-y-4">
                      {[
                        { key: "email", label: "Email notifications" },
                        { key: "browser", label: "Browser notifications" },
                        { key: "mobile", label: "Mobile notifications" },
                      ].map((notification) => (
                        <div key={notification.key} className="flex items-center justify-between p-4 border rounded-lg">
                          <Label htmlFor={notification.key} className="font-medium">
                            {notification.label}
                          </Label>
                          <Checkbox
                            id={notification.key}
                            checked={
                              profile.preferences.notifications[
                                notification.key as keyof typeof profile.preferences.notifications
                              ]
                            }
                            onCheckedChange={(checked) =>
                              handlePreferenceChange("notifications", notification.key, checked as boolean)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Theme and Display */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">Theme & Display</h4>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="theme">Theme</Label>
                        <Select
                          value={profile.preferences.theme}
                          onValueChange={(value) =>
                            setProfile((prev) => ({
                              ...prev,
                              preferences: {
                                ...prev.preferences,
                                theme: value as "light" | "dark" | "auto",
                              },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="auto">Auto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <Select
                          value={profile.preferences.language}
                          onValueChange={(value) =>
                            setProfile((prev) => ({
                              ...prev,
                              preferences: {
                                ...prev.preferences,
                                language: value,
                              },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["English", "Spanish", "French", "German"].map((lang) => (
                              <SelectItem key={lang} value={lang}>
                                {lang}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">Date & Time</h4>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="dateFormat">Date Format</Label>
                        <Select
                          value={profile.preferences.dateFormat}
                          onValueChange={(value) =>
                            setProfile((prev) => ({
                              ...prev,
                              preferences: {
                                ...prev.preferences,
                                dateFormat: value,
                              },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"].map((format) => (
                              <SelectItem key={format} value={format}>
                                {format}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timeFormat">Time Format</Label>
                        <Select
                          value={profile.preferences.timeFormat}
                          onValueChange={(value) =>
                            setProfile((prev) => ({
                              ...prev,
                              preferences: {
                                ...prev.preferences,
                                timeFormat: value as "12h" | "24h",
                              },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="12h">12 Hour</SelectItem>
                            <SelectItem value="24h">24 Hour</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t">
                    <Button
                      onClick={() => handleProfileUpdate()}
                      disabled={isSaving}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isSaving ? "Saving..." : "Save Preferences"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

export default ProfilePage
