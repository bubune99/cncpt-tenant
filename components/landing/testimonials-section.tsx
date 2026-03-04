import { TestimonialsSection as TestimonialsBlock } from "@/components/blocks/testimonials-with-marquee"

const testimonials = [
  {
    author: {
      name: "Sarah Chen",
      handle: "@sarahchen_dev",
      avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=sarah",
    },
    text: "CNCPT Web replaced three separate tools for us. Page builder, CMS, and email marketing — all in one. Our team is shipping 2x faster.",
  },
  {
    author: {
      name: "Marcus Rodriguez",
      handle: "@marcusrodz",
      avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=marcus",
    },
    text: "The AI assistant is genuinely useful. It writes product descriptions that actually convert, not generic fluff.",
  },
  {
    author: {
      name: "Emily Watson",
      handle: "@emwatson",
      avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=emily",
    },
    text: "Finally, a CMS that doesn't make me choose between flexibility and simplicity. The visual editor is incredible.",
  },
  {
    author: {
      name: "David Park",
      handle: "@dpark_tech",
      avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=david",
    },
    text: "We migrated from WordPress and Shopify to CNCPT Web. Less overhead, better performance, way lower costs.",
  },
  {
    author: {
      name: "Lisa Huang",
      handle: "@lisahuang",
      avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=lisa",
    },
    text: "The drag-and-drop builder lets our marketing team publish pages without bothering engineering. Game changer.",
  },
  {
    author: {
      name: "Alex Turner",
      handle: "@alexturner_io",
      avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=alex",
    },
    text: "99.9% uptime isn't just marketing — we've tracked it. Our e-commerce store hasn't had a single outage in 6 months.",
  },
]

export function TestimonialsLanding() {
  return (
    <TestimonialsBlock
      title="Loved by teams everywhere"
      description="See what our customers are saying about CNCPT Web."
      testimonials={testimonials}
    />
  )
}
