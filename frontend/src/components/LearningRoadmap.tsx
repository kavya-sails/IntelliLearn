import { Clock, ExternalLink, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

interface Resource {
  title: string;
  link: string;
  description: string;
}

interface WeekData {
  week: number;
  resources: Resource[];
}

interface ApiRaw {
  learning_path: {
    week_number: number;
    resources: Resource[];
  }[];
}

const LearningRoadmap = () => {
  const { sessionId: sessionIdParam } = useParams<{ sessionId: string }>();
  const [weeksData, setWeeksData] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLearningPath = async () => {
      try {
        const userId = localStorage.getItem("user_id");
        const sessionId = sessionIdParam || localStorage.getItem("session_id");

        if (!userId || !sessionId) {
          throw new Error("User or session not found");
        }

        localStorage.setItem("session_id", sessionId);

        const response = await fetch(
          `http://localhost:8000/api/chat/${userId}/${sessionId}/learning_path`
        );

        if (!response.ok) throw new Error("Failed to fetch learning path");

        const data: ApiRaw = await response.json();

        const formattedData: WeekData[] = data.learning_path.map((item) => ({
          week: item.week_number,
          resources: item.resources,
        }));

        setWeeksData(formattedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchLearningPath();
  }, [sessionIdParam]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (weeksData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] space-y-4">
        <p className="text-muted-foreground">No learning roadmap available yet.</p>
        <p className="text-sm text-muted-foreground">
          Please complete the assessment to generate your personalized learning plan.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto">
      <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Learning Roadmap</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your personalized {weeksData.length}-week learning plan
          </p>
        </div>

        {/* Weeks List */}
        <div className="space-y-6">
          {weeksData.map((week) => {
            const topics = week.resources.map((r) => r.title);

            return (
              <div
                key={week.week}
                className="bg-card border border-border rounded-2xl p-5 hover-lift"
              >
                {/* Header */}
                <div className="mb-3">
                  <span className="text-xs text-muted-foreground font-medium">
                    Week {week.week}
                  </span>
                  <h3 className="text-base font-semibold">
                    {week.resources[0]?.title || `Week ${week.week} Learning`}
                  </h3>
                </div>

                {/* Content */}
                <div className="grid md:grid-cols-2 gap-4">
                  
                  {/* Topics */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <BookOpen className="h-3 w-3" /> Topics
                    </p>
                    <ul className="space-y-1">
                      {topics.map((topic) => (
                        <li key={topic} className="text-sm flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Resources */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> Resources
                    </p>
                    <ul className="space-y-1">
                      {week.resources.map((res) => (
                        <li
                          key={res.link}
                          className="text-sm text-primary hover:underline cursor-pointer"
                        >
                          <a href={res.link} target="_blank" rel="noopener noreferrer">
                            {res.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* Footer */}
                <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {week.resources.length} resources
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default LearningRoadmap;