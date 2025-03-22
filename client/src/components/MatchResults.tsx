import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Bell, Handshake, Star } from "lucide-react";

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
    
  const scoreColor = match.score >= 80 ? 'text-green-600' : match.score >= 60 ? 'text-amber-600' : 'text-red-600';
  const scoreBarColor = match.score >= 80 ? 'bg-green-600' : match.score >= 60 ? 'bg-amber-600' : 'bg-red-600';

  return (
    <div className={`bg-white shadow overflow-hidden rounded-lg border ${animate ? 'border-primary-500 animate-pulse' : 'border-gray-200'}`}>
      <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-primary-700 to-primary-500 text-white">
        <div className="flex items-center">
          {isNewMatch && animate && (
            <div className="mr-2 animate-bounce">
              <Bell className="h-5 w-5" />
            </div>
          )}
          <div>
            <h3 className="text-lg leading-6 font-medium flex items-center">
              Contested Match Alert!
              {!animate && <Badge className="ml-2 bg-green-500 hover:bg-green-600">Live Match</Badge>}
            </h3>
            <p className="mt-1 max-w-2xl text-sm">Connecting mid-tier athletes with SMBs that matter</p>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <Star className="mr-2 h-4 w-4 text-yellow-500" />
              Match Score
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <div className="flex items-center">
                <span className={`text-2xl font-bold ${scoreColor}`}>{match.score}</span>
                <span className="ml-2 text-sm text-gray-500">/ 100</span>
                <div className="ml-4 bg-gray-200 rounded-full h-3 w-full max-w-xs">
                  <div 
                    className={`${scoreBarColor} h-3 rounded-full transition-all duration-1000 ease-out`} 
                    style={{ width: animate ? '0%' : `${match.score}%` }}
                  ></div>
                </div>
              </div>
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <Handshake className="mr-2 h-4 w-4 text-primary-500" />
              {userType === 'athlete' ? 'Brand Partner' : 'Athlete'}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-medium">{displayName}</dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Campaign Concept</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <p className="font-medium mb-1 text-primary-700">"{match.campaign.title}"</p>
              <p>{match.campaign.description}</p>
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Deliverables</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <div className="flex flex-wrap gap-2">
                {match.campaign.deliverables.map((deliverable, index) => (
                  <Badge key={index} variant="outline" className="flex items-center bg-primary-50 text-primary-700 border-primary-200">
                    <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                    {deliverable}
                  </Badge>
                ))}
              </div>
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Why This Match Works</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <p className="italic">{match.reason}</p>
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Next Steps</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600">
                  Express Interest
                </Button>
                <Button variant="outline">
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
