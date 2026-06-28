type Status = 'idle' | 'listening' | 'thinking' | 'speaking';

export default function AIOrb({ status }: { status: Status }) {
  const speaking = status === 'speaking';
  const thinking = status === 'thinking';
  const listening = status === 'listening';
  const statusText = thinking ? 'Thinking…' : speaking ? 'Speaking' : listening ? 'Listening' : 'Live';

  // ChatGPT voice-mode style: a single soft glowing sphere on pure black,
  // gently breathing, with subtle morph during speaking/listening.
  const breathDuration = speaking ? '1.4s' : listening ? '2.2s' : thinking ? '1.8s' : '4s';
  const morphDuration = speaking ? '3.2s' : listening ? '5s' : '7s';
  const intensity = speaking ? 1.08 : listening ? 1.03 : thinking ? 1.02 : 1.0;

  return (
    <div
      className="relative w-full h-full rounded-2xl overflow-hidden bg-black"
      aria-label={`AI English Tutor is ${statusText.toLowerCase()}`}
    >
      {/* Soft ambient glow behind orb */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="absolute rounded-full"
          style={{
            width: 'min(80vmin, 520px)',
            height: 'min(80vmin, 520px)',
            background:
              'radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(200,220,255,0.08) 30%, transparent 65%)',
            filter: 'blur(40px)',
            animation: `gptGlow ${breathDuration} ease-in-out infinite`,
          }}
        />

        {/* Main morphing sphere — ChatGPT voice style */}
        <div
          className="relative rounded-full"
          style={{
            width: 'min(50vmin, 300px)',
            height: 'min(50vmin, 300px)',
            transform: `scale(${intensity})`,
            transition: 'transform 700ms cubic-bezier(.2,.7,.2,1)',
            background:
              'radial-gradient(circle at 35% 30%, #ffffff 0%, #e8f0ff 18%, #b8c8ff 42%, #6a7fd1 70%, #1a1f3a 100%)',
            boxShadow:
              '0 0 80px 10px rgba(180,200,255,0.35), inset -20px -30px 60px rgba(20,25,55,0.55), inset 15px 20px 50px rgba(255,255,255,0.35)',
            animation: `gptBreath ${breathDuration} ease-in-out infinite`,
          }}
        >
          {/* Inner morphing conic swirl for "alive" feel */}
          <div
            className="absolute inset-0 rounded-full overflow-hidden opacity-70"
            style={{
              background:
                'conic-gradient(from 0deg, rgba(255,255,255,0.0), rgba(200,220,255,0.6), rgba(150,170,255,0.0), rgba(255,255,255,0.5), rgba(200,220,255,0.0))',
              mixBlendMode: 'screen',
              filter: 'blur(14px)',
              animation: `gptSwirl ${morphDuration} linear infinite`,
            }}
          />
          {/* Specular highlight */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              top: '12%', left: '20%', width: '34%', height: '24%',
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 70%)',
              filter: 'blur(3px)',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes gptBreath {
          0%, 100% { border-radius: 50%; filter: blur(0px); }
          50% { border-radius: 48% 52% 53% 47% / 49% 51% 49% 51%; filter: blur(0.4px); }
        }
        @keyframes gptSwirl { to { transform: rotate(360deg); } }
        @keyframes gptGlow {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.08); }
        }
      `}</style>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/5 backdrop-blur text-white/80 text-xs font-medium flex items-center gap-1.5 border border-white/10">
        <span className={`h-1.5 w-1.5 rounded-full ${thinking ? 'bg-amber-300 animate-pulse' : speaking ? 'bg-sky-300 animate-pulse' : listening ? 'bg-blue-300 animate-pulse' : 'bg-emerald-300'}`} />
        {statusText}
      </div>
    </div>
  );
}
