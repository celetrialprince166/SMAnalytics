import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Building2 } from "lucide-react";
import { toast } from "sonner";

const SignUp = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [level, setLevel] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verified, setVerified] = useState(false);

  const handleSearch = () => {
    // Mock verification - in real app, this would call an API
    if (userId && accessCode) {
      setLevel("User");
      setName("John Doe");
      setVerified(true);
      toast.success("User verified successfully");
    } else {
      toast.error("Please enter User ID and Access Code");
    }
  };

  const handleClear = () => {
    setUserId("");
    setAccessCode("");
    setLevel("");
    setName("");
    setUsername("");
    setNewPassword("");
    setConfirmPassword("");
    setVerified(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword === confirmPassword) {
      // Mock registration - in real app, this would call an API
      toast.success("Account created successfully");
      navigate("/login");
    } else {
      toast.error("Passwords do not match");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <Link to="/login" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Login
          </Link>
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Sign Up</CardTitle>
          <CardDescription className="text-center">Create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4 pb-4 border-b">
              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Select value={userId} onValueChange={setUserId}>
                  <SelectTrigger id="userId">
                    <SelectValue placeholder="Select User ID" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="U001">U001</SelectItem>
                    <SelectItem value="U002">U002</SelectItem>
                    <SelectItem value="U003">U003</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessCode">Access Code</Label>
                <Input
                  id="accessCode"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter access code"
                />
              </div>

              {verified && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="level">Level</Label>
                    <Input id="level" value={level} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={name} readOnly className="bg-muted" />
                  </div>
                </>
              )}

              {!verified && (
                <Button type="button" onClick={handleSearch} className="w-full">
                  Search
                </Button>
              )}
            </div>

            {verified && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    required
                  />
                </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Submit
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={handleClear}>
                Clear
              </Button>
            </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUp;
