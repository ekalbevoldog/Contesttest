import React from "react";

export default function BasicHome() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Simple Hero Section without any hooks or complex components */}
      <section className="min-h-screen flex flex-col justify-center items-center p-4">
        <h1 className="text-5xl font-bold mb-6 text-center">
          Connecting Athletes & Brands
        </h1>
        
        <p className="text-xl text-gray-300 max-w-2xl text-center mb-8">
          Our platform matches college athletes with brand opportunities.
        </p>
        
        <div className="flex gap-4">
          <a href="/enhanced-onboarding" className="px-6 py-3 bg-red-600 text-white rounded-full font-bold hover:bg-red-700">
            Get Started
          </a>
          
          <a href="#" className="px-6 py-3 bg-gray-800 text-white rounded-full font-bold hover:bg-gray-700">
            Learn More
          </a>
        </div>
      </section>
    </div>
  );
}