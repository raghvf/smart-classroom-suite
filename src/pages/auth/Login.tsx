import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockLogin, setStoredUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await mockLogin(email, password);
      
      if (user) {
        setStoredUser(user);
        toast({
          title: "Welcome back!",
          description: `Logged in as ${user.name}`,
        });
        
        // Redirect based on role
        const redirectMap = {
          admin: "/admin/dashboard",
          faculty: "/faculty/dashboard",
          student: "/student/dashboard",
        };
        navigate(redirectMap[user.role]);
      } else {
        toast({
          title: "Login failed",
          description: "Invalid credentials. Try the demo accounts.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">Welcome to SmartClass</CardTitle>
            <CardDescription>Sign in to access your dashboard</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@classroom.edu"
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
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-sm">
            <p className="text-center text-muted-foreground">Demo Accounts:</p>
            <div className="space-y-1 text-xs bg-muted p-3 rounded-lg">
              <p><strong>Admin:</strong> admin@classroom.edu</p>
              <p><strong>Faculty:</strong> faculty@classroom.edu</p>
              <p><strong>Student:</strong> student@classroom.edu</p>
              <p className="text-muted-foreground mt-2">Password: any value</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
