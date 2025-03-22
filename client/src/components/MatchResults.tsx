import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Bell, Handshake, Star, Zap } from "lucide-react";

type MatchResultsProps = {
  match: {
    id?: string;
    score: number;
    brand?: string;
    athleteName?: string;
    campaign: {
      title: string;
      description: string;
      deliverables: string[];
    };
    reason: string;
    business?: {
      name: string;
    };
    athlete?: {
      name: string;
    };
  };
  userType?: string;
  isNewMatch?: boolean;
};

export default function MatchResults({ match, userType, isNewMatch = false }: MatchResultsProps) {
  const [animate, setAnimate] = useState(isNewMatch);
  
  // Add animation when the component first renders if it's a new match
  useEffect(() => {
    if (isNewMatch) {
      // Start with animation and remove it after a delay
      const timeout = setTimeout(() => {
        setAnimate(false);
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [isNewMatch]);
  
  const displayName = userType === 'athlete' ? 
    (match.business?.name || match.brand || 'Brand') : 
    (match.athlete?.name || match.athleteName || 'Athlete');
    
  const scoreColor = match.score >= 80 ? 'text-teal-500' : match.score >= 60 ? 'sports-accent' : 'text-red-600';
  const scoreBarColor = match.score >= 80 ? 'bg-gradient-to-r from-blue-500 to-teal-400' : match.score >= 60 ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 'bg-gradient-to-r from-red-500 to-pink-500';

  return (
    <div className={`futuristic-card ${animate ? 'animate-pulse' : ''}`}>
      <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-[#003366] to-[#0066cc] text-white">
        <div className="flex items-center">
          {isNewMatch && animate && (
            <div className="mr-2 animate-bounce">
              <Bell className="h-5 w-5 text-[#00ffcc]" />
            </div>
          )}
          <div>
            <h3 className="text-lg leading-6 font-bold flex items-center">
              <Zap className="inline-block mr-2 h-5 w-5 text-[#00ffcc]" />
              Contested Match Alert!
              {!animate && <Badge className="ml-2 bg-[#00ffcc] text-[#003366] hover:bg-[#00e6b8]">Live Match</Badge>}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-blue-100">Connecting mid-tier athletes with SMBs that matter</p>
          </div>
        </div>
      </div>
      <div className="border-t border-blue-100">
        <dl>
          <div className="bg-[rgba(0,255,204,0.03)] px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium dark-contrast flex items-center">
              <Star className="mr-2 h-4 w-4 text-[#ff9500]" />
              Match Score
            </dt>
            <dd className="mt-1 text-sm dark-contrast sm:mt-0 sm:col-span-2">
              <div className="flex items-center">
                <span className={`text-3xl font-bold ${scoreColor}`}>{match.score}</span>
                <span className="ml-2 text-sm text-gray-500">/ 100</span>
                <div className="ml-4 bg-gray-100 rounded-full h-4 w-full max-w-xs overflow-hidden">
                  <div 
                    className={`${scoreBarColor} h-4 rounded-full transition-all duration-1000 ease-out`} 
                    style={{ width: animate ? '0%' : `${match.score}%` }}
                  ></div>
                </div>
              </div>
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium dark-contrast flex items-center">
              <Handshake className="mr-2 h-4 w-4 tech-text" />
              {userType === 'athlete' ? 'Brand Partner' : 'Athlete'}
            </dt>
            <dd className="mt-1 text-sm dark-contrast sm:mt-0 sm:col-span-2 font-bold sports-highlight">{displayName}</dd>
          </div>
          <div className="bg-[rgba(0,255,204,0.03)] px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium dark-contrast">Campaign Concept</dt>
            <dd className="mt-1 text-sm dark-contrast sm:mt-0 sm:col-span-2">
              <p className="font-bold mb-1 tech-text">"{match.campaign.title}"</p>
              <p>{match.campaign.description}</p>
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium dark-contrast">Deliverables</dt>
            <dd className="mt-1 text-sm dark-contrast sm:mt-0 sm:col-span-2">
              <div className="flex flex-wrap gap-2">
                {match.campaign.deliverables.map((deliverable, index) => (
                  <Badge key={index} variant="outline" className="flex items-center bg-[rgba(0,163,255,0.1)] text-[#003366] border-[#00a3ff]">
                    <CheckCircle className="mr-1 h-3 w-3 text-[#00ffcc]" />
                    {deliverable}
                  </Badge>
                ))}
              </div>
            </dd>
          </div>
          <div className="bg-[rgba(0,255,204,0.03)] px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium dark-contrast">Why This Match Works</dt>
            <dd className="mt-1 text-sm dark-contrast sm:mt-0 sm:col-span-2">
              <p className="italic">{match.reason}</p>
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium dark-contrast">Next Steps</dt>
            <dd className="mt-1 text-sm dark-contrast sm:mt-0 sm:col-span-2">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="bg-gradient-to-r from-[#0066cc] to-[#00a3ff] hover:from-[#005bb8] hover:to-[#0091e6]">
                  Express Interest
                </Button>
                <Button variant="outline" className="border-[#00a3ff] text-[#003366] hover:bg-[rgba(0,163,255,0.1)]">
                  View More Matches
                </Button>
              </div>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
