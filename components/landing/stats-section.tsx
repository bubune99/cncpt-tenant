"use client"

import { NumberTicker } from "@/components/ui/number-ticker"

const stats = [
  { value: 99.9, suffix: "%", label: "Uptime SLA", decimals: 1 },
  { prefix: "<", value: 100, suffix: "ms", label: "Global Latency", decimals: 0 },
  { value: 50, suffix: "+", label: "Integrations", decimals: 0 },
  { label: "Support", static: "24/7" },
] as const

export function StatsSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x divide-border">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center md:px-8">
              <div className="text-4xl md:text-5xl font-bold mb-2">
                {"static" in stat ? (
                  <span className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                    {stat.static}
                  </span>
                ) : (
                  <span className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                    {"prefix" in stat && stat.prefix}
                    <NumberTicker
                      value={stat.value}
                      decimalPlaces={stat.decimals}
                      className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent"
                    />
                    {stat.suffix}
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
