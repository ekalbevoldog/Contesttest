import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { ChevronLeft, ExternalLink, RefreshCw, Twitter } from "lucide-react";
import { SiInstagram, SiTiktok, SiFacebook } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";

interface SocialHandle {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
  [key: string]: string | undefined;
}

interface ProfileButton {
  id: string;
  label: string;
  url: string;
  type?: string;
}

interface SocialMetrics {
  followers: number;
  engagement: number;
  posts?: number;
  tweets?: number;
  videos?: number;
  reachPerPost?: number;
  impressions?: number;
  views?: number;
  likes?: number;
  shares?: number;
  savedPosts?: number;
  retweets?: number;
  weeklyGrowth: number;
}

interface ProfileMetrics {
  followerCount: number;
  engagement: number;
  contentQuality: number;
  instagramMetrics?: SocialMetrics;
  twitterMetrics?: SocialMetrics;
  tiktokMetrics?: SocialMetrics;
}

interface AthleteProfile {
  id: number;
  name: string;
  sport: string;
  school: string;
  profileLinkEnabled: boolean;
  profileLinkId: string;
  profileLinkBio: string;
  profileLinkPhotoUrl: string;
  profileLinkTheme: string;
  profileLinkBackgroundColor: string;
  profileLinkTextColor: string;
  profileLinkAccentColor: string;
  socialHandles: SocialHandle;
  profileLinkButtons: ProfileButton[];
  metrics?: ProfileMetrics;
}

