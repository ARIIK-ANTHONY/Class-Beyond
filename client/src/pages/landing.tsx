import { Link } from "wouter";
import React, { useState } from "react";
// Responsive Navbar component
function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <nav className="w-full bg-white/90 backdrop-blur-md shadow-md fixed top-0 left-0 z-20">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-icons text-primary text-3xl">school</span>
          <span className="font-bold text-xl text-primary">ClassBeyond</span>
        </div>
        <div className="hidden md:flex gap-6">
          <NavLink href="/" label="Home" />
          <NavLink href="/lessons" label="Lessons" />
          {/* <NavLink href="/quiz" label="Quizzes" /> */}
          {/* <NavLink href="/student-mentors" label="Mentors" /> */}
          <NavLink href="/about" label="About" />
        </div>
        <button className="md:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary" onClick={() => setMenuOpen(!menuOpen)}>
          <span className="material-icons text-primary text-3xl">menu</span>
        </button>
      </div>
      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white/95 shadow-lg px-4 py-2 flex flex-col gap-3">
          <NavLink href="/" label="Home" onClick={() => setMenuOpen(false)} />
          <NavLink href="/lessons" label="Lessons" onClick={() => setMenuOpen(false)} />
          {/* <NavLink href="/quiz" label="Quizzes" onClick={() => setMenuOpen(false)} /> */}
          {/* <NavLink href="/student-mentors" label="Mentors" onClick={() => setMenuOpen(false)} /> */}
          <NavLink href="/about" label="About" onClick={() => setMenuOpen(false)} />
        </div>
      )}
    </nav>
  );
}


interface NavLinkProps {
  href: string;
  label: string;
  onClick?: () => void;
}
function NavLink({ href, label, onClick }: NavLinkProps) {
  const location = window.location.pathname;
  const isActive = location === href;
  return (
    <Link
      href={href}
      onClick={onClick ? onClick : undefined}
      className={`px-3 py-2 rounded transition font-medium text-base ${isActive ? "bg-primary text-white shadow" : "text-gray-700 hover:bg-primary/10 hover:text-primary"}`}
    >
      {label}
    </Link>
  );
}
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuthModal } from "@/components/AuthModal";
import heroImage from "@assets/image/Hopeful_children_learning_together_063e8999.png";

export default function Landing() {
    // Import lessons for preview
    const [lessons, setLessons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    React.useEffect(() => {
      fetch('/api/public-lessons')
        .then(res => res.json())
        .then(data => {
          console.log('Fetched lessons:', data);
          setLessons(data);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching lessons:', err);
          setIsLoading(false);
        });
    }, []);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const handleGetStarted = () => {
    setAuthModalOpen(true);
  };

  // Defensive: Only use lessons if it's an array and not too large
  let safeLessons: any[] = Array.isArray(lessons) ? lessons.slice(0, 12) : [];
  const [previewLesson, setPreviewLesson] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handlePreview = (lesson: any) => {
    setPreviewLesson(lesson);
    setPreviewOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Hero Image with dark wash */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Children learning together"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="material-icons text-white text-5xl md:text-6xl">school</span>
            <h1 className="text-4xl md:text-6xl font-bold text-white">ClassBeyond</h1>
          </div>
          <p className="text-xl md:text-2xl text-white/95 mb-4 leading-relaxed">
            Learning that reaches every corner, beyond classrooms and borders
          </p>
          <p className="text-lg md:text-xl text-white/85 mb-8 max-w-3xl mx-auto leading-relaxed">
            Empowering refugee and underprivileged children with accessible, offline-first digital
            education. Free lessons, interactive quizzes, and mentorship for communities in need.
          </p>
          <Button
            size="lg"
            variant="default"
            className="text-lg px-8 py-6"
            onClick={handleGetStarted}
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Lessons Preview Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-primary text-center">Explore Lessons</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card><CardContent className="h-32" /></Card>
              <Card><CardContent className="h-32" /></Card>
              <Card><CardContent className="h-32" /></Card>
            </div>
          ) : safeLessons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {safeLessons.map((lesson) => (
                <Card key={lesson.id} className="hover-elevate flex flex-col">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="capitalize">{lesson.subject}</Badge>
                      <Badge variant="outline" className="ml-2 capitalize">{lesson.level}</Badge>
                    </div>
                    <CardTitle className="text-lg">{lesson.title}</CardTitle>
                    <CardDescription className="line-clamp-3">{lesson.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto flex gap-2">
                    <Button
                      variant="outline"
                      className="w-1/2"
                      onClick={() => handlePreview(lesson)}
                    >
                      Preview
                    </Button>
                    <Button
                      className="w-1/2"
                      onClick={() => setAuthModalOpen(true)}
                    >
                      Enroll & Start Learning
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="py-16 text-center">No lessons found</CardContent></Card>
          )}
        </div>
      </section>

      {/* Lesson Preview Modal */}
      {previewOpen && previewLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-8 relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-primary text-2xl"
              onClick={() => setPreviewOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-2">{previewLesson.title}</h2>
            <p className="text-muted-foreground mb-4">{previewLesson.description}</p>
            <div className="prose prose-sm max-w-none bg-muted/50 p-4 rounded-lg mb-4">
              {previewLesson.content
                ? previewLesson.content.slice(0, 300) + (previewLesson.content.length > 300 ? "..." : "")
                : "No preview available."}
            </div>
            <Button className="w-full" onClick={() => { setPreviewOpen(false); setAuthModalOpen(true); }}>
              Enroll to view full content
            </Button>
          </div>
        </div>
      )}
      {/* Mission Section */}
      <section className="py-16 px-4 bg-muted">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Our Mission</h2>
          <p className="text-lg leading-relaxed text-muted-foreground mb-6">
            We believe education is the most powerful tool to break cycles of poverty and create opportunities for children in refugee camps and underserved communities across South Sudan and East Africa.
          </p>
          <p className="text-lg leading-relaxed text-muted-foreground">
            ClassBeyond provides free, accessible, and offline-capable educational resources to ensure every child can learn, regardless of their circumstances.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-lg mb-8 opacity-95">
            Join thousands of students already learning with ClassBeyond
          </p>
          <Button
            size="lg"
            variant="outline"
            className="text-lg px-8 py-6 bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20"
            onClick={() => setAuthModalOpen(true)}
            data-testid="button-cta-login"
          >
            Join ClassBeyond
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground">
          <p className="mb-2">
            © 2025 ClassBeyond. Empowering education in South Sudan and East Africa.
          </p>
          <p className="text-sm">Learning that reaches every corner, beyond classrooms and borders.</p>
        </div>
      </footer>
    </div>
  );
}
