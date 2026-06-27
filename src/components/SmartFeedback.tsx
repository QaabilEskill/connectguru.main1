
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

interface SmartFeedbackProps {
  isCorrect: boolean;
  corrections: string[];
  similarity: number;
  userText: string;
  expectedText: string;
}

const SmartFeedback: React.FC<SmartFeedbackProps> = ({
  isCorrect,
  corrections,
  similarity,
  userText,
  expectedText
}) => {
  const getStatusColor = () => {
    if (isCorrect && corrections.length === 0) return 'bg-green-50 border-green-200';
    if (isCorrect && corrections.length > 0) return 'bg-blue-50 border-blue-200';
    return 'bg-red-50 border-red-200';
  };

  const getStatusIcon = () => {
    if (isCorrect && corrections.length === 0) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (isCorrect && corrections.length > 0) return <Info className="w-4 h-4 text-blue-600" />;
    return <AlertCircle className="w-4 h-4 text-red-600" />;
  };

  const getStatusMessage = () => {
    if (isCorrect && corrections.length === 0) return 'Perfect! Well done!';
    if (isCorrect && corrections.length > 0) return 'Good job! Minor corrections applied:';
    return 'Not quite right. Try again:';
  };

  return (
    <Card className={`${getStatusColor()} animate-fade-in`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium text-sm">
            {getStatusMessage()}
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            Accuracy: {Math.round(similarity * 100)}%
          </span>
        </div>

        <div className="text-sm">
          <div className="mb-2">
            <span className="text-muted-foreground">You said:</span>
            <p className="font-medium">{userText}</p>
          </div>

          {corrections.length > 0 && (
            <div className="mb-2">
              <span className="text-muted-foreground">Auto-corrections:</span>
              <ul className="list-disc list-inside text-blue-700 mt-1">
                {corrections.map((correction, index) => (
                  <li key={index} className="text-xs">{correction}</li>
                ))}
              </ul>
            </div>
          )}

          {!isCorrect && (
            <div>
              <span className="text-muted-foreground">Expected:</span>
              <p className="font-medium text-green-700">{expectedText}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartFeedback;
