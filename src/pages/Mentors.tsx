import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Trophy, BookOpen } from "lucide-react";
import Navigation from "@/components/Navigation";
import DarkModeToggle from "@/components/DarkModeToggle";
import mentorJuned from "@/assets/mentor-juned.jpg";
import mentorSohel from "@/assets/mentor-sohel.jpg";

const Mentors = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <DarkModeToggle />

      <section className="section-padding relative overflow-hidden pt-24">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
        <div className="max-w-6xl mx-auto container-padding relative">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Star className="w-4 h-4" /> Meet Our Mentors
            </div>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Visionaries shaping careers, building confidence, and igniting potential.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
            {/* Mentor 1 - Juned Tak */}
            <Card className="floating-card overflow-hidden group">
              <div className="flex flex-col">
                <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
                  <img
                    src={mentorJuned}
                    alt="Juned Tak — Career Coach and Corporate Soft Skills Trainer"
                    loading="lazy"
                    className="w-full object-contain group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6 sm:p-8 flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary mb-2">
                    <Trophy className="w-3.5 h-3.5" /> 12+ Years of Impact
                  </div>
                  <h3 className="text-2xl font-bold mb-1">Juned Tak</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Career Coach · Corporate Soft Skills Trainer · Motivational Speaker
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-[15px]">
                    Juned has spent over a decade igniting confidence in students, job seekers,
                    and professionals — turning hesitation into clarity and potential into
                    performance. From <span className="text-foreground font-medium">communication
                    and personality development</span> to <span className="text-foreground font-medium">
                    interview mastery and workplace excellence</span>, his energetic, hands-on
                    style has electrified workshops across schools, colleges, and corporates,
                    inspiring thousands to step into their best careers.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-5">
                    {["Communication", "Leadership", "Interview Prep", "Employability"].map((t) => (
                      <span key={t} className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium">{t}</span>
                    ))}
                  </div>
                </CardContent>
              </div>
            </Card>

            {/* Mentor 2 - Dr. Sohel Quadri */}
            <Card className="floating-card overflow-hidden group">
              <div className="flex flex-col">
                <div className="relative overflow-hidden bg-gradient-to-br from-secondary/10 to-primary/10">
                  <img
                    src={mentorSohel}
                    alt="Dr. Mohammed Sohel Quadri — Academician and Career Guidance Expert"
                    loading="lazy"
                    className="w-full object-contain group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6 sm:p-8 flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary mb-2">
                    <BookOpen className="w-3.5 h-3.5" /> 15+ Years · 10+ Research Papers
                  </div>
                  <h3 className="text-2xl font-bold mb-1">Dr. Mohammed Sohel Quadri</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Senior Academician · Physiotherapy Professional · Community Mentor
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-[15px]">
                    A rare blend of <span className="text-foreground font-medium">healer,
                    educator, and mentor</span> — Dr. Sohel has guided youth across India through
                    50+ career programs, 15+ placement drives, and countless one-on-one
                    counselling sessions. As General Secretary of the Gujarat Chapter of the
                    Association of Muslim Professionals and Founder of Ummah Physiotherapists'
                    Association, he turns expertise into empowerment — building careers,
                    communities, and conviction.
                  </p>
                  <div className="grid grid-cols-3 gap-3 mt-5">
                    <div className="text-center bg-muted/40 rounded-lg p-2">
                      <div className="text-lg font-bold text-primary">50+</div>
                      <div className="text-[10px] text-muted-foreground leading-tight">Career Programs</div>
                    </div>
                    <div className="text-center bg-muted/40 rounded-lg p-2">
                      <div className="text-lg font-bold text-primary">15+</div>
                      <div className="text-[10px] text-muted-foreground leading-tight">Placement Drives</div>
                    </div>
                    <div className="text-center bg-muted/40 rounded-lg p-2">
                      <div className="text-lg font-bold text-primary">5+</div>
                      <div className="text-[10px] text-muted-foreground leading-tight">Job Fairs</div>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Mentors;