import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, GraduationCap, Calendar } from 'lucide-react';

interface UserDetailsFormProps {
  onSubmit: (details: {
    studentName: string;
    studentClass: string;
    studentAge: number;
  }) => void;
  language: 'english' | 'hinglish';
}

const UserDetailsForm: React.FC<UserDetailsFormProps> = ({ onSubmit, language }) => {
  const [formData, setFormData] = useState({
    studentName: '',
    studentClass: '',
    studentAge: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.studentName.trim()) {
      newErrors.studentName = language === 'hinglish' 
        ? 'Name zaroori hai' 
        : 'Name is required';
    }

    if (!formData.studentClass.trim()) {
      newErrors.studentClass = language === 'hinglish' 
        ? 'Class zaroori hai' 
        : 'Class is required';
    }

    if (!formData.studentAge.trim()) {
      newErrors.studentAge = language === 'hinglish' 
        ? 'Age zaroori hai' 
        : 'Age is required';
    } else {
      const age = parseInt(formData.studentAge);
      if (isNaN(age) || age < 10 || age > 25) {
        newErrors.studentAge = language === 'hinglish' 
          ? 'Age 10-25 ke beech honi chahiye' 
          : 'Age should be between 10-25';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        studentName: formData.studentName.trim(),
        studentClass: formData.studentClass.trim(),
        studentAge: parseInt(formData.studentAge)
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="glass-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary-glow/10 border border-primary/20">
              <User className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl gradient-text">
            {language === 'hinglish' 
              ? 'Apni Details Bataiye'
              : 'Tell us about yourself'
            }
          </CardTitle>
          <CardDescription className="text-base">
            {language === 'hinglish' 
              ? 'Test shuru karne se pehle apni basic information share kijiye'
              : 'Please share your basic information before starting the test'
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Name */}
            <div className="space-y-2">
              <Label htmlFor="studentName" className="flex items-center gap-2 text-sm font-medium">
                <User className="w-4 h-4" />
                {language === 'hinglish' ? 'Aapka Naam' : 'Your Name'}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="studentName"
                type="text"
                value={formData.studentName}
                onChange={(e) => handleInputChange('studentName', e.target.value)}
                placeholder={language === 'hinglish' ? 'Apna poora naam likhen' : 'Enter your full name'}
                className={`elegant-input ${errors.studentName ? 'border-destructive' : ''}`}
              />
              {errors.studentName && (
                <p className="text-sm text-destructive">{errors.studentName}</p>
              )}
            </div>

            {/* Student Class */}
            <div className="space-y-2">
              <Label htmlFor="studentClass" className="flex items-center gap-2 text-sm font-medium">
                <GraduationCap className="w-4 h-4" />
                {language === 'hinglish' ? 'Aapki Class' : 'Your Class'}
                <span className="text-destructive">*</span>
              </Label>
              <Select onValueChange={(value) => handleInputChange('studentClass', value)}>
                <SelectTrigger className={`elegant-input ${errors.studentClass ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder={
                    language === 'hinglish' 
                      ? 'Apni class select kariye'
                      : 'Select your class'
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="class-9">Class 9</SelectItem>
                  <SelectItem value="class-10">Class 10</SelectItem>
                  <SelectItem value="class-11">Class 11</SelectItem>
                  <SelectItem value="class-12">Class 12</SelectItem>
                </SelectContent>
              </Select>
              {errors.studentClass && (
                <p className="text-sm text-destructive">{errors.studentClass}</p>
              )}
            </div>

            {/* Student Age */}
            <div className="space-y-2">
              <Label htmlFor="studentAge" className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="w-4 h-4" />
                {language === 'hinglish' ? 'Aapki Umra' : 'Your Age'}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="studentAge"
                type="number"
                min="10"
                max="25"
                value={formData.studentAge}
                onChange={(e) => handleInputChange('studentAge', e.target.value)}
                placeholder={language === 'hinglish' ? 'Apni umra likhen (10-25)' : 'Enter your age (10-25)'}
                className={`elegant-input ${errors.studentAge ? 'border-destructive' : ''}`}
              />
              {errors.studentAge && (
                <p className="text-sm text-destructive">{errors.studentAge}</p>
              )}
            </div>


            {/* Submit Button */}
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full premium-button text-lg py-6"
                size="lg"
              >
                {language === 'hinglish' 
                  ? '🚀 Test Shuru Karen'
                  : '🚀 Start Test'
                }
              </Button>
            </div>
          </form>

          {/* Info Note */}
          <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-border/50">
            <p className="text-sm text-muted-foreground text-center">
              {language === 'hinglish' 
                ? '📝 Yeh jankari aapke career report ke liye use hogi aur safe rahegi'
                : '📝 This information will be used for your career report and kept secure'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDetailsForm;