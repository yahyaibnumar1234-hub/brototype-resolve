import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Shield, TrendingUp } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Brototype</h1>
          <Button onClick={() => navigate("/auth")}>
            Get Started
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">
            Complaint Management System
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A transparent and efficient platform for Brototype students to submit, track, and resolve complaints
          </p>
          <Button size="lg" className="mt-8" onClick={() => navigate("/auth")}>
            Login to Dashboard
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <Card>
            <CardHeader>
              <MessageSquare className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Easy Submission</CardTitle>
              <CardDescription>
                Submit complaints quickly with detailed categorization and urgency levels
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Track Progress</CardTitle>
              <CardDescription>
                Monitor your complaint status in real-time with transparent communication
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Fast Resolution</CardTitle>
              <CardDescription>
                Admins can efficiently manage and resolve issues with streamlined workflows
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
