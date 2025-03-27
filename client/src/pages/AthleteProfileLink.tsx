import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { ChevronLeft, ExternalLink, Instagram, Facebook, Twitter } from "lucide-react";
import { SiTiktok } from "react-icons/si";
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
}

export default function AthleteProfileLink() {
  const { linkId } = useParams();
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await apiRequest("GET", `/api/athlete-profiles/${linkId}`);
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
    instagram: <Instagram className="h-5 w-5" />,
    facebook: <Facebook className="h-5 w-5" />, 
    twitter: <Twitter className="h-5 w-5" />,
    tiktok: <SiTiktok className="h-5 w-5" />
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4"
         style={{ backgroundColor: bgColor, color: textColor }}>
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Profile header */}
        <Avatar className="h-24 w-24 mb-4 border-2" style={{ borderColor: accentColor }}>
          <AvatarImage src={profile.profileLinkPhotoUrl} alt={profile.name} />
          <AvatarFallback style={{ backgroundColor: accentColor }}>
            {profile.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        
        <h1 className="text-2xl font-bold mb-1">{profile.name}</h1>
        <h2 className="text-lg mb-3">{profile.sport}, {profile.school}</h2>
        
        {profile.profileLinkBio && (
          <p className="text-center mb-6 px-4 max-w-sm">{profile.profileLinkBio}</p>
        )}
        
        {/* Social media links */}
        {profile.socialHandles && Object.keys(profile.socialHandles).length > 0 && (
          <div className="flex gap-4 mb-6">
            {Object.entries(profile.socialHandles).map(([platform, handle]) => 
              handle ? (
                <a
                  key={platform}
                  href={getSocialUrl(platform, handle)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full transition-colors hover:opacity-80"
                  style={{ backgroundColor: accentColor }}
                  aria-label={`${platform} profile`}
                >
                  {socialIcons[platform]}
                </a>
              ) : null
            )}
          </div>
        )}
        
        {/* Custom link buttons */}
        <div className="w-full space-y-3">
          {profile.profileLinkButtons?.map((button) => (
            <a
              key={button.id}
              href={button.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full p-3 rounded-md transition-transform hover:scale-105"
              style={{ 
                backgroundColor: `${accentColor}15`, 
                border: `1px solid ${accentColor}`,
                color: textColor 
              }}
            >
              <span className="font-medium">{button.label}</span>
              <ExternalLink className="h-4 w-4 opacity-70" />
            </a>
          ))}
        </div>
        
        {/* Footer */}
        <div className="mt-12 text-center opacity-60 text-sm">
          <p>Powered by <a href="/" className="underline">Contested</a></p>
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