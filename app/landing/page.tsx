"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Image from "next/image";
import { 
  ArrowRight, 
  CheckCircle, 
  Users, 
  BarChart3, 
  Zap, 
  Shield, 
  Globe, 
  Play,
  Target,
  Clock,
  TrendingUp,
  Github
} from "lucide-react";
import { useAuth } from "@/services/auth/AuthContext";

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set initial scroll state and mounted state
    setMounted(true);
    setIsScrolled(window.scrollY > 50);
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleGetStarted = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/auth/login");
    }
  };

  const handleWatchDemo = () => {
    router.push("/landing/demo");
  };

  const features = [
    {
      icon: <Target className="h-8 w-8" />,
      title: "Smart Task Management",
      description: "AI-powered task prioritization and intelligent workflow automation that adapts to your team's needs."
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Team Collaboration",
      description: "Real-time collaboration tools with role-based permissions and seamless communication features."
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Analytics & Insights",
      description: "Comprehensive project analytics with AI-driven insights to optimize team performance and productivity."
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Time Tracking",
      description: "Built-in time tracking with automated reporting and productivity analysis for better project management."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Security & Privacy",
      description: "Secure framework with data privacy controls and the ability to self-host your data on your own infrastructure."
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Performance Optimization",
      description: "AI-powered recommendations to improve team efficiency and project delivery timelines."
    }
  ];

  const pricingPlans = [
    {
      name: "Free Forever",
      price: "$0",
      description: "Everything you need for unlimited team productivity",
      popular: true,
      cta: "Start Building Amazing Projects",
      features: [
        "2 orgs, 5 projects, and unlimited tasks per user",
        "AI-powered insights and suggestions",
        "Unlimited team members",
        "Advanced analytics and reporting", 
        "Real-time collaboration",
        "Secure framework",
        "Self-host your data on your own servers",
        "❌ Self-hosting requires your own infrastructure costs"
      ]
    }
  ];

  return (
    <>
      <style jsx global>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-100% - 2rem));
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-scroll {
          animation: scroll-left 30s linear infinite;
        }
        
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        
        .animation-delay-400 {
          animation-delay: 400ms;
        }
        
        .animation-delay-600 {
          animation-delay: 600ms;
        }
        
        .animation-delay-800 {
          animation-delay: 800ms;
        }
      `}</style>
      <div className="min-h-screen bg-background relative">
      {/* Navigation Header */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        mounted && isScrolled ? "bg-background/80 backdrop-blur-md border-b border-border/40" : "bg-background/50 backdrop-blur-sm"
      }`}>
        <div className="container mx-auto max-w-7xl flex h-14 items-center justify-between px-6">
          {/* Left Section: Logo */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Taskflow AI"
              width={24}
              height={24}
              className="rounded-sm"
            />
            <span className="font-semibold text-base tracking-tight">Taskflow AI</span>
          </div>
          
          {/* Center Section: Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200">Features</button>
            <button onClick={() => scrollToSection('pricing')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200">Pricing</button>
            <button onClick={() => scrollToSection('about')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200">About</button>
            <button onClick={() => scrollToSection('testimonials')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200">Testimonials</button>
          </div>
          
          {/* Right Section: Theme Toggle & Dashboard Button */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <ThemeToggle />
            {user ? (
              <Button 
                onClick={() => router.push("/dashboard")} 
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 py-2 h-8 text-sm rounded-md transition-colors duration-200"
              >
                Dashboard
              </Button>
            ) : (
              <Button 
                onClick={() => router.push("/auth/register")} 
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 py-2 h-8 text-sm rounded-md transition-colors duration-200"
              >
                Sign up
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl flex min-h-screen flex-col justify-center space-y-8 py-20 px-6 relative z-10">
        <div className="animate-fade-in-up max-w-4xl ml-16">
          <Badge variant="secondary" className="mb-6">
            Free & Open Source Project Management
          </Badge>
        </div>
        
        <div className="animate-fade-in-up animation-delay-200 max-w-4xl ml-16">
          <div className="mb-8">
            <h1 className="text-4xl font-bold leading-tight tracking-tighter md:text-6xl lg:text-7xl lg:leading-[1.1]">
              Transform Your Team's
              <br />
              <span className="text-primary">Productivity</span>
            </h1>
          </div>
        </div>
        
        <div className="animate-fade-in-up animation-delay-400 max-w-3xl ml-16">
          <p className="text-xl text-muted-foreground sm:text-2xl leading-relaxed">
            Experience the future of project management with AI-driven insights, 
            seamless collaboration, and powerful analytics. Completely free and open source.
          </p>
        </div>
        
        <div className="animate-fade-in-up animation-delay-600 flex flex-col gap-4 sm:flex-row ml-16">
          <Button size="lg" onClick={handleGetStarted} className="group transition-all duration-300 hover:scale-105 hover:shadow-lg">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button size="lg" variant="outline" onClick={handleWatchDemo} className="group transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <Play className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
            See Demo
          </Button>
        </div>
        

      </section>

      {/* Scrolling Features Section */}
      <section className="py-20 bg-muted/30 overflow-hidden relative">
        <div className="container mx-auto max-w-7xl text-center mb-12 px-4">
          <h2 className="text-3xl font-bold mb-4">Trusted by Teams Worldwide</h2>
          <p className="text-muted-foreground">See what makes Taskflow AI the choice for modern teams</p>
        </div>
        
        <div className="relative overflow-hidden">
          <div className="flex animate-scroll">
            {/* First set */}
            <div className="flex space-x-8 flex-shrink-0">
              <div className="flex items-center space-x-4 bg-background/80 backdrop-blur rounded-lg p-4 border whitespace-nowrap">
                <Target className="h-8 w-8 text-primary" />
                <span className="font-medium">Smart Task Management</span>
              </div>
              <div className="flex items-center space-x-4 bg-background/80 backdrop-blur rounded-lg p-4 border whitespace-nowrap">
                <Users className="h-8 w-8 text-primary" />
                <span className="font-medium">Real-time Collaboration</span>
              </div>
              <div className="flex items-center space-x-4 bg-background/80 backdrop-blur rounded-lg p-4 border whitespace-nowrap">
                <BarChart3 className="h-8 w-8 text-primary" />
                <span className="font-medium">Advanced Analytics</span>
              </div>
              <div className="flex items-center space-x-4 bg-background/80 backdrop-blur rounded-lg p-4 border whitespace-nowrap">
                <Shield className="h-8 w-8 text-primary" />
                <span className="font-medium">Secure Framework</span>
              </div>
              <div className="flex items-center space-x-4 bg-background/80 backdrop-blur rounded-lg p-4 border whitespace-nowrap">
                <Clock className="h-8 w-8 text-primary" />
                <span className="font-medium">Time Tracking</span>
              </div>
              <div className="flex items-center space-x-4 bg-background/80 backdrop-blur rounded-lg p-4 border whitespace-nowrap">
                <TrendingUp className="h-8 w-8 text-primary" />
                <span className="font-medium">Performance Insights</span>
              </div>
              <div className="flex items-center space-x-4 bg-background/80 backdrop-blur rounded-lg p-4 border whitespace-nowrap">
                <Globe className="h-8 w-8 text-primary" />
                <span className="font-medium">Self-Hosted Data</span>
              </div>
              <div className="flex items-center space-x-4 bg-background/80 backdrop-blur rounded-lg p-4 border whitespace-nowrap">
                <Shield className="h-8 w-8 text-primary" />
                <span className="font-medium">Open Source</span>
              </div>
              <div className="flex items-center space-x-4 bg-background/80 backdrop-blur rounded-lg p-4 border whitespace-nowrap">
                <Zap className="h-8 w-8 text-primary" />
                <span className="font-medium">No Limits</span>
              </div>
            </div>
            
            {/* Second identical set for seamless loop */}
            <div className="flex space-x-8 flex-shrink-0 ml-8">
              <div className="flex items-center space-x-4 bg-background/80 backdrop-blur rounded-lg p-4 border whitespace-nowrap">
                <Target className="h-8 w-8 text-primary" />
                <span className="font-medium">Smart Task Management</span>
              </div>
              <div className="flex items-center space-x-4 bg-background/80 backdrop-blur rounded-lg p-4 border whitespace-nowrap">
                <Users className="h-8 w-8 text-primary" />
                <span className="font-medium">Real-time Collaboration</span>
              </div>
              <div className="flex items-center space-x-4 bg-background/80 backdrop-blur rounded-lg p-4 border whitespace-nowrap">
                <BarChart3 className="h-8 w-8 text-primary" />
                <span className="font-medium">Advanced Analytics</span>
              </div>
              <div className="flex items-center space-x-4 bg-background/80 backdrop-blur rounded-lg p-4 border whitespace-nowrap">
                <Shield className="h-8 w-8 text-primary" />
                <span className="font-medium">Secure Framework</span>
              </div>
              <div className="flex items-center space-x-4 bg-background/80 backdrop-blur rounded-lg p-4 border whitespace-nowrap">
                <Clock className="h-8 w-8 text-primary" />
                <span className="font-medium">Time Tracking</span>
              </div>
              <div className="flex items-center space-x-4 bg-background/80 backdrop-blur rounded-lg p-4 border whitespace-nowrap">
                <TrendingUp className="h-8 w-8 text-primary" />
                <span className="font-medium">Performance Insights</span>
              </div>
              <div className="flex items-center space-x-4 bg-background/80 backdrop-blur rounded-lg p-4 border whitespace-nowrap">
                <Globe className="h-8 w-8 text-primary" />
                <span className="font-medium">Self-Hosted Data</span>
              </div>
              <div className="flex items-center space-x-4 bg-background/80 backdrop-blur rounded-lg p-4 border whitespace-nowrap">
                <Shield className="h-8 w-8 text-primary" />
                <span className="font-medium">Open Source</span>
              </div>
              <div className="flex items-center space-x-4 bg-background/80 backdrop-blur rounded-lg p-4 border whitespace-nowrap">
                <Zap className="h-8 w-8 text-primary" />
                <span className="font-medium">No Limits</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto max-w-7xl space-y-12 py-20 px-6">
        <div className="max-w-3xl space-y-4 ml-16">
          <div className="animate-fade-in-up">
            <h2 className="font-bold text-3xl leading-[1.1] sm:text-4xl md:text-5xl">
              Features
            </h2>
          </div>
          <div className="animate-fade-in-up animation-delay-200">
            <p className="leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Everything you need to manage projects efficiently and scale your team's success.
            </p>
          </div>
        </div>
        <div className="grid justify-start gap-6 sm:grid-cols-2 md:grid-cols-3 ml-16">
          {features.map((feature, index) => (
            <div key={index} className="animate-fade-in-up" style={{animationDelay: `${(index + 3) * 100}ms`}}>
              <Card className="group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 hover:border-primary/20 h-full">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted transition-all duration-300 group-hover:bg-primary/10 group-hover:scale-110">
                    <div className="transition-transform duration-300 group-hover:rotate-12">
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto max-w-7xl py-20 px-6">
        <div className="max-w-3xl space-y-4 mb-16 text-center mx-auto">
          <div className="animate-fade-in-up">
            <h2 className="font-bold text-3xl leading-[1.1] sm:text-4xl md:text-5xl">
              Simple Pricing
            </h2>
          </div>
          <div className="animate-fade-in-up animation-delay-200">
            <p className="leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              No hidden costs, no subscriptions, no limits. Taskflow AI is completely free and open source.
            </p>
          </div>
        </div>
        
        <div className="max-w-lg animate-fade-in-up animation-delay-400 mx-auto">
          <Card className="relative group transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 hover:border-primary/30">
            <Badge className="absolute -top-3 left-6" variant="default">
              100% Free & Open Source
            </Badge>
            <CardHeader className="pt-8 text-center">
              <CardTitle className="text-3xl group-hover:text-primary transition-colors duration-300">Free Forever</CardTitle>
              <div className="text-5xl font-bold">$0</div>
              <CardDescription className="text-lg">
                Everything you need for unlimited team productivity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-4">
                {pricingPlans[0].features.map((feature, index) => (
                  <li key={index} className="flex items-center animate-fade-in-up" style={{animationDelay: `${(index + 6) * 50}ms`}}>
                    {feature.startsWith('❌') ? (
                      <span className="mr-3 h-5 w-5 text-red-600 flex-shrink-0">❌</span>
                    ) : (
                      <CheckCircle className="mr-3 h-5 w-5 text-green-600 flex-shrink-0" />
                    )}
                    <span className="text-sm">{feature.replace('❌ ', '')}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full group transition-all duration-300 hover:scale-105 hover:shadow-lg" onClick={handleGetStarted}>
                Start Building Amazing Projects
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Why Free Section */}
        <div id="about" className="mt-16 max-w-3xl animate-fade-in-up animation-delay-600 mx-auto">
          <Card className="group transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 hover:border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl group-hover:text-primary transition-colors duration-300">Why is Taskflow AI Free?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed text-lg">
                We believe great project management tools should be accessible to everyone. 
                Taskflow AI is open source because we want to empower teams worldwide to collaborate 
                better, without barriers. No subscriptions, no hidden fees, no limits - just powerful tools for everyone.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="container mx-auto max-w-7xl py-20 px-6 bg-muted/30">
        <div className="max-w-3xl space-y-4 mb-16 ml-16">
          <div className="animate-fade-in-up">
            <h2 className="font-bold text-3xl leading-[1.1] sm:text-4xl md:text-5xl">
              Loved by Teams Worldwide
            </h2>
          </div>
          <div className="animate-fade-in-up animation-delay-200">
            <p className="leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              See what teams are saying about their experience with Taskflow AI
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 ml-16">
          <Card className="group transition-all duration-300 hover:scale-105 hover:shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>⭐</span>
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground mb-4 italic">
                "Taskflow AI has completely transformed how our development team manages projects. 
                The AI insights are incredibly accurate and save us hours of planning."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  A
                </div>
                <div className="ml-3">
                  <p className="font-semibold">Alex Chen</p>
                  <p className="text-sm text-muted-foreground">Lead Developer, TechStart</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group transition-all duration-300 hover:scale-105 hover:shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>⭐</span>
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground mb-4 italic">
                "The self-hosting option was exactly what we needed for our enterprise security requirements. 
                Setup was straightforward and the performance is excellent."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  S
                </div>
                <div className="ml-3">
                  <p className="font-semibold">Sarah Johnson</p>
                  <p className="text-sm text-muted-foreground">CTO, SecureFlow Inc</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group transition-all duration-300 hover:scale-105 hover:shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>⭐</span>
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground mb-4 italic">
                "Being completely free with no hidden costs was incredible. 
                We've scaled our team to 50+ members without worrying about licensing fees."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                  M
                </div>
                <div className="ml-3">
                  <p className="font-semibold">Marcus Rodriguez</p>
                  <p className="text-sm text-muted-foreground">Project Manager, GrowthCorp</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 max-w-2xl ml-16">
          <Card>
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-4">Join Thousands of Happy Teams</h3>
              <p className="text-muted-foreground mb-6">
                Start your journey with Taskflow AI today and experience the difference AI-powered project management can make.
              </p>
              <Button size="lg" onClick={handleGetStarted}>
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand Section */}
            <div className="md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <Image
                  src="/logo.png"
                  alt="Taskflow AI"
                  width={24}
                  height={24}
                  className="rounded-sm"
                />
                <span className="font-bold text-lg">Taskflow AI</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Open source project management for modern teams. Built by the Taskflow AI team.
              </p>
              <div className="flex space-x-3">
                <Button variant="outline" size="sm" onClick={() => window.open('https://github.com/tm1988/taskflow-ai', '_blank')}>
                  <Github className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-muted-foreground hover:text-primary transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">Dashboard</a></li>
                <li><a href="/projects" className="text-muted-foreground hover:text-primary transition-colors">Projects</a></li>
                <li><a href="/analytics" className="text-muted-foreground hover:text-primary transition-colors">Analytics</a></li>
                <li><a href="/integrations" className="text-muted-foreground hover:text-primary transition-colors">Integrations</a></li>
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/docs" className="text-muted-foreground hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="/api" className="text-muted-foreground hover:text-primary transition-colors">API Reference</a></li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</a></li>
                <li><a href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</a></li>
                <li><a href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2025 Taskflow AI. Open source and free forever. Built with ❤️ by the Taskflow AI team.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-xs text-muted-foreground">Made with</span>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">Next.js</Badge>
                <Badge variant="outline" className="text-xs">React</Badge>
                <Badge variant="outline" className="text-xs">TypeScript</Badge>
              </div>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}