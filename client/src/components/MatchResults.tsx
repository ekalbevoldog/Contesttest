import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CheckCircle, Bell, Handshake, Star, Zap, Trophy, Bolt, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";

function MatchCard({ match, onAccept }) {
  return (
    <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{match.brand}</h3>
        <Badge variant="outline" className="text-lg">
          {match.score}% Match
        </Badge>
      </div>
      
      <div className="space-y-2">
        <p className="text-muted-foreground">{match.reason}</p>
        <div className="bg-accent/10 p-4 rounded-md">
          <h4 className="font-medium mb-2">{match.campaign.title}</h4>
          <p className="text-sm text-muted-foreground">{match.campaign.description}</p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm">
          View Details
        </Button>
        <Button onClick={() => onAccept(match)} size="sm">
          Accept Match
        </Button>
      </div>
    </Card>
  );
}

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
  const [scorePercent, setScorePercent] = useState(isNewMatch ? 0 : match.score);
  
  // Add animation when the component first renders if it's a new match
  useEffect(() => {
    if (isNewMatch) {
      // Start with animation and remove it after a delay
      const timeout = setTimeout(() => {
        setAnimate(false);
      }, 3000);
      
      // Animate the score percentage
      const scoreTimeout = setTimeout(() => {
        setScorePercent(match.score);
      }, 500);
      
      return () => {
        clearTimeout(timeout);
        clearTimeout(scoreTimeout);
      };
    }
  }, [isNewMatch, match.score]);
  
  const displayName = userType === 'athlete' ? 
    (match.business?.name || match.brand || 'Brand') : 
    (match.athlete?.name || match.athleteName || 'Athlete');
    
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-[#f03c3c] to-[#ff5c5c]';
    if (score >= 60) return 'from-[#ff5c5c] to-[#ff9966]';
    return 'from-[#ff9966] to-[#ffcc99]';
  };

  return (
    <div className={`match-card ${animate ? 'animate-pulse' : ''}`}>
      <div className="px-5 py-5 sm:px-6 bg-gradient-to-r from-[#000000] to-[#1a1a1a] text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {isNewMatch && (
              <div className="relative mr-3">
                <Bell className="h-5 w-5 text-[#f03c3c]" />
                <span className="notification-dot -top-1 -right-1"></span>
              </div>
            )}
            <div>
              <h3 className="text-lg leading-6 font-bold flex items-center">
                <Trophy className="inline-block mr-2 h-5 w-5 text-[#f03c3c]" />
                Match Alert
              </h3>
              <p className="mt-1 text-sm text-gray-300">Partnership Opportunity</p>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center">
            <div 
              className="match-score-ring h-14 w-14"
              style={{ 
                '--percentage': `${scorePercent}%` 
              } as React.CSSProperties}
            >
              <div className="relative z-10 flex items-center justify-center h-full w-full">
                <span className="text-lg font-bold text-white">{match.score}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-5 py-3 flex items-center justify-between bg-gradient-to-r from-[rgba(240,60,60,0.05)] to-[rgba(255,92,92,0.02)]">
        <div className="flex items-center">
          <span className="connection-badge">
            <Bolt className="h-3 w-3 mr-1 text-[#f03c3c]" />
            {match.score >= 80 ? 'Perfect Match' : match.score >= 60 ? 'Strong Match' : 'Potential Match'}
          </span>
        </div>
        
        <div className="flex sm:hidden items-center">
          <div className="text-sm">Score: <span className="text-[#f03c3c] font-medium">{match.score}</span></div>
        </div>
      </div>
      
      <div className="p-5">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="mb-2 sm:mb-0 sm:w-1/3">
              <span className="bg-[rgba(240,60,60,0.15)] text-white px-2 py-1 rounded-md text-xs font-medium flex items-center w-fit">
                <Handshake className="mr-1 h-4 w-4 text-[#f03c3c]" />
                {userType === 'athlete' ? 'Brand Partner' : 'Athlete'}
              </span>
            </div>
            <div className="sm:w-2/3">
              <h4 className="text-base font-semibold sports-highlight text-lg">{displayName}</h4>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-start mt-2">
            <div className="mb-2 sm:mb-0 sm:w-1/3">
              <span className="bg-[rgba(240,60,60,0.15)] text-white px-2 py-1 rounded-md text-xs font-medium flex items-center w-fit">
                <Star className="mr-1 h-4 w-4 text-[#f03c3c]" />
                Campaign
              </span>
            </div>
            <div className="sm:w-2/3">
              <h4 className="text-base font-semibold tech-text mb-1">{match.campaign.title}</h4>
              <p className="text-sm dark-contrast">{match.campaign.description}</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-start mt-2">
            <div className="mb-2 sm:mb-0 sm:w-1/3">
              <span className="bg-[rgba(240,60,60,0.15)] text-white px-2 py-1 rounded-md text-xs font-medium flex items-center w-fit">
                <CheckCircle className="mr-1 h-4 w-4 text-[#f03c3c]" />
                Deliverables
              </span>
            </div>
            <div className="sm:w-2/3">
              <div className="flex flex-wrap gap-2">
                {match.campaign.deliverables.map((deliverable, index) => (
                  <Badge key={index} className="bg-[rgba(240,60,60,0.08)] hover:bg-[rgba(240,60,60,0.15)] text-white border-[#f03c3c]/20">
                    {deliverable}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-start mt-2">
            <div className="mb-2 sm:mb-0 sm:w-1/3">
              <span className="bg-[rgba(240,60,60,0.15)] text-white px-2 py-1 rounded-md text-xs font-medium flex items-center w-fit">
                <Zap className="mr-1 h-4 w-4 text-[#f03c3c]" />
                Why It Works
              </span>
            </div>
            <div className="sm:w-2/3">
              <p className="text-sm dark-contrast">{match.reason}</p>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-[#333]">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="bg-gradient-to-r from-[#f03c3c] to-[#ff5c5c] hover:from-[#d42e2e] hover:to-[#e34c4c] flex items-center">
                Express Interest
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
              <Button variant="outline" className="border-[#f03c3c] text-white hover:bg-[rgba(240,60,60,0.1)]">
                View More Matches
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
