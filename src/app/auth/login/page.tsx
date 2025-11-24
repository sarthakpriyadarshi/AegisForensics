"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Bot,
  Shield,
  BarChart3,
  Mail,
  Lock,
  Sparkles,
} from "lucide-react";

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">(
    "checking"
  );

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch("http://localhost:8000/health", {
          method: "GET",
        });
        if (response.ok) {
          setApiStatus("online");
        } else {
          setApiStatus("offline");
        }
      } catch (error) {
        console.error("API status check failed:", error);
        setApiStatus("offline");
      }
    };

    checkApiStatus();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("aegis_token", data.access_token);
        localStorage.setItem(
          "aegis_token_expires",
          (Date.now() + data.expires_in * 1000).toString()
        );
        window.location.href = "/dashboard";
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Invalid email or password");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setError(
        "Authentication failed. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getApiStatusBadge = () => {
    switch (apiStatus) {
      case "online":
        return (
          <Badge
            variant="default"
            className="bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/50 backdrop-blur-sm text-xs"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Online
          </Badge>
        );
      case "offline":
        return (
          <Badge
            variant="destructive"
            className="bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/50 backdrop-blur-sm text-xs"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Offline
          </Badge>
        );
      default:
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 border border-yellow-600/50 backdrop-blur-sm text-xs"
          >
            <Clock className="w-3 h-3 mr-1 animate-pulse" />
            Checking...
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
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

      {/* Left side - Login Form */}
      <div className="flex-1 lg:max-w-[60%] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 relative z-10">
        <div className="mx-auto w-full max-w-sm lg:w-96 animate-fade-in">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-xl flex items-center justify-center p-2 backdrop-blur-sm border border-primary/30 shadow-lg shadow-primary/20">
                <Image
                  src="/favicon.svg"
                  alt="Aegis Forensics Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Aegis Forensics
                </h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI-Powered Investigation
                </p>
              </div>
            </div>

            <div className="mb-6 space-y-1">
              <h2 className="text-2xl font-bold text-foreground">
                Welcome back
              </h2>
              <p className="text-sm text-muted-foreground">
                Sign in to your account
              </p>
            </div>
          </div>

          <Card className="border border-primary/20 bg-card/80 backdrop-blur-2xl shadow-2xl shadow-primary/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <CardHeader className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold">Sign In</CardTitle>
                {getApiStatusBadge()}
              </div>
              {apiStatus === "offline" && (
                <CardDescription className="text-destructive flex items-center gap-2 text-sm">
                  <XCircle className="w-4 h-4" />
                  Backend service is currently unavailable
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              <form className="space-y-5" onSubmit={handleSubmit}>
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

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email address
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className="bg-background/50 border-border/50 pl-10 h-11 focus:border-primary/50 focus:bg-background transition-all duration-200 focus:shadow-lg focus:shadow-primary/10"
                    />
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
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      className="bg-background/50 border-border/50 pl-10 pr-10 h-11 focus:border-primary/50 focus:bg-background transition-all duration-200 focus:shadow-lg focus:shadow-primary/10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rememberMe"
                      checked={formData.rememberMe}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          rememberMe: checked as boolean,
                        }))
                      }
                      className="border-border/50"
                    />
                    <Label
                      htmlFor="rememberMe"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Remember me
                    </Label>
                  </div>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/setup"
                className="font-semibold text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </p>
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Enhanced Branding */}
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
                Enterprise-Grade Security
              </Badge>

              <h2 className="text-4xl font-bold mb-4 text-foreground leading-tight">
                Investigate
                <br />
                <span className="bg-gradient-to-r from-primary via-purple-400 to-blue-400 bg-clip-text text-transparent">
                  with Confidence
                </span>
              </h2>

              <p className="text-base text-muted-foreground/90 leading-relaxed">
                Powered by advanced AI and machine learning, Aegis Forensics
                delivers unparalleled insights for digital investigations.
              </p>
            </div>

            <div className="space-y-4 mb-10">
              {[
                {
                  icon: Search,
                  title: "Deep Evidence Analysis",
                  description:
                    "Comprehensive forensic examination with AI-powered pattern detection",
                },
                {
                  icon: Bot,
                  title: "Intelligent Automation",
                  description:
                    "Automated workflows that save time and reduce human error",
                },
                {
                  icon: Shield,
                  title: "Secure Chain of Custody",
                  description:
                    "Tamper-proof evidence handling with complete audit trails",
                },
                {
                  icon: BarChart3,
                  title: "Real-time Analytics",
                  description:
                    "Live dashboards and reporting for active investigations",
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
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">99.9%</span>{" "}
                  Uptime
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">SOC 2</span>{" "}
                  Certified
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">10K+</span>{" "}
                  Cases
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
