import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useFirebaseAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface StudentHeaderProps {
  title?: string;
  subtitle?: string;
  showGreeting?: boolean;
}

export function StudentHeader({ title, subtitle, showGreeting = false }: StudentHeaderProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { signOut } = useFirebaseAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <header className="bg-primary text-primary-foreground py-4 md:py-6 px-4 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            <span className="material-icons text-3xl md:text-4xl flex-shrink-0">school</span>
            <div className="min-w-0 flex-1">
              {showGreeting ? (
                <>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold truncate">
                    {getGreeting()}, {user?.firstName || "Student"}!
                  </h1>
                  <p className="text-primary-foreground/90 mt-1 text-xs md:text-sm truncate">{subtitle || "Ready to continue learning?"}</p>
                </>
              ) : (
                <>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold truncate">{title || "ClassBeyond"}</h1>
                  {subtitle && <p className="text-primary-foreground/90 mt-1 text-xs md:text-sm line-clamp-2 md:line-clamp-1">{subtitle}</p>}
                </>
              )}
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLogout}
            className="bg-white/10 text-white border-white/30 hover:bg-white/20 flex-shrink-0 ml-2"
          >
            <span className="material-icons text-sm md:mr-1">logout</span>
            <span className="hidden md:inline">Logout</span>
          </Button>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-white/10 rounded-lg p-1 overflow-x-auto">
          <Link href="/">
            <Button 
              variant={location === "/" ? "secondary" : "ghost"} 
              size="sm"
              className={`whitespace-nowrap ${location === "/" ? "bg-white text-primary" : "text-white hover:bg-white/20"}`}
            >
              <span className="material-icons text-sm mr-1">home</span>
              Home
            </Button>
          </Link>
          <Link href="/lessons">
            <Button 
              variant={location === "/lessons" ? "secondary" : "ghost"} 
              size="sm"
              className={`whitespace-nowrap ${location === "/lessons" ? "bg-white text-primary" : "text-white hover:bg-white/20"}`}
            >
              <span className="material-icons text-sm mr-1">menu_book</span>
              Lessons
            </Button>
          </Link>
          <Link href="/mentors">
            <Button 
              variant={location === "/mentors" ? "secondary" : "ghost"} 
              size="sm"
              className={`whitespace-nowrap ${location === "/mentors" ? "bg-white text-primary" : "text-white hover:bg-white/20"}`}
            >
              <span className="material-icons text-sm mr-1">people</span>
              Mentors
            </Button>
          </Link>
          <Link href="/student/forum">
            <Button 
              variant={location === "/student/forum" ? "secondary" : "ghost"} 
              size="sm"
              className={`whitespace-nowrap ${location === "/student/forum" ? "bg-white text-primary" : "text-white hover:bg-white/20"}`}
            >
              <span className="material-icons text-sm mr-1">forum</span>
              Q&A
            </Button>
          </Link>
          <Link href="/badges">
            <Button 
              variant={location === "/badges" ? "secondary" : "ghost"} 
              size="sm"
              className={`whitespace-nowrap ${location === "/badges" ? "bg-white text-primary" : "text-white hover:bg-white/20"}`}
            >
              <span className="material-icons text-sm mr-1">emoji_events</span>
              Badges
            </Button>
          </Link>
          <Link href="/profile">
            <Button 
              variant={location === "/profile" ? "secondary" : "ghost"} 
              size="sm"
              className={`whitespace-nowrap ${location === "/profile" ? "bg-white text-primary" : "text-white hover:bg-white/20"}`}
            >
              <span className="material-icons text-sm mr-1">account_circle</span>
              Profile
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
