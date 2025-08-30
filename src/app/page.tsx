'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, MessageCircle, Brain, BarChart3, Shield, Users, TrendingUp, Star, Award, Sparkles } from "lucide-react";

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-pink-50 to-yellow-50">
      {/* Navigation */}
      <nav className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">FinanceFlow</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">Features</a>
              <a href="#how-it-works" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">How it Works</a>
              <a href="#pricing" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">Pricing</a>
              {user ? (
                <>
                  <span className="text-sm text-slate-600">Welcome, {user.email?.split('@')[0]}</span>
                  <Button onClick={() => router.push('/dashboard')} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl shadow-lg">
                    Dashboard
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => router.push('/login')} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl">Login</Button>
                  <Button onClick={() => router.push('/login')} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl shadow-lg">Get Started</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 py-24 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/20 via-transparent to-pink-100/20"></div>
        <div className="max-w-7xl mx-auto text-center relative">
          <div className="flex justify-center items-center space-x-4 mb-6">
            <Badge className="bg-gradient-to-r from-emerald-100 to-yellow-100 text-emerald-800 hover:from-emerald-200 hover:to-yellow-200 border-emerald-200 rounded-full px-4 py-2 shadow-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Finance Magic
            </Badge>
            <div className="flex items-center space-x-1">
              <div className="flex">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />)}
              </div>
              <span className="text-sm font-semibold text-slate-600">4.9/5 from 2,847 users</span>
            </div>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 bg-clip-text text-transparent">
              Track Your Money
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-pink-500 bg-clip-text text-transparent">
              Like Never Before
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-slate-600 mb-10 max-w-4xl mx-auto leading-relaxed">
            Simply text about your spending and watch the magic happen. ✨ 
            AI categorizes everything instantly while you focus on what matters.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            {user ? (
              <>
                <Button size="lg" onClick={() => router.push('/dashboard')} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-lg px-10 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => router.push('/admin')} className="border-2 border-pink-200 text-pink-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 text-lg px-10 py-4 rounded-2xl shadow-lg">
                  <Award className="mr-2 w-5 h-5" />
                  Admin Panel
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" onClick={() => router.push('/login')} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-lg px-10 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" className="border-2 border-pink-200 text-pink-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 text-lg px-10 py-4 rounded-2xl shadow-lg">
                  <Award className="mr-2 w-5 h-5" />
                  Watch Demo
                </Button>
              </>
            )}
          </div>
          
          {/* Demo Message Example */}
          <div className="mt-20 max-w-lg mx-auto">
            <Card className="bg-gradient-to-br from-emerald-50 via-white to-yellow-50 border-emerald-200 shadow-2xl rounded-3xl overflow-hidden transform hover:scale-105 transition-all duration-300">
              <CardHeader className="pb-3 bg-gradient-to-r from-emerald-100/50 to-yellow-100/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-emerald-800">WhatsApp Message</span>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">LIVE DEMO</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-white p-4 rounded-2xl border-2 border-emerald-100 mb-4 shadow-sm">
                  <p className="text-base text-slate-700 font-medium">"Just paid $42 for groceries at Whole Foods 🛒"</p>
                </div>
                <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <div className="flex items-center space-x-2 text-emerald-700">
                    <Brain className="w-5 h-5" />
                    <span className="font-semibold">Auto-categorized as "Food & Dining" ✓</span>
                  </div>
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-b from-white via-emerald-50/30 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-50/20 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-gradient-to-r from-pink-100 to-purple-100 text-purple-800 border-purple-200 rounded-full">
              ✨ Magical Features
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-6">
              <span className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Everything You Need for
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-pink-600 bg-clip-text text-transparent">
                Financial Freedom
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Powerful AI meets delightful design to make managing money feel like magic ✨
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 rounded-3xl overflow-hidden group">
              <CardHeader className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-800 mb-3">Multi-Channel Magic</CardTitle>
                <CardDescription className="text-slate-600 text-base leading-relaxed">
                  Text from anywhere - Telegram, WhatsApp, SMS. Your money tracking adapts to your lifestyle 📱
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 rounded-3xl overflow-hidden group">
              <CardHeader className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-800 mb-3">AI That Actually Gets It</CardTitle>
                <CardDescription className="text-slate-600 text-base leading-relaxed">
                  Smart categorization that learns your habits. No training required - it just works 🧠
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 rounded-3xl overflow-hidden group">
              <CardHeader className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-800 mb-3">Insights That Inspire</CardTitle>
                <CardDescription className="text-slate-600 text-base leading-relaxed">
                  Beautiful charts that tell your money story. Discover patterns you never noticed 📊
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 rounded-3xl overflow-hidden group">
              <CardHeader className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-800 mb-3">Fort Knox Security</CardTitle>
                <CardDescription className="text-slate-600 text-base leading-relaxed">
                  Bank-grade encryption keeps your data safer than your actual bank 🛡️
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 rounded-3xl overflow-hidden group">
              <CardHeader className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-800 mb-3">Global Money Tracking</CardTitle>
                <CardDescription className="text-slate-600 text-base leading-relaxed">
                  Any currency, any country. Real-time conversion makes travel spending effortless 🌍
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="bg-gradient-to-br from-teal-50 to-green-50 border-teal-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 rounded-3xl overflow-hidden group">
              <CardHeader className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-green-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-800 mb-3">Goals That Motivate</CardTitle>
                <CardDescription className="text-slate-600 text-base leading-relaxed">
                  Set dreams, track progress, celebrate wins. Your financial coach in your pocket 🎯
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-gradient-to-r from-emerald-50 via-white to-pink-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-slate-800 mb-8">Trusted by thousands worldwide</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600">47K+</div>
                <div className="text-slate-600 font-medium">Happy Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-600">$2.1M</div>
                <div className="text-slate-600 font-medium">Tracked Monthly</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">99.9%</div>
                <div className="text-slate-600 font-medium">Uptime</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center items-center space-x-1 mb-1">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />)}
                </div>
                <div className="text-slate-600 font-medium">App Store Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-gradient-to-b from-white via-yellow-50/30 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 border-orange-200 rounded-full">
              🚀 Super Simple
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-6">
              <span className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                How FinanceFlow
              </span>
              <br />
              <span className="bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 bg-clip-text text-transparent">
                Makes Magic Happen
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Three simple steps to financial clarity. No learning curve, no complicated setup.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 transition-all duration-300">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Just Text About It</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                "Grabbed $25 lunch at that new place downtown 🍔" Send it however feels natural.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 transition-all duration-300">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">AI Works Its Magic</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Amount? ✓ Category? ✓ Location? ✓ Everything organized instantly, no work required.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 transition-all duration-300">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Discover Your Patterns</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Beautiful insights reveal where your money goes. Make smarter decisions effortlessly.
              </p>
            </div>
          </div>

          {/* Quick Testimonial */}
          <div className="mt-20 max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-emerald-50 to-yellow-50 border-emerald-200 rounded-3xl p-8 shadow-2xl">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />)}
                </div>
                <p className="text-xl text-slate-700 mb-6 italic leading-relaxed">
                  "I went from dreading expense tracking to actually enjoying it. FinanceFlow made it so simple that I finally stick to budgeting!"
                </p>
                <div className="font-semibold text-slate-800">Sarah Chen, Product Designer</div>
                <div className="text-slate-600">San Francisco, CA</div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-emerald-600 via-teal-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-transparent to-pink-500/20"></div>
        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative">
          <div className="mb-6">
            <Sparkles className="w-12 h-12 text-yellow-300 mx-auto mb-4" />
          </div>
          <h2 className="text-4xl sm:text-6xl font-extrabold text-white mb-8 leading-tight">
            Ready to Transform Your
            <br />
            <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
              Money Story?
            </span>
          </h2>
          <p className="text-xl sm:text-2xl text-emerald-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join 47,000+ people who've made financial tracking effortless. 
            Start your journey to financial freedom today! ✨
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-emerald-700 hover:bg-yellow-50 text-lg px-12 py-4 rounded-2xl shadow-2xl font-bold">
              <Award className="mr-2 w-5 h-5" />
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-emerald-600 text-lg px-12 py-4 rounded-2xl font-bold">
              Watch Demo Video
            </Button>
          </div>
          <div className="mt-8 text-emerald-100 text-sm">
            💳 No credit card required • 🚀 Setup in 60 seconds • 🔒 Bank-grade security
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">FinanceFlow</span>
              </div>
              <p className="text-slate-400 leading-relaxed mb-4">
                Your AI-powered financial assistant for effortless expense tracking. Making money management magical! ✨
              </p>
              <div className="flex space-x-2">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />)}
                <span className="text-sm text-slate-400 ml-2">4.9/5 rating</span>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 mt-8 text-center text-slate-400">
            <p>&copy; 2024 FinanceFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
