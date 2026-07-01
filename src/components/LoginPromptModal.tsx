import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { UserPlus, LogIn, Trophy, Star } from 'lucide-react';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

const LoginPromptModal: React.FC<LoginPromptModalProps> = ({ 
  isOpen, 
  onClose, 
  feature = "save your progress and earn XP" 
}) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/auth');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <Card className="border-0 shadow-none">
          <CardHeader className="text-center pb-3">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Join ConnectGuru!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Please login to {feature}
            </p>
            
            <div className="grid grid-cols-2 gap-4 py-4 px-2">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Star className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium">Earn XP</p>
                <p className="text-xs text-muted-foreground">Track progress</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-medium">Compete</p>
                <p className="text-xs text-muted-foreground">Join leaderboard</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={handleLogin} className="w-full premium-button">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
              
              <Button onClick={onClose} variant="outline" className="w-full">
                Continue as Guest
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              You can view all content as a guest, but need an account to save progress.
            </p>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default LoginPromptModal;