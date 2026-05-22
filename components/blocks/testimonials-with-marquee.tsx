import { cn } from "@/lib/utils"
import { TestimonialCard, TestimonialAuthor } from "@/components/ui/testimonial-card"

interface TestimonialsSectionProps {
  title: string
  description: string
  testimonials: Array<{
    author: TestimonialAuthor
    text: string
    href?: string
  }>
  className?: string
}

export function TestimonialsSection({ 
  title,
  description,
  testimonials,
  className 
}: TestimonialsSectionProps) {
  return (
    <section className={cn(
      "bg-background text-foreground",
      "py-12 sm:py-24 md:py-32 px-0",
      className
    )} data-tour-id="home-testimonials">
      <div className="mx-auto flex max-w-container flex-col items-center gap-4 text-center sm:gap-16">
        <div className="flex flex-col items-center gap-4 px-4 sm:gap-8">
          <h2 className="max-w-[720px] text-3xl font-semibold leading-tight sm:text-5xl sm:leading-tight">
            {title}
          </h2>
          <p className="text-md max-w-[600px] font-medium text-muted-foreground sm:text-xl">
            {description}
          </p>
        </div>

        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
          {/*
            Continuous marquee: render the testimonial set TWICE side-by-side.
            The keyframe `marquee` translates each animated child by
            `-100% - var(--gap)` of its own width. With two identical tracks
            sitting next to each other, when track A scrolls fully off-screen
            left, track B has moved into A's original position — and the
            animation snaps both back to start, so the loop is visually
            seamless. (Previously we rendered ONE animated div with
            testimonials × 4 inside; that single track translated -100% of its
            own ENTIRE width — leaving the screen empty for a frame each cycle,
            which is the "bad break" reported.)
            Speed: 80s (was 40s) for a calm, readable pace.
            Pause-on-hover preserved via `group-hover:[animation-play-state:paused]`.
          */}
          <div className="group flex overflow-hidden p-2 [--gap:1rem] [gap:var(--gap)] flex-row [--duration:80s]">
            <div className="flex shrink-0 justify-around [gap:var(--gap)] animate-marquee flex-row group-hover:[animation-play-state:paused]">
              {testimonials.map((testimonial, i) => (
                <TestimonialCard key={`a-${i}`} {...testimonial} />
              ))}
            </div>
            <div
              aria-hidden="true"
              className="flex shrink-0 justify-around [gap:var(--gap)] animate-marquee flex-row group-hover:[animation-play-state:paused]"
            >
              {testimonials.map((testimonial, i) => (
                <TestimonialCard key={`b-${i}`} {...testimonial} />
              ))}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/3 bg-gradient-to-r from-background sm:block" />
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-background sm:block" />
        </div>
      </div>
    </section>
  )
}