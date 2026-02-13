import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, CheckCircle, Code, GitBranch, Star, TrendingUp, Terminal, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function AnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const analysis = location.state?.analysis;

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Terminal className="w-16 h-16 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-bold">No Analysis Found</h2>
          <p className="text-muted-foreground">Please analyze a GitHub profile first.</p>
          <Button onClick={() => navigate("/")} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Work";
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              data-testid="back-button"
              variant="ghost"
              onClick={() => navigate("/")}
              className="font-mono uppercase tracking-wider text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              New Analysis
            </Button>
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              GitWorth Report
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-center gap-6 mb-4">
            {analysis.profile_data.avatar_url && (
              <img
                src={analysis.profile_data.avatar_url}
                alt={analysis.username}
                className="w-20 h-20 rounded-md border-2 border-primary/20"
              />
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tight" data-testid="username-display">
                {analysis.profile_data.name || analysis.username}
              </h1>
              <p className="text-muted-foreground font-mono">@{analysis.username}</p>
              {analysis.profile_data.bio && (
                <p className="text-sm text-foreground/80 mt-2">{analysis.profile_data.bio}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm font-mono">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-primary" />
              <span>{analysis.profile_data.public_repos} repositories</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              <span>{analysis.profile_data.total_stars} stars</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>{analysis.profile_data.followers} followers</span>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Overall Score */}
          <Card className="bg-card border-border p-8 md:col-span-1 score-glow" data-testid="overall-score-card">
            <div className="text-center space-y-4">
              <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Overall Score
              </div>
              <div className={`text-6xl font-bold font-mono ${getScoreColor(analysis.overall_score)}`}>
                {analysis.overall_score}
              </div>
              <div className="text-lg font-mono uppercase tracking-wide text-primary">
                {getScoreLabel(analysis.overall_score)}
              </div>
              <Progress value={analysis.overall_score} className="h-2" />
            </div>
          </Card>

          {/* Score Breakdown */}
          <Card className="bg-card border-border p-6 md:col-span-2" data-testid="score-breakdown-card">
            <h3 className="text-lg font-bold uppercase tracking-tight mb-6 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary" />
              Score Breakdown
            </h3>
            <div className="space-y-4">
              <ScoreItem icon={<BookOpen />} label="Documentation" score={analysis.score_breakdown.documentation} />
              <ScoreItem icon={<Code />} label="Code Structure" score={analysis.score_breakdown.code_structure} />
              <ScoreItem icon={<TrendingUp />} label="Activity" score={analysis.score_breakdown.activity_consistency} />
              <ScoreItem icon={<GitBranch />} label="Organization" score={analysis.score_breakdown.repository_organization} />
              <ScoreItem icon={<Star />} label="Project Impact" score={analysis.score_breakdown.project_impact} />
              <ScoreItem icon={<Terminal />} label="Technical Depth" score={analysis.score_breakdown.technical_depth} />
            </div>
          </Card>

          {/* Strengths */}
          <Card className="bg-card border-border p-6 md:col-span-1" data-testid="strengths-card">
            <h3 className="text-lg font-bold uppercase tracking-tight mb-4 flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              Strengths
            </h3>
            <ul className="space-y-3">
              {analysis.strengths.map((strength, index) => (
                <li key={index} className="text-sm leading-relaxed flex items-start gap-2">
                  <span className="text-green-400 mt-1 flex-shrink-0">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Weaknesses */}
          <Card className="bg-card border-border p-6 md:col-span-1" data-testid="weaknesses-card">
            <h3 className="text-lg font-bold uppercase tracking-tight mb-4 flex items-center gap-2 text-yellow-400">
              <AlertTriangle className="w-5 h-5" />
              Areas to Improve
            </h3>
            <ul className="space-y-3">
              {analysis.weaknesses.map((weakness, index) => (
                <li key={index} className="text-sm leading-relaxed flex items-start gap-2">
                  <span className="text-yellow-400 mt-1 flex-shrink-0">!</span>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Languages */}
          <Card className="bg-card border-border p-6 md:col-span-1" data-testid="languages-card">
            <h3 className="text-lg font-bold uppercase tracking-tight mb-4 flex items-center gap-2">
              <Code className="w-5 h-5 text-primary" />
              Languages
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.keys(analysis.profile_data.languages).map((lang) => (
                <Badge
                  key={lang}
                  variant="secondary"
                  className="font-mono bg-secondary/50 border border-primary/20 hover:border-primary/50"
                >
                  {lang}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Recommendations */}
          <Card className="bg-card border-border p-6 md:col-span-3" data-testid="recommendations-card">
            <h3 className="text-lg font-bold uppercase tracking-tight mb-6 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary" />
              Action Plan - Prioritized Recommendations
            </h3>
            <div className="space-y-4">
              {analysis.recommendations.map((rec, index) => (
                <div key={index} className="recommendation-item">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 border border-primary/20 rounded-md flex items-center justify-center font-mono text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-relaxed flex-1 pt-1">{rec}</p>
                  </div>
                  {index < analysis.recommendations.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ScoreItem({ icon, label, score }) {
  const getColor = (score) => {
    if (score >= 80) return "bg-green-400/20 text-green-400";
    if (score >= 60) return "bg-yellow-400/20 text-yellow-400";
    return "bg-red-400/20 text-red-400";
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1">
        <div className="text-muted-foreground">{icon}</div>
        <span className="text-sm font-mono uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <Progress value={score} className="w-24 h-2" />
        <div className={`w-12 text-center px-2 py-1 rounded text-xs font-bold font-mono ${getColor(score)}`}>
          {score}
        </div>
      </div>
    </div>
  );
}