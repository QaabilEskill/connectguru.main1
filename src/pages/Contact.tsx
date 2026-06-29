import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Mail,
  Phone,
  MessageCircle,
  Sparkles,
  ArrowRight,
  Briefcase,
  Compass,
  Bot,
  Loader2,
  Send,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';

/* small inline reveal helper to match homepage feel */
function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current || inView) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setInView(true),
      { threshold, rootMargin: '0px 0px -5% 0px' }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [inView, threshold]);
  return { ref, inView };
}

function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.15);
  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ease-out ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const supportChannels = [
  {
    icon: Bot,
    title: 'AI Tutor Support',
    desc: 'Issues with the tutor, voice loop, or lesson playback.',
    action: 'info.connectguru@gmail.com',
    href: 'mailto:info.connectguru@gmail.com?subject=AI%20Tutor%20Support',
  },
  {
    icon: Compass,
    title: 'Career Guidance',
    desc: 'Questions about the psychometric test, results, or roadmap.',
    action: 'Chat on WhatsApp',
    href: 'https://wa.me/918302304020',
  },
  {
    icon: Briefcase,
    title: 'Business & Partnerships',
    desc: 'Schools, mentors, and partnership inquiries.',
    action: 'info.connectguru@gmail.com',
    href: 'mailto:info.connectguru@gmail.com?subject=Partnership%20Inquiry',
  },
];

const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast({
        title: 'Message sent',
        description: "Thanks for reaching out — we'll reply within a few hours.",
      });
      setName('');
      setEmail('');
      setMessage('');
      setLoading(false);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* ambient brand glow, matches homepage */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-secondary/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at 50% 20%, black 30%, transparent 75%)',
          }}
        />
      </div>

      <Navigation />

      <main className="container mx-auto px-6 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <Reveal className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold uppercase tracking-[0.22em] mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Contact
            </div>
            <h1 className="font-instrument text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.05] text-foreground">
              Let's talk about{' '}
              <span className="italic text-primary">your journey.</span>
            </h1>
            <p className="mt-5 text-muted-foreground text-base md:text-lg leading-relaxed max-w-xl mx-auto">
              Whether it's product support, career guidance, or a partnership —
              the ConnectGuru team replies within a few hours.
            </p>
          </Reveal>

          <div className="grid lg:grid-cols-5 gap-8 lg:gap-10">
            {/* Form */}
            <Reveal delay={80} className="lg:col-span-3">
              <div className="rounded-3xl border border-border bg-card/90 backdrop-blur-sm shadow-sm p-8 md:p-10">
                <div className="mb-8">
                  <h2 className="font-instrument text-2xl md:text-3xl tracking-tight">
                    Send us a message
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    We typically respond within 2–4 hours during business hours.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Name
                      </label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        required
                        className="h-11 bg-background/60 border-border/70 focus-visible:ring-primary/40 focus-visible:border-primary/40 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="h-11 bg-background/60 border-border/70 focus-visible:ring-primary/40 focus-visible:border-primary/40 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Message
                    </label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we help?"
                      required
                      rows={6}
                      className="bg-background/60 border-border/70 focus-visible:ring-primary/40 focus-visible:border-primary/40 transition-all resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    size="lg"
                    className="w-full group bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-[0.99] transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        Send message
                        <Send className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </Reveal>

            {/* Direct channels */}
            <div className="lg:col-span-2 space-y-5">
              <Reveal delay={120}>
                <a
                  href="mailto:info.connectguru@gmail.com"
                  className="group block rounded-2xl border border-border bg-card/90 backdrop-blur-sm p-6 hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/10 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1">
                        Email
                      </p>
                      <p className="font-semibold text-foreground truncate">
                        info.connectguru@gmail.com
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Best for detailed inquiries.
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground mt-1 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </a>
              </Reveal>

              <Reveal delay={180}>
                <a
                  href="https://wa.me/918302304020"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-2xl border border-border bg-card/90 backdrop-blur-sm p-6 hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/10 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1">
                        WhatsApp
                      </p>
                      <p className="font-semibold text-foreground">
                        +91 83023 04020
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Fastest response · Mon–Sat
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground mt-1 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </a>
              </Reveal>

              <Reveal delay={240}>
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground text-sm">
                        Quick response promise
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        We aim to reply within 2–4 hours during business hours.
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>

          {/* Support categories */}
          <div className="mt-20">
            <Reveal className="max-w-2xl mx-auto text-center mb-10">
              <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-primary mb-3">
                Reach the right team
              </div>
              <h2 className="font-instrument text-3xl md:text-4xl tracking-tight leading-tight">
                Choose the channel that{' '}
                <span className="italic text-primary">fits your need.</span>
              </h2>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-5">
              {supportChannels.map((s, i) => (
                <Reveal key={s.title} delay={i * 80}>
                  <a
                    href={s.href}
                    target={s.href.startsWith('http') ? '_blank' : undefined}
                    rel={s.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="group h-full flex flex-col rounded-2xl border border-border bg-card/90 backdrop-blur-sm p-6 hover:border-primary/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <s.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1.5">
                      {s.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                      {s.desc}
                    </p>
                    <div className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                      {s.action}
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;
