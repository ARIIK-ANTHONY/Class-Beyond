import { useState } from "react";
import { useFirebaseAuth } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<string>("student");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useFirebaseAuth();
  const { syncUser } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        
        // Wait for Firebase auth state to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to sync user - if user doesn't exist in database, this will fail
        // and we'll show an appropriate error
        try {
          await syncUser({});
        } catch (syncError: any) {
          // If user doesn't exist in database, ask them to sign up
          if (syncError.message?.includes("not found")) {
            toast({
              title: "Account not found",
              description: "Please sign up to create your account.",
              variant: "destructive",
            });
            setIsLogin(false); // Switch to signup form
            return;
          }
          // For other errors, continue anyway (user might already be synced)
        }
        
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
        
        onOpenChange(false);
        
        // Reload to fetch user data and redirect to portal
        setTimeout(() => {
          window.location.replace(window.location.href);
        }, 500);
      } else {
        // SIGNUP
        try {
          await signUp(email, password);
        } catch (error: any) {
          // If email already exists in Firebase, show specific error
          if (error.code === 'auth/email-already-in-use') {
            throw new Error("Email already in use. Please login instead or use a different email.");
          }
          throw error;
        }
        
        // Wait for Firebase user to be fully set
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log("🔍 About to sync user with:", { username, role });
        
        // Sync user with selected username and role - AWAIT the promise
        // This will either create a new user OR update existing user's role
        const syncedUser = await syncUser({ username, role });
        
        console.log("✅ User synced successfully:", syncedUser);
        
        toast({
          title: "Account created!",
          description: `Welcome to ClassBeyond as a ${role}!`,
        });
        
        onOpenChange(false);
        
        // Wait longer for database sync to complete, then reload
        // This ensures the user data is properly saved before redirect
        setTimeout(() => {
          window.location.replace(window.location.href);
        }, 1500);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Authentication failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isLogin ? "Welcome Back" : "Create Account"}</DialogTitle>
          <DialogDescription>
            {isLogin
              ? "Sign in to continue your learning journey"
              : "Join ClassBeyond and start learning today"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">I am a...</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="mentor">Mentor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </Button>

          <div className="text-center text-sm">
            {isLogin ? (
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="text-primary hover:underline"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="text-primary hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
