import { Marquee } from "@/components/ui/marquee"

const logos = [
  { name: "Next.js", svg: (
    <svg viewBox="0 0 180 180" className="h-6 w-6 fill-current"><mask id="m" height="180" maskUnits="userSpaceOnUse" width="180" x="0" y="0"><circle cx="90" cy="90" fill="#fff" r="90"/></mask><g mask="url(#m)"><circle cx="90" cy="90" fill="currentColor" r="90"/><path d="M149.508 157.52L69.142 54H54v71.97h12.114V69.384l73.885 95.461a90.304 90.304 0 009.509-7.325z" fill="url(#a)"/><rect fill="url(#b)" height="72" width="12" x="115" y="54"/></g><defs><linearGradient id="a" gradientUnits="userSpaceOnUse" x1="109" x2="144.5" y1="116.5" y2="160.5"><stop stopColor="var(--background)"/><stop offset="1" stopColor="var(--background)" stopOpacity="0"/></linearGradient><linearGradient id="b" gradientUnits="userSpaceOnUse" x1="121" x2="120.799" y1="54" y2="106.875"><stop stopColor="var(--background)"/><stop offset="1" stopColor="var(--background)" stopOpacity="0"/></linearGradient></defs></svg>
  )},
  { name: "Tailwind CSS", svg: (
    <svg viewBox="0 0 54 33" className="h-5 w-auto fill-current"><path d="M27 0c-7.2 0-11.7 3.6-13.5 10.8 2.7-3.6 5.85-4.95 9.45-4.05 2.054.513 3.522 2.004 5.147 3.653C30.744 13.09 33.808 16.2 40.5 16.2c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.513-3.522-2.004-5.147-3.653C36.756 3.11 33.692 0 27 0zM13.5 16.2C6.3 16.2 1.8 19.8 0 27c2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C17.244 29.29 20.308 32.4 27 32.4c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.513-3.522-2.004-5.147-3.653C23.256 19.31 20.192 16.2 13.5 16.2z"/></svg>
  )},
  { name: "Stripe", svg: (
    // Stripe "S" mark — icon-style to match the other brand marks (icon + text label)
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
      <path d="M13.479 9.883c-1.626-.604-2.512-1.067-2.512-1.803 0-.622.511-.977 1.423-.977 1.667 0 3.379.642 4.558 1.22l.666-4.111c-.935-.446-2.847-1.177-5.49-1.177-1.87 0-3.425.488-4.536 1.4-1.156.954-1.755 2.336-1.755 4.005 0 3.024 1.847 4.314 4.857 5.405 1.936.69 2.585 1.18 2.585 1.937 0 .732-.629 1.155-1.762 1.155-1.403 0-3.716-.689-5.231-1.578L5.6 19.526c1.296.737 3.694 1.474 6.182 1.474 1.973 0 3.616-.467 4.731-1.337 1.244-.97 1.886-2.398 1.886-4.272 0-3.103-1.876-4.395-4.92-5.508h.001z"/>
    </svg>
  )},
  { name: "Vercel", svg: (
    <svg viewBox="0 0 76 65" className="h-5 w-auto fill-current"><path d="M37.5274 0L75.0548 65H0L37.5274 0Z"/></svg>
  )},
  { name: "Cloudflare", svg: (
    // Cloudflare cloud mark — icon-style to match the other brand marks (icon + text label)
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
      <path d="M16.79 14.197c.144-.501.087-.962-.157-1.302-.224-.31-.598-.49-1.052-.514l-8.595-.111a.171.171 0 0 1-.137-.073.184.184 0 0 1-.018-.165.236.236 0 0 1 .211-.156l8.674-.111c1.029-.047 2.142-.881 2.532-1.898l.495-1.29a.31.31 0 0 0 .015-.18A5.722 5.722 0 0 0 13.27 3.5a5.717 5.717 0 0 0-5.292 3.55 2.6 2.6 0 0 0-1.804-.5 2.587 2.587 0 0 0-2.246 2.246 2.602 2.602 0 0 0 .065 1.034A3.677 3.677 0 0 0 .5 13.476c0 .089.007.177.013.265a.171.171 0 0 0 .168.158h15.78a.214.214 0 0 0 .206-.156l.122-.428.001-.118zm2.182-3.93c-.078 0-.158.002-.236.007a.135.135 0 0 0-.116.094l-.337 1.165c-.144.5-.087.96.157 1.301.224.31.597.49 1.052.514l1.832.112a.17.17 0 0 1 .135.073.183.183 0 0 1 .018.166.237.237 0 0 1-.211.156l-1.904.111c-1.034.048-2.143.881-2.533 1.898l-.137.354a.103.103 0 0 0 .092.139h6.553a.178.178 0 0 0 .172-.13c.114-.41.176-.84.176-1.286a3.926 3.926 0 0 0-3.93-3.926l-.001.001z"/>
    </svg>
  )},
  { name: "OpenAI", svg: (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>
  )},
]

export function LogoMarquee() {
  return (
    <section className="py-16 border-y border-border" data-tour-id="home-logos">
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <p className="text-center text-sm text-muted-foreground">
          Built on the tools you already love
        </p>
      </div>
      <Marquee pauseOnHover className="[--duration:30s]">
        {logos.map((logo) => (
          <div
            key={logo.name}
            className="flex items-center gap-2 mx-8 text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            {logo.svg}
            <span className="text-sm font-medium">{logo.name}</span>
          </div>
        ))}
      </Marquee>
    </section>
  )
}
