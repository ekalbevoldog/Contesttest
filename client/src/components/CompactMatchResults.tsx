import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, ChevronRight, Star } from "lucide-react";

// Define match result type
export interface MatchResult {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  matchScore: number;
  description?: string;
  tags?: string[];
}

interface CompactMatchResultsProps {
  results: MatchResult[];
  onViewDetails?: (id: string) => void;
  maxHeight?: string;
  emptyMessage?: string;
}

const CompactMatchResults: React.FC<CompactMatchResultsProps> = ({
  results = [],
  onViewDetails,
  maxHeight = "300px",
  emptyMessage = "No matches found"
}) => {
  if (!results.length) {
    return (
      <Card className="w-full p-4 flex items-center justify-center">
        <p className="text-muted-foreground text-center">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Matched Results</CardTitle>
        <CardDescription>
          {results.length} potential {results.length === 1 ? 'match' : 'matches'} found
        </CardDescription>
      </CardHeader>
      <ScrollArea className={`w-full overflow-auto`} style={{ maxHeight }}>
        <CardContent className="p-3 pt-0">
          <div className="space-y-2">
            {results.map((result) => (
              <Card key={result.id} className="overflow-hidden border border-muted">
                <div className="flex items-center p-3 gap-3">
                  <Avatar className="h-10 w-10 border">
                    {result.avatar ? (
                      <AvatarImage src={result.avatar} alt={result.name} />
                    ) : (
                      <AvatarFallback>
                        {result.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium truncate">
                        {result.name}
                      </h4>
                      <div className="flex items-center">
                        <span className="text-xs font-medium text-amber-500 flex items-center">
                          <Star className="h-3 w-3 mr-1 fill-amber-500" />
                          {result.matchScore}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center text-xs text-muted-foreground gap-2">
                      <Badge variant="outline" className="px-1 py-0 text-xs">
                        {result.role}
                      </Badge>
                      {result.description && (
                        <span className="truncate">{result.description}</span>
                      )}
                    </div>

                    {result.tags && result.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="px-1 py-0 text-[10px] h-4"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {result.tags.length > 3 && (
                          <Badge
                            variant="outline"
                            className="px-1 py-0 text-[10px] h-4"
                          >
                            +{result.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {onViewDetails && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => onViewDetails(result.id)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </ScrollArea>
      <CardFooter className="flex justify-between border-t p-3">
        <div className="text-xs text-muted-foreground">
          <Check className="inline-block h-3 w-3 mr-1" />
          Match algorithm results
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs">
          View all
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CompactMatchResults;