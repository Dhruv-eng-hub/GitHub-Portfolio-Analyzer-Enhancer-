from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Models
class AnalyzeRequest(BaseModel):
    github_url: str

class ScoreBreakdown(BaseModel):
    documentation: int
    code_structure: int
    activity_consistency: int
    repository_organization: int
    project_impact: int
    technical_depth: int

class Analysis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    overall_score: int
    score_breakdown: ScoreBreakdown
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    profile_data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AnalysisResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    username: str
    overall_score: int
    score_breakdown: ScoreBreakdown
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    profile_data: Dict[str, Any]
    timestamp: datetime


# GitHub API Helper
class GitHubAnalyzer:
    BASE_URL = "https://api.github.com"
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def get_user_profile(self, username: str) -> Dict[str, Any]:
        """Fetch user profile data"""
        try:
            response = await self.client.get(f"{self.BASE_URL}/users/{username}")
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="GitHub user not found")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Error fetching user profile: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch GitHub profile")
    
    async def get_repositories(self, username: str) -> List[Dict[str, Any]]:
        """Fetch user repositories"""
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/users/{username}/repos",
                params={"per_page": 100, "sort": "updated"}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Error fetching repositories: {e}")
            return []
    
    async def get_readme(self, username: str, repo: str) -> Optional[str]:
        """Fetch README content"""
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/repos/{username}/{repo}/readme",
                headers={"Accept": "application/vnd.github.raw"}
            )
            if response.status_code == 200:
                return response.text
            return None
        except:
            return None
    
    async def analyze_profile(self, username: str) -> Dict[str, Any]:
        """Comprehensive profile analysis"""
        profile = await self.get_user_profile(username)
        repos = await self.get_repositories(username)
        
        # Analyze repositories
        total_stars = sum(repo.get('stargazers_count', 0) for repo in repos)
        total_forks = sum(repo.get('forks_count', 0) for repo in repos)
        languages = {}
        repos_with_readme = 0
        repos_with_description = 0
        
        for repo in repos[:10]:  # Check top 10 repos
            if repo.get('language'):
                languages[repo['language']] = languages.get(repo['language'], 0) + 1
            if repo.get('description'):
                repos_with_description += 1
            
            # Check for README
            readme = await self.get_readme(username, repo['name'])
            if readme:
                repos_with_readme += 1
        
        return {
            "profile": profile,
            "repositories": repos,
            "stats": {
                "public_repos": profile.get('public_repos', 0),
                "followers": profile.get('followers', 0),
                "following": profile.get('following', 0),
                "total_stars": total_stars,
                "total_forks": total_forks,
                "languages": languages,
                "repos_with_readme": repos_with_readme,
                "repos_with_description": repos_with_description,
                "top_repos": repos[:10]
            }
        }


# AI Analyzer
class AIAnalyzer:
    def __init__(self):
        self.api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not self.api_key:
            raise ValueError("EMERGENT_LLM_KEY not found in environment")
    
    async def generate_analysis(self, github_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI-powered analysis"""
        stats = github_data['stats']
        profile = github_data['profile']
        
        # Create analysis prompt
        prompt = f"""You are an expert technical recruiter analyzing a GitHub profile. Provide a structured assessment.

Profile Analysis:
- Username: {profile.get('name', profile.get('login'))}
- Public Repos: {stats['public_repos']}
- Followers: {stats['followers']}
- Total Stars: {stats['total_stars']}
- Total Forks: {stats['total_forks']}
- Languages Used: {', '.join(stats['languages'].keys())}
- Repos with README: {stats['repos_with_readme']} out of top 10
- Repos with Description: {stats['repos_with_description']} out of top 10
- Bio: {profile.get('bio', 'Not provided')}
- Location: {profile.get('location', 'Not provided')}

Top Repositories:
{self._format_repos(stats['top_repos'][:5])}

Provide analysis in this EXACT JSON format:
{{
  "score_breakdown": {{
    "documentation": <score 0-100>,
    "code_structure": <score 0-100>,
    "activity_consistency": <score 0-100>,
    "repository_organization": <score 0-100>,
    "project_impact": <score 0-100>,
    "technical_depth": <score 0-100>
  }},
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2",
    "Actionable recommendation 3",
    "Actionable recommendation 4",
    "Actionable recommendation 5"
  ]
}}

