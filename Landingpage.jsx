import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Terminal, Code, GitBranch, Star, TrendingUp, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function LandingPage() {
  const [githubUrl, setGithubUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!githubUrl.trim()) {
      toast.error("Please enter a GitHub username or URL");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await axios.post(`${API}/analyze`, {
        github_url: githubUrl,
      });

      toast.success("Analysis complete!");
      navigate("/analysis", { state: { analysis: response.data } });
    } catch (error) {
      console.error("Analysis error:", error);
      if (error.response?.status === 404) {
        toast.error("GitHub user not found. Please check the username.");
      } else {
        toast.error("Failed to analyze profile. Please try again.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1762279389006-43963a0cee55?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwyfHxmdXR1cmlzdGljJTIwYWJzdHJhY3QlMjBkaWdpdGFsJTIwZGF0YSUyMGZsb3clMjBuZW9uJTIwZGFyayUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzcxMDAwMzk4fDA&ixlib=rb-4.1.0&q=85')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-black/80 z-0" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-md">
              <Terminal className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono uppercase tracking-widest text-primary">
                GitHub Portfolio Analyzer
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight uppercase">
              Know Your
              <span className="block text-primary">Git<span className="text-foreground">Worth</span></span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Get recruiter-level insights on your GitHub profile. Discover strengths, fix weaknesses,
              and land your dream developer role.
            </p>

            {/* Analysis Input */}
            <div className="max-w-2xl mx-auto mt-12">
              <Card className="bg-card border-border p-6">
                <div className="space-y-4">
                  <label className="block text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Enter GitHub Username or URL
                  </label>
                  <Input
                    data-testid="github-url-input"
                    type="text"
                    placeholder="username or github.com/username"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                    className="h-12 text-lg font-mono bg-secondary/50 border-transparent focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                    disabled={isAnalyzing}
                  />
                  <Button
                    data-testid="analyze-button"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-mono uppercase tracking-wider rounded-sm text-base"
                  >
                    {isAnalyzing ? (
                      <span className="cursor-blink">Analyzing</span>
                    ) : (
                      "Analyze Profile"
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight mb-4">
            What We <span className="text-primary">Analyze</span>
          </h2>
          <p className="text-muted-foreground text-lg">Comprehensive recruiter-perspective evaluation</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Code className="w-6 h-6" />}
            title="Documentation Quality"
            description="README files, project descriptions, and code comments"
          />
          <FeatureCard
            icon={<GitBranch className="w-6 h-6" />}
            title="Code Structure"
            description="Repository organization, best practices, and architecture"
          />
          <FeatureCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Activity Consistency"
            description="Commit frequency, contribution patterns, and engagement"
          />
          <FeatureCard
            icon={<Star className="w-6 h-6" />}
            title="Project Impact"
            description="Stars, forks, and real-world relevance of projects"
          />
          <FeatureCard
            icon={<Terminal className="w-6 h-6" />}
            title="Technical Depth"
            description="Language diversity, complexity, and skill demonstration"
          />
          <FeatureCard
            icon={<CheckCircle className="w-6 h-6" />}
            title="Recruiter Score"
            description="Overall profile readiness for job applications"
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-muted-foreground text-sm font-mono">
            Built for students by <span className="text-primary">developers</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <Card className="bg-card border-border p-6 stat-card">
      <div className="space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 border border-primary/20 rounded-md text-primary">
          {icon}
        </div>
        <h3 className="text-lg font-bold uppercase tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </Card>
  );
}