export default function AthleteProfileLink() {
  const { linkId } = useParams();
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await apiRequest("GET", `/api/athlete-profile/${linkId}`);
        const data = await res.json();
        
        if (data.error) {
          setError(data.error);
          setLoading(false);
          return;
        }
        
        setProfile(data);
        setLoading(false);
      } catch (err) {
        setError("Could not load profile. Please try again later.");
        setLoading(false);
      }
    }

    fetchProfile();
  }, [linkId]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile || !profile.profileLinkEnabled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center"
           style={{ backgroundColor: "#111", color: "#fff" }}>
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4">
            {error || "This profile doesn't exist or is not available."}
          </h1>
          <p className="mb-8">The link you followed may be broken, or the profile may have been removed.</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="border-white text-white hover:bg-white/10"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Apply profile theme colors
  const bgColor = profile.profileLinkBackgroundColor || "#111111";
  const textColor = profile.profileLinkTextColor || "#ffffff";
  const accentColor = profile.profileLinkAccentColor || "#ff4500";

  // Social media icon mapping
  const socialIcons: Record<string, React.ReactNode> = {
    instagram: <SiInstagram className="h-5 w-5" />,
    facebook: <SiFacebook className="h-5 w-5" />, 
    twitter: <Twitter className="h-5 w-5" />,
    tiktok: <SiTiktok className="h-5 w-5" />
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4"
         style={{ 
           background: `linear-gradient(140deg, ${bgColor} 0%, #111 100%)`, 
           color: textColor 
         }}>
      {/* Header banner */}
      <div className="w-full max-w-md mb-6 relative">
        <div className="absolute top-0 left-0 w-full h-6 bg-gradient-to-r from-red-600 to-amber-500"></div>
        <div className="w-full h-32 bg-gradient-to-r from-black to-zinc-900 pt-7 px-5">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-gradient-to-b from-red-600 to-amber-500"></div>
            <h2 className="uppercase text-sm font-bold tracking-widest">Athlete Profile</h2>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-amber-500">
              {profile.name}
            </span>
          </h1>
        </div>
      </div>
      
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Profile header */}
        <div className="relative w-full flex justify-center mb-6">
          <div 
            className="h-28 w-28 rounded-full transform -translate-y-5 overflow-hidden"
            style={{
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              border: `4px solid ${accentColor}`,
            }}
          >
            <Avatar className="h-full w-full">
              <AvatarImage src={profile.profileLinkPhotoUrl} alt={profile.name} />
              <AvatarFallback style={{ 
                background: `linear-gradient(135deg, ${accentColor} 0%, #111 150%)` 
              }}>
                {profile.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg font-semibold">{profile.sport}</h2>
          <span className="text-zinc-400">•</span>
          <h2 className="text-lg font-semibold">{profile.school}</h2>
        </div>
        
        {profile.profileLinkBio && (
          <p className="text-center mb-6 px-4 max-w-sm text-zinc-300">{profile.profileLinkBio}</p>
        )}
        
        {/* Metrics Section - Live Stats */}
        <div className="w-full mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="uppercase text-xs font-semibold tracking-wider text-white">Live Performance Metrics</h3>
            <button
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
              onClick={async () => {
                try {
                  const res = await apiRequest("GET", `/api/athlete-profile/${linkId}/refresh-metrics`);
                  const data = await res.json();
                  if (data.metrics) {
                    setProfile({
                      ...profile,
                      metrics: data.metrics
                    });
                  }
                } catch (err) {
                  console.error("Failed to refresh metrics", err);
                }
              }}
            >
              <RefreshCw size={12} className="animate-spin" />
              <span>Refresh</span>
            </button>
          </div>
          
          {/* Overview stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-black/30 rounded-lg border border-zinc-800 mb-3">
            <div className="text-center">
              <div className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-amber-500">
                {profile.metrics?.followerCount ? new Intl.NumberFormat('en-US', { 
                  notation: 'compact', 
                  maximumFractionDigits: 1 
                }).format(profile.metrics.followerCount) : '0'}
              </div>
              <div className="text-xs text-white">Total Followers</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-amber-500">
                {profile.metrics?.engagement ? `${profile.metrics.engagement}%` : '0%'}
              </div>
              <div className="text-xs text-white">Engagement</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-amber-500">
                {profile.metrics?.contentQuality ? `${profile.metrics.contentQuality}/10` : '0/10'}
              </div>
              <div className="text-xs text-white">Content Score</div>
            </div>
          </div>
          
          {/* Platform-specific stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {profile.metrics?.instagramMetrics && (
              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-lg border border-purple-900/50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <SiInstagram className="text-pink-500" size={16} />
                  <span className="text-xs font-semibold text-white">Instagram</span>
                </div>
                <div className="text-lg font-bold text-white">
                  {new Intl.NumberFormat('en-US', { 
                    notation: 'compact', 
                    maximumFractionDigits: 1 
                  }).format(profile.metrics.instagramMetrics.followers)}
                </div>
                <div className="text-xs text-white mt-1 flex justify-between">
                  <span><strong>Engagement:</strong> {profile.metrics.instagramMetrics.engagement}%</span>
                  <span><strong>Posts:</strong> {profile.metrics.instagramMetrics.posts}</span>
                </div>
                <div className="mt-2 text-xs text-white">
                  <span className="text-green-400 font-bold">↑{profile.metrics.instagramMetrics.weeklyGrowth}%</span> weekly growth
                </div>
              </div>
            )}
            
            {profile.metrics?.twitterMetrics && (
              <div className="bg-gradient-to-br from-blue-900/40 to-sky-900/40 rounded-lg border border-blue-900/50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Twitter className="text-sky-500" size={16} />
                  <span className="text-xs font-semibold text-white">Twitter</span>
                </div>
                <div className="text-lg font-bold text-white">
                  {new Intl.NumberFormat('en-US', { 
                    notation: 'compact', 
                    maximumFractionDigits: 1 
                  }).format(profile.metrics.twitterMetrics.followers)}
                </div>
                <div className="text-xs text-white mt-1 flex justify-between">
                  <span><strong>Engagement:</strong> {profile.metrics.twitterMetrics.engagement}%</span>
                  <span><strong>Tweets:</strong> {profile.metrics.twitterMetrics.tweets}</span>
                </div>
                <div className="mt-2 text-xs text-white">
                  <span className="text-green-400 font-bold">↑{profile.metrics.twitterMetrics.weeklyGrowth}%</span> weekly growth
                </div>
              </div>
            )}
            
            {profile.metrics?.tiktokMetrics && (
              <div className="bg-gradient-to-br from-gray-900/40 to-black/40 rounded-lg border border-gray-800 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <SiTiktok className="text-white" size={16} />
                  <span className="text-xs font-semibold text-white">TikTok</span>
                </div>
                <div className="text-lg font-bold text-white">
                  {new Intl.NumberFormat('en-US', { 
                    notation: 'compact', 
                    maximumFractionDigits: 1 
                  }).format(profile.metrics.tiktokMetrics.followers)}
                </div>
                <div className="text-xs text-white mt-1 flex justify-between">
                  <span><strong>Engagement:</strong> {profile.metrics.tiktokMetrics.engagement}%</span>
                  <span><strong>Videos:</strong> {profile.metrics.tiktokMetrics.videos}</span>
                </div>
                <div className="mt-2 text-xs text-white">
                  <span className="text-green-400 font-bold">↑{profile.metrics.tiktokMetrics.weeklyGrowth}%</span> weekly growth
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Social media links */}
        {profile.socialHandles && Object.keys(profile.socialHandles).length > 0 && (
          <div className="w-full mb-6">
            <h3 className="uppercase text-xs font-semibold tracking-wider mb-3 text-white">Connect On Social</h3>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(profile.socialHandles).map(([platform, handle]) => 
                handle ? (
                  <a
                    key={platform}
                    href={getSocialUrl(platform, handle)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 p-2 rounded-md transition-transform hover:scale-105"
                    style={{ 
                      background: 'linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(0,0,0,0.1))',
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                      borderLeft: '1px solid rgba(255,255,255,0.05)',
                      borderBottom: '1px solid rgba(0,0,0,0.3)',
                      borderRight: '1px solid rgba(0,0,0,0.1)'
                    }}
                    aria-label={`${platform} profile`}
                  >
                    <div className="p-2 rounded-full" style={{ 
                      background: `linear-gradient(135deg, ${accentColor} 0%, rgba(0,0,0,0.5) 150%)` 
                    }}>
                      {socialIcons[platform]}
                    </div>
                    <span className="text-xs">{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                  </a>
                ) : null
              )}
            </div>
          </div>
        )}
        
        {/* Custom link buttons */}
        <div className="w-full space-y-3">
          <h3 className="uppercase text-xs font-semibold tracking-wider mb-3 text-white">Featured Content</h3>
          {profile.profileLinkButtons?.map((button) => (
            <a
              key={button.id}
              href={button.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full p-3 rounded-md transition-transform hover:scale-105"
              style={{ 
                background: `linear-gradient(to right, rgba(0,0,0,0.3), ${accentColor}10)`,
                borderLeft: `3px solid ${accentColor}`,
                color: textColor,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              <span className="font-medium">{button.label}</span>
              <ExternalLink className="h-4 w-4 opacity-70" />
            </a>
          ))}
        </div>
        
        {/* Contact for Partnerships Banner */}
        <div className="w-full mt-8 p-4 bg-gradient-to-r from-red-600/20 to-amber-500/20 rounded-lg border border-red-600/30 text-center">
          <h3 className="font-semibold text-sm mb-1 text-white">Interested in a Partnership?</h3>
          <p className="text-xs text-white mb-2">Connect through the Contested platform for verified NIL opportunities</p>
          <a href="/" className="inline-block text-xs px-4 py-2 rounded font-medium bg-gradient-to-r from-red-600 to-amber-500 text-white hover:from-red-500 hover:to-amber-400 transition-colors">
            Contact via Contested
          </a>
        </div>
        
        {/* Footer */}
        <div className="mt-12 text-center text-sm">
          <p>Powered by <a href="/" className="font-semibold text-white hover:text-red-500 transition-colors">Contested</a></p>
        </div>
      </div>
    </div>
  );
}

function getSocialUrl(platform: string, handle: string): string {
  // Remove @ if present
  const username = handle.startsWith('@') ? handle.substring(1) : handle;
  
  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${username}`;
    case 'facebook':
      return `https://facebook.com/${username}`;
    case 'twitter':
      return `https://twitter.com/${username}`;
    case 'tiktok':
      return `https://tiktok.com/@${username}`;
    default:
      return handle.startsWith('http') ? handle : `https://${handle}`;
  }
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 bg-black text-white">
      <div className="w-full max-w-md flex flex-col items-center">
        <Skeleton className="h-24 w-24 rounded-full mb-4" />
        <Skeleton className="h-8 w-48 mb-1" />
        <Skeleton className="h-6 w-64 mb-3" />
        <Skeleton className="h-20 w-full max-w-sm mb-6" />
        
        <div className="flex gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-10 w-10 rounded-full" />
          ))}
        </div>
        
        <div className="w-full space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}