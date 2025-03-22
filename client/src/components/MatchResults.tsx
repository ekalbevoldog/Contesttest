import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

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
};

export default function MatchResults({ match, userType }: MatchResultsProps) {
  const displayName = userType === 'athlete' ? 
    (match.business?.name || match.brand || 'Brand') : 
    (match.athlete?.name || match.athleteName || 'Athlete');

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:px-6 bg-primary-600 text-white">
        <h3 className="text-lg leading-6 font-medium">Your Top NIL Match</h3>
        <p className="mt-1 max-w-2xl text-sm">Based on profile alignment and campaign goals</p>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Match Score</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <div className="flex items-center">
                <span className="text-xl font-bold text-primary-600">{match.score}</span>
                <span className="ml-2 text-sm text-gray-500">/ 100</span>
                <div className="ml-4 bg-gray-200 rounded-full h-2.5 w-48">
                  <div 
                    className="bg-primary-600 h-2.5 rounded-full" 
                    style={{ width: `${match.score}%` }}
                  ></div>
                </div>
              </div>
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">{userType === 'athlete' ? 'Brand' : 'Athlete'}</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{displayName}</dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Campaign Concept</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <p className="font-medium mb-1">"{match.campaign.title}"</p>
              <p>{match.campaign.description}</p>
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Deliverables</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                {match.campaign.deliverables.map((deliverable, index) => (
                  <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                    <div className="w-0 flex-1 flex items-center">
                      <CheckCircle className="flex-shrink-0 h-5 w-5 text-gray-400" />
                      <span className="ml-2 flex-1 w-0 truncate">{deliverable}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Why This Match Works</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <p>{match.reason}</p>
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Next Steps</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <div className="flex space-x-3">
                <Button>
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
