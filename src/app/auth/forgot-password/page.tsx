"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Mail,
  KeyRound,
} from "lucide-react";

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In a real app: await fetch("/auth/forgot-password", { ... })

      setIsSubmitted(true);
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to send reset link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
      <div
        className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center p-3 backdrop-blur-sm border border-primary/20">
              <Image
                src="/favicon.svg"
                alt="Aegis Forensics Logo"
                width={40}
                height={40}
                className="w-10 h-10"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Reset Password
          </h1>
          <p className="text-muted-foreground">
            Recover access to your account
          </p>
        </div>

        <Card className="border-border bg-card/50 backdrop-blur-xl border-primary/10 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Forgot Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your
              password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <div className="text-center space-y-6 py-4">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Check your email</h3>
                  <p className="text-sm text-muted-foreground">
                    We have sent a password reset link to{" "}
                    <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>
                <Button
                  asChild
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <Link href="/auth/login">Return to Login</Link>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setIsSubmitted(false)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Did not receive the email? Click to resend
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="animate-shake">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="bg-background/50 border-border pl-10 focus:bg-background transition-colors"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending link...
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <KeyRound className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            asChild
            className="text-muted-foreground hover:text-foreground"
          >
            <Link href="/auth/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
