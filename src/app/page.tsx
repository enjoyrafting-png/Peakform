'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CricketLogo from '@/components/CricketLogo'
import Image from 'next/image'

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-pattern"></div>
      </div>

      {/* Navigation */}
      <nav className="absolute top-0 w-full z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <CricketLogo size="lg" />
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#features" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">
                  Features
                </a>
                <a href="#about" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">
                  About
                </a>
                <a href="/auth/login" className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Sign In
                </a>
                <a href="/auth/signup" className="text-gray-900 border-2 border-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Sign Up
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className={`space-y-8 ${isLoaded ? 'animate-fade-in-left' : 'opacity-0'}`}>
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                  International Cricket Excellence
                </h1>
              </div>
              <p className="text-xl text-gray-700 max-w-lg">
                Transform your cricket career with data-driven performance analytics, professional training insights, and global recognition opportunities.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="/auth/signup" 
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 px-8 py-4 rounded-lg font-bold text-lg hover:from-yellow-500 hover:to-yellow-700 transition-all transform hover:scale-105 shadow-xl"
                >
                  Start Your Journey
                </a>
                <a 
                  href="/auth/login" 
                  className="border-2 border-blue-600 text-gray-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-600 hover:text-white transition-all transform hover:scale-105"
                >
                  Sign In
                </a>
              </div>

              <div className="grid grid-cols-3 gap-8 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">500+</div>
                  <div className="text-sm text-gray-600">Players</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">50+</div>
                  <div className="text-sm text-gray-600">Countries</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">100%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            </div>

            {/* Right Image - Cricket Player */}
            <div className={`relative ${isLoaded ? 'animate-fade-in-right' : 'opacity-0'}`}>
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-blue-600 rounded-full blur-3xl opacity-30 transform scale-150"></div>
                
                {/* Cricket Ball Decorations */}
                <div className="absolute top-10 right-10 w-8 h-8 bg-red-500 rounded-full shadow-2xl animate-bounce"></div>
                <div className="absolute bottom-20 left-10 w-6 h-6 bg-red-600 rounded-full shadow-2xl animate-pulse"></div>
                
                {/* Main Image Container */}
                <div className="relative bg-gradient-to-br from-blue-800 to-blue-900 rounded-2xl p-1 shadow-2xl">
                  <div className="bg-white rounded-2xl overflow-hidden">
                    {/* Cricket Player Image */}
                    <div className="relative h-96 lg:h-[500px] flex items-center justify-center">
                      <Image
                        src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                        alt="Lord's Cricket Stadium"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                      
                      {/* Overlay Badge */}
                      <div className="absolute top-4 left-4 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-bold">
                        International Player
                      </div>
                      
                      {/* Stats Overlay */}
                      <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-yellow-400 font-bold">Avg 45.2</div>
                            <div className="text-xs text-gray-300">Batting</div>
                          </div>
                          <div>
                            <div className="text-green-400 font-bold">Eco 4.8</div>
                            <div className="text-xs text-gray-300">Bowling</div>
                          </div>
                          <div>
                            <div className="text-blue-400 font-bold">120+</div>
                            <div className="text-xs text-gray-300">Matches</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 bg-yellow-400 text-gray-900 rounded-lg px-3 py-2 text-sm font-bold shadow-xl transform rotate-12">
                  Elite Batter
                </div>
                <div className="absolute -bottom-4 -left-4 bg-blue-400 text-white rounded-lg px-3 py-2 text-sm font-bold shadow-xl transform -rotate-12">
                  Professional Performance
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Elevate Your <span className="text-yellow-600">Cricket Career</span>
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Professional tools designed for international cricket players who demand excellence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="text-yellow-600 text-3xl mb-4"> Cricket Analytics</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Performance Tracking</h3>
              <p className="text-gray-700">
                Advanced analytics for batting, bowling, and fielding metrics with AI-powered insights
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="text-blue-600 text-3xl mb-4"> Training Plans</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Professional Coaching</h3>
              <p className="text-gray-700">
                Customized training programs designed by international cricket experts
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="text-green-600 text-3xl mb-4"> Global Network</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">International Exposure</h3>
              <p className="text-gray-700">
                Connect with scouts, coaches, and teams from around the world
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Players Say
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Hear from international cricket players who have transformed their careers with Peakform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  RS
                </div>
                <div className="ml-4">
                  <h4 className="font-bold text-gray-900">Rahul Sharma</h4>
                  <p className="text-sm text-gray-600">International Batsman</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                &quot;Peakform&apos;s analytics helped me identify my weaknesses and improve my batting average by 15%. The training insights are invaluable for professional cricketers.&quot;
              </p>
              <div className="flex text-yellow-400">
                ★★★★★
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  SP
                </div>
                <div className="ml-4">
                  <h4 className="font-bold text-gray-900">Sarah Patel</h4>
                  <p className="text-sm text-gray-600">All-Rounder</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                &quot;The fitness tracking and performance metrics have been game-changing. I can now monitor my progress and make data-driven decisions about my training.&quot;
              </p>
              <div className="flex text-yellow-400">
                ★★★★★
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  MJ
                </div>
                <div className="ml-4">
                  <h4 className="font-bold text-gray-900">Michael Johnson</h4>
                  <p className="text-sm text-gray-600">Fast Bowler</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                &quot;Peakform connected me with international scouts and helped me get selected for the national team. The platform is essential for any serious cricketer.&quot;
              </p>
              <div className="flex text-yellow-400">
                ★★★★★
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Cricket Career?
          </h2>
          <p className="text-xl text-blue-200 mb-8">
            Join thousands of international cricket players who have elevated their game with Peakform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/auth/signup" 
              className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-500 transition-all transform hover:scale-105 shadow-xl"
            >
              Sign Up
            </a>
            <a 
              href="/auth/login" 
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-blue-800 transition-all transform hover:scale-105"
            >
              Sign In
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
