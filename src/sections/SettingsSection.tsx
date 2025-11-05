// app/settings/section.tsx
"use client";

import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import ThemeButton from "../components/common/ThemeButton";
import { Camera, Sparkles } from "lucide-react";

export default function SettingsSection() {
  const { partner } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"profile" | "roles">("profile");

  const getInitials = (name: string = "") =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  if (!partner) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <ThemeButton theme={theme} setTheme={setTheme} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Navigation */}
        <div className="lg:col-span-1">
          <Card className="border border-muted">
            <CardContent className="p-4 space-y-2">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "profile"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                Profile Settings
              </button>
              <button
                onClick={() => setActiveTab("roles")}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "roles"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                Roles & Permissions
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-3">
          {activeTab === "profile" && (
            <Card className="border border-muted">
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Profile Picture Section */}
                <div>
                  <Label className="text-sm font-medium mb-4 block">
                    Profile Pic
                  </Label>
                  <div className="flex items-start gap-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarFallback className="text-2xl">
                          {getInitials(partner.name)}
                        </AvatarFallback>
                      </Avatar>
                      <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled
                          className="opacity-50"
                        >
                          Change Profile Pic
                        </Button>
                        <Badge 
                          variant="secondary" 
                          className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Coming Soon
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Atleast 800px by 800px recommended
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Format JPG or PNG
                      </p>
                      <p className="text-xs text-primary mt-2 italic">
                        We're working on making your profile shine even brighter! ✨
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Details Section */}
                <div className="space-y-6">
                  <h3 className="text-base font-semibold text-foreground">
                    Contact Details
                  </h3>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Phone Number
                      </Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary h-auto p-0 text-sm"
                        disabled
                      >
                        Edit
                      </Button>
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      value={partner.phone}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email
                      </Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary h-auto p-0 text-sm"
                        disabled
                      >
                        Edit
                      </Button>
                    </div>
                    <Input
                      id="email"
                      type="email"
                      value={partner.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* Username */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="username" className="text-sm font-medium">
                        Username
                      </Label>
                    </div>
                    <Input
                      id="username"
                      type="text"
                      value={partner.username}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* Full Name */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Full Name
                      </Label>
                    </div>
                    <Input
                      id="name"
                      type="text"
                      value={partner.name}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Profile updates are on the way!
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        We're building a seamless experience for you to update your profile information. Stay tuned for exciting updates!
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "roles" && (
            <Card className="border border-muted">
              <CardHeader>
                <CardTitle>Roles & Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-8 text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Role management features coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}