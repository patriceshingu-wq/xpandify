import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
}

interface AssessmentQuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessment: {
    id: string;
    title_en: string;
    title_fr: string | null;
    passing_score: number | null;
    max_attempts: number | null;
    time_limit_minutes: number | null;
    questions?: Question[];
  };
  personId: string;
  attemptNumber: number;
}

export function AssessmentQuizDialog({
  open,
  onOpenChange,
  assessment,
  personId,
  attemptNumber,
}: AssessmentQuizDialogProps) {
  const { getLocalizedField } = useLanguage();
  const queryClient = useQueryClient();

  const questions: Question[] = assessment.questions || [];
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean; feedback: string } | null>(null);

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const passingScore = assessment.passing_score || 70;

  const handleAnswer = (questionId: string, optionIndex: number) => {
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const handleSubmit = async () => {
    if (totalQuestions === 0) return;
    setIsSubmitting(true);

    try {
      let correct = 0;
      questions.forEach((q) => {
        if (answers[q.id] === q.correct_index) correct++;
      });

      const score = Math.round((correct / totalQuestions) * 100);
      const passed = score >= passingScore;
      const feedback = passed
        ? `Congratulations! You scored ${score}% (${correct}/${totalQuestions} correct).`
        : `You scored ${score}% (${correct}/${totalQuestions} correct). ${passingScore}% required to pass.`;

      const { error } = await supabase.from('assessment_results').insert({
        assessment_id: assessment.id,
        person_id: personId,
        score,
        passed,
        attempt_number: attemptNumber,
        answers: answers as any,
        feedback_en: feedback,
        submitted_at: new Date().toISOString(),
      });

      if (error) throw error;

      setResult({ score, passed, feedback });
      queryClient.invalidateQueries({ queryKey: ['assessment-results'] });
    } catch (err) {
      console.error('[AssessmentQuiz] Error:', err);
      toast.error('Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentQ(0);
    setAnswers({});
    setResult(null);
    onOpenChange(false);
  };

  const currentQuestion = questions[currentQ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {getLocalizedField(assessment, 'title')}
          </DialogTitle>
          <DialogDescription>
            {result
              ? 'Assessment Complete'
              : `Question ${currentQ + 1} of ${totalQuestions}`}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          /* Result Screen */
          <div className="text-center space-y-4 py-4">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
              result.passed ? 'bg-success/10' : 'bg-destructive/10'
            }`}>
              {result.passed ? (
                <CheckCircle className="h-8 w-8 text-success" />
              ) : (
                <XCircle className="h-8 w-8 text-destructive" />
              )}
            </div>
            <div>
              <p className="text-3xl font-bold">{result.score}%</p>
              <Badge variant={result.passed ? 'default' : 'destructive'} className="mt-2">
                {result.passed ? 'PASSED' : 'NOT PASSED'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{result.feedback}</p>
            <Button onClick={handleClose}>Close</Button>
          </div>
        ) : totalQuestions === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No questions available for this assessment.</p>
            <Button onClick={handleClose} className="mt-4">Close</Button>
          </div>
        ) : (
          /* Quiz Screen */
          <>
            <Progress value={progress} className="h-1.5" />

            <div className="space-y-4 py-2">
              <p className="font-medium">{currentQuestion?.question}</p>
              <RadioGroup
                value={answers[currentQuestion?.id]?.toString()}
                onValueChange={(val) => handleAnswer(currentQuestion.id, parseInt(val))}
              >
                {currentQuestion?.options.map((option, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value={i.toString()} id={`opt-${i}`} />
                    <Label htmlFor={`opt-${i}`} className="cursor-pointer flex-1 font-normal">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <DialogFooter className="flex justify-between">
              <Button
                variant="ghost"
                onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                disabled={currentQ === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              {currentQ < totalQuestions - 1 ? (
                <Button
                  onClick={() => setCurrentQ(currentQ + 1)}
                  disabled={answers[currentQuestion?.id] === undefined}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={answeredCount < totalQuestions || isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
