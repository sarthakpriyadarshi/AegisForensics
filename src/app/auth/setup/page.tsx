"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  XCircle,
  User,
  Upload,
  CheckCircle,
  Mail,
  Building,
  Lock,
  Globe,
  Sparkles,
  Shield,
  Zap,
  Users,
  Settings,
} from "lucide-react";

interface SetupFormData {
  full_name: string;
  email: string;
  organization: string;
  timezone: string;
  password: string;
  confirmPassword: string;
  avatar_base64?: string;
}

export default function AdminSetupPage() {
  const [formData, setFormData] = useState<SetupFormData>({
    full_name: "",
    email: "",
    organization: "",
    timezone: "UTC",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [avatar, setAvatar] = useState<string>("");

  const timezones = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Australia/Sydney",
    "Asia/Kolkata",
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTimezoneChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      timezone: value,
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        setError("Avatar image must be less than 1MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setAvatar(base64);
        setFormData((prev) => ({
          ...prev,
          avatar_base64: base64,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.full_name.trim()) {
      setError("Full name is required");
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setError("Valid email is required");
      return false;
    }
    if (!formData.organization.trim()) {
      setError("Organization is required");
      return false;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const setupData = {
        full_name: formData.full_name,
        email: formData.email,
        organization: formData.organization,
        timezone: formData.timezone,
        password: formData.password,
        ...(formData.avatar_base64 && {
          avatar_base64: formData.avatar_base64,
        }),
      };

      const response = await fetch("http://localhost:8000/auth/setup-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(setupData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Admin setup successful:", result);

        const loginResponse = await fetch("http://localhost:8000/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        if (loginResponse.ok) {
          const loginResult = await loginResponse.json();
          localStorage.setItem("aegis_token", loginResult.access_token);
          window.location.href = "/dashboard";
        } else {
          window.location.href = "/auth/login";
        }
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to setup admin user");
      }
    } catch (error) {
      console.error("Setup error:", error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/30 rounded-full blur-[120px] animate-pulse-glow" />
        <div
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-[80px] animate-float"
          style={{ animationDelay: "4s" }}
        />
      </div>

      {/* Left side - Setup Form */}
      <div className="flex-1 lg:max-w-[60%] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 relative z-10">
        <div className="mx-auto w-full max-w-xl animate-fade-in">
          <div className="mb-6">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-xl flex items-center justify-center p-2 backdrop-blur-sm border border-primary/30 shadow-lg shadow-primary/20">
                <Image
                  src="/favicon.svg"
                  alt="Aegis Forensics Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold text-foreground">
                  Aegis Forensics
                </h1>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI-Powered Investigation
                </p>
              </div>
            </div>

            <div className="mb-6 space-y-1 text-center">
              <Badge
                variant="outline"
                className="mb-3 border-primary/50 text-primary bg-primary/10 backdrop-blur-sm px-3 py-1.5 text-xs"
              >
                <Settings className="w-3 h-3 mr-1.5" />
                Initial Setup Required
              </Badge>
              <h2 className="text-2xl font-bold text-foreground">
                Setup Admin Account
              </h2>
              <p className="text-sm text-muted-foreground">
                Create your administrator account
              </p>
            </div>
          </div>

          <Card className="border border-primary/20 bg-card/80 backdrop-blur-2xl shadow-2xl shadow-primary/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <CardHeader className="relative z-10 pb-4">
              <CardTitle className="text-lg font-bold">
                Administrator Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 relative z-10">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative group/avatar">
                    <Avatar className="w-20 h-20 border-2 border-primary/30 shadow-lg shadow-primary/20 transition-all group-hover/avatar:border-primary/50 group-hover/avatar:shadow-xl group-hover/avatar:shadow-primary/30">
                      <AvatarImage
                        src={avatar || "/placeholder.svg"}
                        alt="Avatar"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-600/20 text-primary">
                        <User className="w-10 h-10" />
                      </AvatarFallback>
                    </Avatar>
                    {avatar && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-background">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <Label
                    htmlFor="avatar-upload"
                    className="cursor-pointer w-full"
                  >
                    <div className="flex items-center justify-center space-x-2 text-primary hover:text-primary/80 transition-colors px-4 py-2 rounded-lg hover:bg-primary/10 border border-primary/30 hover:border-primary/50 backdrop-blur-sm w-full">
                      <Upload className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold">
                        Upload Avatar
                      </span>
                    </div>
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </Label>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm font-medium">
                      Full Name
                    </Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="full_name"
                        name="full_name"
                        type="text"
                        required
                        value={formData.full_name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className="bg-background/50 border-border/50 pl-10 h-11 focus:border-primary/50 focus:bg-background transition-all duration-200 focus:shadow-lg focus:shadow-primary/10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="admin@company.com"
                        className="bg-background/50 border-border/50 pl-10 h-11 focus:border-primary/50 focus:bg-background transition-all duration-200 focus:shadow-lg focus:shadow-primary/10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="organization"
                      className="text-sm font-medium"
                    >
                      Organization
                    </Label>
                    <div className="relative group">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="organization"
                        name="organization"
                        type="text"
                        required
                        value={formData.organization}
                        onChange={handleInputChange}
                        placeholder="Your organization name"
                        className="bg-background/50 border-border/50 pl-10 h-11 focus:border-primary/50 focus:bg-background transition-all duration-200 focus:shadow-lg focus:shadow-primary/10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="text-sm font-medium">
                      Timezone
                    </Label>
                    <div className="relative group">
                      <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                      <Select
                        value={formData.timezone}
                        onValueChange={handleTimezoneChange}
                      >
                        <SelectTrigger className="bg-background/50 border-border/50 pl-10 h-11 focus:border-primary/50 focus:bg-background transition-all duration-200">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {timezones.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Minimum 8 characters"
                        className="bg-background/50 border-border/50 pl-10 h-11 focus:border-primary/50 focus:bg-background transition-all duration-200 focus:shadow-lg focus:shadow-primary/10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium"
                    >
                      Confirm Password
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm password"
                        className="bg-background/50 border-border/50 pl-10 h-11 focus:border-primary/50 focus:bg-background transition-all duration-200 focus:shadow-lg focus:shadow-primary/10"
                      />
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <Alert
                    variant="destructive"
                    className="animate-shake border-red-500/50 bg-red-500/10"
                  >
                    <XCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Create Admin Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* Footer */}
              <div className="text-center space-y-3 pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="font-semibold text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Shield className="w-3.5 h-3.5" />
                  Only one admin user is allowed per system
                </p>
                <Button
                  variant="ghost"
                  asChild
                  className="hover:bg-white/5 text-sm"
                >
                  <Link
                    href="/"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                    Back to Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:block fixed right-0 top-0 h-screen w-2/5 overflow-hidden bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#030014]">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
        <div className="absolute top-20 right-20 w-[500px] h-[500px] bg-gradient-to-br from-primary/40 to-purple-600/40 rounded-full blur-[120px] animate-pulse-glow" />
        <div
          className="absolute bottom-20 left-20 w-[400px] h-[400px] bg-gradient-to-br from-blue-500/30 to-primary/30 rounded-full blur-[100px] animate-float"
          style={{ animationDelay: "3s" }}
        />

        <div className="relative z-10 flex flex-col h-full px-12 xl:px-16 pt-12 pb-12">
          <div className="max-w-lg">
            <div className="mb-10">
              <Badge
                variant="outline"
                className="mb-5 border-primary/40 text-primary bg-primary/5 backdrop-blur-sm px-3 py-1.5 text-xs font-medium"
              >
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                First-Time Setup
              </Badge>

              <h2 className="text-4xl font-bold mb-4 text-foreground leading-tight">
                Welcome to
                <br />
                <span className="bg-gradient-to-r from-primary via-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Aegis Forensics
                </span>
              </h2>

              <p className="text-base text-muted-foreground/90 leading-relaxed">
                Set up your administrator account to begin managing digital
                investigations with enterprise-grade security and AI-powered
                insights.
              </p>
            </div>

            <div className="space-y-4 mb-10">
              {[
                {
                  icon: Shield,
                  title: "Secure Administration",
                  description:
                    "Full control over platform settings and user management",
                },
                {
                  icon: Users,
                  title: "Team Management",
                  description:
                    "Add investigators and assign roles with granular permissions",
                },
                {
                  icon: Zap,
                  title: "Quick Deployment",
                  description:
                    "Get started in minutes with our streamlined setup process",
                },
                {
                  icon: Settings,
                  title: "Complete Configuration",
                  description:
                    "Customize the platform to match your organization's needs",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 group p-3 rounded-lg hover:bg-white/5 transition-all duration-300 cursor-default"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center border border-primary/20 group-hover:border-primary/40 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground mb-0.5 group-hover:text-white transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-muted-foreground/80 leading-relaxed group-hover:text-muted-foreground transition-colors">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">256-bit</span>{" "}
                  Encryption
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">SOC 2</span>{" "}
                  Compliant
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">5 min</span>{" "}
                  Setup
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
