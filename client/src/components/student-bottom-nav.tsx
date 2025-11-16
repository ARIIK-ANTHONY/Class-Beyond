import { Link, useLocation } from "wouter";

export function StudentBottomNav() {
  const [location] = useLocation();

  const navItems = [
    { title: "Home", path: "/", icon: "home" },
    { title: "Lessons", path: "/lessons", icon: "menu_book" },
    { title: "Badges", path: "/badges", icon: "emoji_events" },
    { title: "Profile", path: "/profile", icon: "account_circle" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-card-border z-50 md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className="flex-1"
          >
            <button
              data-testid={`nav-${item.title.toLowerCase()}`}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                location === item.path
                  ? "text-primary"
                  : "text-muted-foreground hover-elevate"
              }`}
            >
              <span className="material-icons text-2xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.title}</span>
            </button>
          </Link>
        ))}
      </div>
    </nav>
  );
}
