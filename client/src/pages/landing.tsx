import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import heroImage from "@assets/generated_images/Hopeful_children_learning_together_063e8999.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
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
            onClick={() => (window.location.href = "/api/login")}
            data-testid="button-login"
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground">
            Education for Everyone, Everywhere
          </h2>
          <p className="text-lg text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Designed for low-resource settings with offline capabilities and accessible content
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover-elevate">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-icons text-primary text-3xl">cloud_download</span>
                  <CardTitle>Offline Learning</CardTitle>
                </div>
                <CardDescription className="text-base leading-relaxed">
                  Download lessons and learn without internet. Perfect for areas with limited
                  connectivity.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-icons text-primary text-3xl">calculate</span>
                  <CardTitle>Quality Curriculum</CardTitle>
                </div>
                <CardDescription className="text-base leading-relaxed">
                  Curriculum-aligned lessons in Math, English, and Science reviewed by experienced
                  educators.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-icons text-primary text-3xl">quiz</span>
                  <CardTitle>Interactive Quizzes</CardTitle>
                </div>
                <CardDescription className="text-base leading-relaxed">
                  Test your knowledge with engaging quizzes and get immediate feedback on your
                  progress.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-icons text-primary text-3xl">emoji_events</span>
                  <CardTitle>Earn Badges</CardTitle>
                </div>
                <CardDescription className="text-base leading-relaxed">
                  Stay motivated with achievement badges and track your learning journey.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-icons text-primary text-3xl">people</span>
                  <CardTitle>Expert Mentorship</CardTitle>
                </div>
                <CardDescription className="text-base leading-relaxed">
                  Connect with mentors who can guide your learning and answer your questions.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-icons text-primary text-3xl">family_restroom</span>
                  <CardTitle>Parent Monitoring</CardTitle>
                </div>
                <CardDescription className="text-base leading-relaxed">
                  Parents can track their children's progress and stay engaged in their education.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 bg-muted">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Our Mission</h2>
          <p className="text-lg leading-relaxed text-muted-foreground mb-6">
            We believe education is the most powerful tool to break cycles of poverty and create
            opportunities for children in refugee camps and underserved communities across South
            Sudan and East Africa.
          </p>
          <p className="text-lg leading-relaxed text-muted-foreground">
            ClassBeyond provides free, accessible, and offline-capable educational resources to
            ensure every child can learn, regardless of their circumstances.
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
            onClick={() => (window.location.href = "/api/login")}
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
