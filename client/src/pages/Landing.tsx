import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Brain, BarChart3, Shield } from 'lucide-react';

export default function Landing() {
  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Home className="h-16 w-16 text-primary mr-4" />
            <div>
              <h1 className="text-5xl font-bold text-gray-900">AIR System</h1>
              <p className="text-xl text-gray-600 mt-2">Analytic Intelligent Room</p>
            </div>
          </div>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
            Advanced environmental monitoring and analysis system for optimal room conditions. 
            Monitor temperature, humidity, air quality, noise levels, and lighting in real-time with AI-powered recommendations.
          </p>
          <Button size="lg" onClick={handleLogin} className="px-8 py-3 text-lg">
            Sign In to Continue
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Real-time Monitoring</CardTitle>
              <CardDescription>
                Monitor environmental conditions across multiple rooms with live data updates every 30 seconds.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>AI-Powered Analysis</CardTitle>
              <CardDescription>
                Get intelligent insights and recommendations based on environmental data patterns and machine learning.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Smart Alerts</CardTitle>
              <CardDescription>
                Receive automated notifications when environmental conditions require attention or immediate action.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Environmental Parameters */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Comprehensive Environmental Monitoring</h2>
          <div className="grid md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌡️</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Temperature</h3>
              <p className="text-sm text-gray-600">Monitor room temperature in Celsius with optimal range detection</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💧</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Humidity</h3>
              <p className="text-sm text-gray-600">Track moisture levels for optimal comfort and health</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔊</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Noise Level</h3>
              <p className="text-sm text-gray-600">Measure ambient noise in decibels for productivity</p>
            </div>
            
            <div className="text-center">
              <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Light Intensity</h3>
              <p className="text-sm text-gray-600">Monitor lighting levels in lux for visual comfort</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌬️</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Air Quality</h3>
              <p className="text-sm text-gray-600">Track PM2.5 particles for healthy breathing environment</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Optimize Your Environment?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of users who trust AIR System for intelligent environmental monitoring.
          </p>
          <Button size="lg" onClick={handleLogin} className="px-8 py-3 text-lg">
            Get Started Now
          </Button>
        </div>
      </div>
    </div>
  );
}
