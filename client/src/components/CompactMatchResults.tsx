import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CheckCircle, Bell, Handshake, Star, Zap, Trophy, Bolt, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";

type CompactMatchResultsProps = {
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

export default function CompactMatchResults({ match, userType, isNewMatch = false }: CompactMatchResultsProps) {
  const [scorePercent, setScorePercent] = useState(0);
  
  useEffect(() => {
    // Animate the score
    const timer = setTimeout(() => {
      setScorePercent(match.score);
    }, 200);
    
    return () => clearTimeout(timer);
  }, [match.score]);
  
  return (
    <div className="match-card w-full max-w-md mx-auto overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm" style={{ maxWidth: "100%" }}>
      {/* Header with reduced height */}
      <div className="bg-gradient-to-r from-[#003366] to-[#0066cc] text-white p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {isNewMatch && (
              <div className="relative mr-2">
                <Bell className="h-4 w-4 text-white" />
                <span className="notification-dot -top-1 -right-1"></span>
              </div>
            )}
            <div>
              <h3 className="text-base leading-5 font-bold flex items-center">
                <Trophy className="inline-block mr-1 h-4 w-4 text-[#ff9500]" />
                Match Alert
              </h3>
              <p className="text-xs text-blue-100">Partnership Opportunity</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div 
              className="match-score-ring h-10 w-10"
              style={{ 
                '--percentage': `${scorePercent}%` 
              } as React.CSSProperties}
            >
              <div className="relative z-10 flex items-center justify-center h-full w-full">
                <span className="text-sm font-bold text-[#003366]">{match.score}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Match quality indicator */}
      <div className="px-3 py-2 flex items-center justify-between bg-gradient-to-r from-[rgba(0,163,255,0.05)] to-[rgba(0,255,204,0.02)]">
        <div className="flex items-center">
          <span className="connection-badge text-xs py-0.5 px-2">
            <Bolt className="h-3 w-3 mr-1" />
            {match.score >= 80 ? 'Perfect Match' : match.score >= 60 ? 'Strong Match' : 'Potential Match'}
          </span>
        </div>
      </div>
      
      {/* Content with reduced padding */}
      <div className="p-3">
        <div className="grid grid-cols-1 gap-2">
          {/* Brand/Athlete info */}
          <div className="flex items-center">
            <div className="w-1/3">
              <span className="sport-tech-badge text-xs py-0.5 px-2">
                <Handshake className="mr-1 h-3 w-3" />
                {userType === 'athlete' ? 'Brand' : 'Athlete'}
              </span>
            </div>
            <div className="w-2/3">
              <span className="font-medium text-sm text-gray-900">
                {userType === 'athlete' 
                  ? match.business?.name || match.brand 
                  : match.athlete?.name || match.athleteName}
              </span>
            </div>
          </div>
          
          {/* Campaign info */}
          <div className="flex items-center">
            <div className="w-1/3">
              <span className="sport-tech-badge text-xs py-0.5 px-2">
                <Zap className="mr-1 h-3 w-3" />
                Campaign
              </span>
            </div>
            <div className="w-2/3">
              <span className="font-medium text-sm text-gray-900">{match.campaign.title}</span>
            </div>
          </div>
          
          {/* Campaign description - more compact */}
          <div className="border-t border-gray-200 pt-2 mt-1">
            <h4 className="font-medium text-xs text-gray-700 mb-1">Campaign Description</h4>
            <p className="text-xs text-gray-600">{match.campaign.description.length > 80 
              ? `${match.campaign.description.substring(0, 80)}...` 
              : match.campaign.description}
            </p>
          </div>
          
          {/* Deliverables - more compact */}
          <div>
            <h4 className="font-medium text-xs text-gray-700 mb-1">Deliverables</h4>
            <div className="grid grid-cols-1 gap-1">
              {match.campaign.deliverables.slice(0, 2).map((deliverable, index) => (
                <div key={index} className="flex items-center text-xs">
                  <CheckCircle className="h-3 w-3 text-[#00a3ff] mr-1 flex-shrink-0" />
                  <span>{deliverable}</span>
                </div>
              ))}
              {match.campaign.deliverables.length > 2 && (
                <div className="text-xs text-[#00a3ff]">+{match.campaign.deliverables.length - 2} more</div>
              )}
            </div>
          </div>
          
          {/* Match reason - more compact */}
          <div className="border-t border-gray-200 pt-2 mt-1">
            <h4 className="font-medium text-xs text-gray-700 mb-1">Why We Matched</h4>
            <p className="text-xs text-gray-600">{match.reason.length > 100 
              ? `${match.reason.substring(0, 100)}...` 
              : match.reason}
            </p>
          </div>
          
          {/* Action buttons */}
          <div className="mt-3 pt-2 border-t border-[#e0f2ff]">
            <div className="flex gap-2">
              <Button size="sm" className="bg-gradient-to-r from-[#0066cc] to-[#00a3ff] hover:from-[#005bb8] hover:to-[#0091e6] flex items-center text-xs h-8 py-0 px-3">
                Express Interest
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" className="border-[#00a3ff] text-[#003366] hover:bg-[rgba(0,163,255,0.1)] text-xs h-8 py-0 px-3">
                View Details
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}