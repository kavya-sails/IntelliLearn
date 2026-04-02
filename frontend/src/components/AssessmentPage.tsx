import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Clock, ArrowRight, RotateCcw, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id: number;
  text: string;
  options: string[];
  correct: number;
}

const questions: Question[] = [
  { id: 1, text: "What is the default value of a boolean variable in Java?", options: ["true", "false", "null", "0"], correct: 1 },
  { id: 2, text: "Which keyword is used to prevent method overriding?", options: ["static", "final", "abstract", "const"], correct: 1 },
  { id: 3, text: "What does JVM stand for?", options: ["Java Very Main", "Java Virtual Machine", "Java Variable Method", "Java Verified Module"], correct: 1 },
  { id: 4, text: "Which collection does not allow duplicate elements?", options: ["ArrayList", "LinkedList", "HashSet", "Vector"], correct: 2 },
  { id: 5, text: "What is the time complexity of HashMap get()?", options: ["O(n)", "O(log n)", "O(1)", "O(n²)"], correct: 2 },
];

const AssessmentPage = () => {
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [timer] = useState(300); // 5 min

  const handleNext = () => {
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setSelected(null);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setShowResult(true);
    }
  };

  const score = answers.filter((a, i) => a === questions[i].correct).length;
  const percentage = Math.round((score / questions.length) * 100);

  if (!started) {
    return (
      <div className="p-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="h-20 w-20 rounded-2xl gradient-primary flex items-center justify-center mb-6 animate-pulse-glow">
          <Trophy className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Java Fundamentals</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Test your Java knowledge with {questions.length} questions. Track your strengths and identify areas for improvement.
        </p>
        <div className="flex gap-4 text-sm text-muted-foreground mb-8">
          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> 5 minutes</span>
          <span>{questions.length} questions</span>
          <span>Multiple choice</span>
        </div>
        <Button variant="gradient" size="lg" onClick={() => setStarted(true)}>
          Start Assessment <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="p-6 max-w-2xl mx-auto animate-fade-in">
        <div className="text-center mb-8">
          <div className={cn(
            "h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold",
            percentage >= 70 ? "bg-success/10 text-success" : percentage >= 50 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
          )}>
            {percentage}%
          </div>
          <h1 className="text-2xl font-bold mb-1">
            {percentage >= 70 ? "Great job! 🎉" : percentage >= 50 ? "Good effort! 💪" : "Keep learning! 📚"}
          </h1>
          <p className="text-muted-foreground">You scored {score} out of {questions.length}</p>
        </div>

        <div className="space-y-3 mb-8">
          {questions.map((q, i) => {
            const isCorrect = answers[i] === q.correct;
            return (
              <div key={q.id} className={cn(
                "bg-card border rounded-xl p-4",
                isCorrect ? "border-success/30" : "border-destructive/30"
              )}>
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{q.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isCorrect ? `Correct: ${q.options[q.correct]}` : `Your answer: ${q.options[answers[i]!]} → Correct: ${q.options[q.correct]}`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => { setStarted(false); setCurrentQ(0); setAnswers([]); setShowResult(false); setSelected(null); }}>
            <RotateCcw className="h-4 w-4 mr-1" /> Retry
          </Button>
          <Button variant="gradient">View Learning Plan</Button>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-muted-foreground">Question {currentQ + 1} of {questions.length}</span>
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Clock className="h-4 w-4" /> {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}
        </span>
      </div>

      <Progress value={((currentQ + 1) / questions.length) * 100} className="mb-8 h-2" />

      <div className="bg-card border border-border rounded-2xl p-8 mb-6">
        <h2 className="text-lg font-semibold mb-6">{q.text}</h2>
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={cn(
                "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 text-sm font-medium",
                selected === i
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30 hover:bg-secondary/50"
              )}
            >
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-secondary text-xs font-bold mr-3">
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="gradient" onClick={handleNext} disabled={selected === null} size="lg">
          {currentQ < questions.length - 1 ? "Next" : "Submit"} <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default AssessmentPage;
