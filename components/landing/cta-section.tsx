import Link from "next/link"
import { ShineBorder } from "@/components/ui/shine-border"

export function CTASection() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <ShineBorder
          borderRadius={24}
          borderWidth={2}
          duration={10}
          color={["#1e3a5f", "#c2410c", "#1e3a5f"]}
          className="w-full min-w-0 bg-card dark:bg-card p-12 md:p-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-foreground">
            Ready to build something
            <br />
            <span className="bg-gradient-to-r from-[#1e3a5f] via-[#1e3a5f] to-[#c2410c] dark:from-blue-400 dark:via-blue-300 dark:to-orange-400 bg-clip-text text-transparent">
              extraordinary?
            </span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Start your free trial today. No credit card required.
            Cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 text-base font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
            >
              Start free trial
            </Link>
            <Link
              href="/book"
              className="px-8 py-4 text-base font-medium rounded-xl border border-border hover:border-border/80 bg-muted/50 hover:bg-muted transition-all text-foreground"
            >
              Book a demo
            </Link>
          </div>
        </ShineBorder>
      </div>
    </section>
  )
}
