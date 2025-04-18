import React from "react";

export default function SimpleOnboarding() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 p-8 rounded-xl">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Join Contested
        </h1>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="userType" className="block text-sm font-medium text-gray-400">
              I am a:
            </label>
            <select 
              id="userType" 
              className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500"
            >
              <option value="">Please select...</option>
              <option value="athlete">College Athlete</option>
              <option value="business">Business/Brand</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-400">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="Your name"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-400">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="your@email.com"
            />
          </div>
          
          <button
            className="w-full py-3 bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold rounded-lg hover:from-red-700 hover:to-amber-700"
          >
            Continue
          </button>
          
          <p className="text-sm text-center text-gray-400 mt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}