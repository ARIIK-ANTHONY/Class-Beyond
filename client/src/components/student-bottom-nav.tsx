import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export function StudentBottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  // Only show for students
  if (user?.role !== "student") {
    return null;
  }

  const navItems = [
    { title: "Home", path: "/", icon: "home" },
    { title: "Lessons", path: "/lessons", icon: "menu_book" },
    { title: "Mentors", path: "/mentors", icon: "people" },
    { title: "Q&A", path: "/student/forum", icon: "forum" },
    { title: "Profile", path: "/profile", icon: "account_circle" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-card-border z-50 md:hidden backdrop-blur-lg bg-card/95 shadow-lg">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className="flex-1"
          >
            <button
              data-testid={`nav-${item.title.toLowerCase()}`}
              className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${
                location === item.path
                  ? "text-primary scale-110"
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              }`}
            >
              <span className={`material-icons mb-1 transition-all ${location === item.path ? "text-2xl" : "text-xl"}`}>{item.icon}</span>
              <span className={`text-[10px] font-medium transition-all ${location === item.path ? "font-semibold" : ""}`}>{item.title}</span>
            </button>
          </Link>
        ))}
      </div>
    </nav>
  );
}