Be specific and actionable in recommendations. Focus on what recruiters value."""

        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"analysis-{uuid.uuid4()}",
                system_message="You are an expert technical recruiter. Provide structured JSON responses only."
            ).with_model("openai", "gpt-4o")
            
            message = UserMessage(text=prompt)
            response = await chat.send_message(message)
            
            # Parse JSON response
            import json
            # Extract JSON from response
            response_text = response.strip()
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]
            
            analysis = json.loads(response_text.strip())
            return analysis
        except Exception as e:
            logger.error(f"AI analysis error: {e}")
            # Return default analysis if AI fails
            return self._default_analysis(stats)
    
    def _format_repos(self, repos: List[Dict]) -> str:
        """Format repository list for prompt"""
        lines = []
        for repo in repos:
            lines.append(
                f"- {repo['name']}: {repo.get('description', 'No description')} "
                f"(⭐ {repo.get('stargazers_count', 0)}, Language: {repo.get('language', 'N/A')})"
            )
        return "\n".join(lines)
    
    def _default_analysis(self, stats: Dict) -> Dict[str, Any]:
        """Fallback analysis if AI fails"""
        return {
            "score_breakdown": {
                "documentation": 60,
                "code_structure": 65,
                "activity_consistency": 55,
                "repository_organization": 60,
                "project_impact": 50,
                "technical_depth": 60
            },
            "strengths": [
                "Active GitHub presence",
                "Multiple programming languages",
                "Public repositories available"
            ],
            "weaknesses": [
                "Analysis incomplete - AI service temporarily unavailable",
                "Consider adding more detailed README files",
                "Enhance project descriptions"
            ],
            "recommendations": [
                "Add comprehensive README files to all repositories",
                "Include project setup instructions and usage examples",
                "Write detailed commit messages",
                "Contribute to open source projects",
                "Pin your best projects to your profile"
            ]
        }


# Initialize analyzers
github_analyzer = GitHubAnalyzer()
ai_analyzer = AIAnalyzer()


# API Routes
@api_router.get("/")
async def root():
    return {"message": "GitWorth API - GitHub Portfolio Analyzer"}


@api_router.post("/analyze", response_model=AnalysisResponse)
async def analyze_github_profile(request: AnalyzeRequest):
    """Analyze a GitHub profile"""
    try:
        # Extract username from URL or use as-is
        username = request.github_url.strip()
        if 'github.com/' in username:
            username = username.split('github.com/')[-1].strip('/')
        
        logger.info(f"Analyzing GitHub profile: {username}")
        
        # Fetch GitHub data
        github_data = await github_analyzer.analyze_profile(username)
        
        # Generate AI analysis
        ai_analysis = await ai_analyzer.generate_analysis(github_data)
        
        # Calculate overall score
        breakdown = ai_analysis['score_breakdown']
        overall_score = sum(breakdown.values()) // len(breakdown)
        
        # Create analysis object
        analysis = Analysis(
            username=username,
            overall_score=overall_score,
            score_breakdown=ScoreBreakdown(**breakdown),
            strengths=ai_analysis['strengths'],
            weaknesses=ai_analysis['weaknesses'],
            recommendations=ai_analysis['recommendations'],
            profile_data={
                "name": github_data['profile'].get('name', username),
                "bio": github_data['profile'].get('bio', ''),
                "avatar_url": github_data['profile'].get('avatar_url', ''),
                "public_repos": github_data['stats']['public_repos'],
                "followers": github_data['stats']['followers'],
                "total_stars": github_data['stats']['total_stars'],
                "languages": github_data['stats']['languages']
            }
        )
        
        # Save to database
        doc = analysis.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        await db.analyses.insert_one(doc)
        
        logger.info(f"Analysis complete for {username}: Score {overall_score}")
        return analysis
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@api_router.get("/analyses", response_model=List[AnalysisResponse])
async def get_recent_analyses():
    """Get recent analyses"""
    try:
        analyses = await db.analyses.find({}, {"_id": 0}).sort("timestamp", -1).limit(10).to_list(10)
        
        for analysis in analyses:
            if isinstance(analysis['timestamp'], str):
                analysis['timestamp'] = datetime.fromisoformat(analysis['timestamp'])
        
        return analyses
    except Exception as e:
        logger.error(f"Error fetching analyses: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch analyses")


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    await github_analyzer.client.aclose()