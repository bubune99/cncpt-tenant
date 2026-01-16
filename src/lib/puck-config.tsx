import type { Config, Data } from "@measured/puck"
import type { JSX } from "react"

// Define all the component configurations
export const puckConfig: Config = {
  categories: {
    typography: {
      title: "Typography",
      components: ["Heading", "Text", "Quote"],
    },
    layout: {
      title: "Layout",
      components: ["Columns", "Card", "Section"],
    },
    media: {
      title: "Media",
      components: ["Image", "Hero"],
    },
    interactive: {
      title: "Interactive",
      components: ["Button", "ButtonGroup"],
    },
  },
  components: {
    Heading: {
      fields: {
        text: {
          type: "text",
          label: "Heading Text",
        },
        level: {
          type: "select",
          label: "Heading Level",
          options: [
            { label: "H1", value: "h1" },
            { label: "H2", value: "h2" },
            { label: "H3", value: "h3" },
            { label: "H4", value: "h4" },
          ],
        },
        align: {
          type: "radio",
          label: "Alignment",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
        },
      },
      defaultProps: {
        text: "Heading",
        level: "h2",
        align: "left",
      },
      render: ({ text, level, align }) => {
        const Tag = level as keyof JSX.IntrinsicElements
        const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"
        const sizeClass =
          level === "h1" ? "text-4xl" : level === "h2" ? "text-3xl" : level === "h3" ? "text-2xl" : "text-xl"
        return <Tag className={`font-bold ${sizeClass} ${alignClass}`}>{text}</Tag>
      },
    },
    Text: {
      fields: {
        content: {
          type: "textarea",
          label: "Content",
        },
        size: {
          type: "select",
          label: "Size",
          options: [
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
          ],
        },
      },
      defaultProps: {
        content: "Enter your text here...",
        size: "md",
      },
      render: ({ content, size }) => {
        const sizeClass = size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base"
        return <p className={`${sizeClass} text-muted-foreground`}>{content}</p>
      },
    },
    Quote: {
      fields: {
        text: {
          type: "textarea",
          label: "Quote Text",
        },
        author: {
          type: "text",
          label: "Author",
        },
      },
      defaultProps: {
        text: "This is a beautiful quote that inspires action.",
        author: "Anonymous",
      },
      render: ({ text, author }) => (
        <blockquote className="border-l-4 border-primary pl-4 py-2 italic">
          <p className="text-lg">&ldquo;{text}&rdquo;</p>
          {author && <footer className="text-sm text-muted-foreground mt-2">— {author}</footer>}
        </blockquote>
      ),
    },
    Columns: {
      fields: {
        columns: {
          type: "select",
          label: "Number of Columns",
          options: [
            { label: "2 Columns", value: "2" },
            { label: "3 Columns", value: "3" },
            { label: "4 Columns", value: "4" },
          ],
        },
        gap: {
          type: "select",
          label: "Gap Size",
          options: [
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
          ],
        },
      },
      defaultProps: {
        columns: "3",
        gap: "md",
      },
      render: ({ columns, gap }) => {
        const colClass = columns === "2" ? "grid-cols-2" : columns === "4" ? "grid-cols-4" : "grid-cols-3"
        const gapClass = gap === "sm" ? "gap-2" : gap === "lg" ? "gap-8" : "gap-4"
        return (
          <div className={`grid ${colClass} ${gapClass}`}>
            {Array.from({ length: Number.parseInt(columns) }).map((_, i) => (
              <div key={i} className="bg-muted rounded-lg p-4 min-h-[100px] flex items-center justify-center">
                <span className="text-muted-foreground">Column {i + 1}</span>
              </div>
            ))}
          </div>
        )
      },
    },
    Card: {
      fields: {
        title: {
          type: "text",
          label: "Title",
        },
        description: {
          type: "textarea",
          label: "Description",
        },
        showBorder: {
          type: "radio",
          label: "Show Border",
          options: [
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ],
        },
      },
      defaultProps: {
        title: "Card Title",
        description: "This is a card description with some helpful information.",
        showBorder: "yes",
      },
      render: ({ title, description, showBorder }) => (
        <div className={`rounded-lg p-6 ${showBorder === "yes" ? "border border-border" : "bg-muted"}`}>
          <h3 className="font-semibold text-lg mb-2">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
      ),
    },
    Section: {
      fields: {
        padding: {
          type: "select",
          label: "Padding",
          options: [
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
            { label: "Extra Large", value: "xl" },
          ],
        },
        background: {
          type: "select",
          label: "Background",
          options: [
            { label: "None", value: "none" },
            { label: "Muted", value: "muted" },
            { label: "Primary", value: "primary" },
          ],
        },
      },
      defaultProps: {
        padding: "md",
        background: "none",
      },
      render: ({ padding, background, puck }) => {
        const padClass = padding === "sm" ? "py-4" : padding === "lg" ? "py-16" : padding === "xl" ? "py-24" : "py-8"
        const bgClass =
          background === "muted" ? "bg-muted" : background === "primary" ? "bg-primary text-primary-foreground" : ""
        return (
          <section className={`${padClass} ${bgClass}`}>
            <div className="container mx-auto px-4">
              <p className="text-center text-muted-foreground">Section content area</p>
            </div>
          </section>
        )
      },
    },
    Image: {
      fields: {
        src: {
          type: "text",
          label: "Image URL",
        },
        alt: {
          type: "text",
          label: "Alt Text",
        },
        rounded: {
          type: "radio",
          label: "Rounded Corners",
          options: [
            { label: "None", value: "none" },
            { label: "Small", value: "sm" },
            { label: "Large", value: "lg" },
            { label: "Full", value: "full" },
          ],
        },
      },
      defaultProps: {
        src: "/beautiful-landscape.png",
        alt: "Placeholder image",
        rounded: "lg",
      },
      render: ({ src, alt, rounded }) => {
        const roundedClass =
          rounded === "sm" ? "rounded" : rounded === "lg" ? "rounded-lg" : rounded === "full" ? "rounded-full" : ""
        return <img src={src || "/placeholder.svg"} alt={alt} className={`w-full h-auto ${roundedClass}`} />
      },
    },
    Hero: {
      fields: {
        title: {
          type: "text",
          label: "Title",
        },
        subtitle: {
          type: "textarea",
          label: "Subtitle",
        },
        imageUrl: {
          type: "text",
          label: "Background Image URL",
        },
        height: {
          type: "select",
          label: "Height",
          options: [
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
            { label: "Full Screen", value: "full" },
          ],
        },
      },
      defaultProps: {
        title: "Welcome to Our Site",
        subtitle: "Discover amazing things with us",
        imageUrl: "/abstract-gradient.png",
        height: "md",
      },
      render: ({ title, subtitle, imageUrl, height }) => {
        const heightClass =
          height === "sm" ? "h-64" : height === "lg" ? "h-[600px]" : height === "full" ? "h-screen" : "h-96"
        return (
          <div
            className={`relative ${heightClass} flex items-center justify-center bg-cover bg-center`}
            style={{ backgroundImage: `url(${imageUrl})` }}
          >
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10 text-center text-white px-4">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">{title}</h1>
              <p className="text-xl md:text-2xl opacity-90">{subtitle}</p>
            </div>
          </div>
        )
      },
    },
    Button: {
      fields: {
        label: {
          type: "text",
          label: "Button Text",
        },
        href: {
          type: "text",
          label: "Link URL",
        },
        variant: {
          type: "select",
          label: "Variant",
          options: [
            { label: "Primary", value: "primary" },
            { label: "Secondary", value: "secondary" },
            { label: "Outline", value: "outline" },
            { label: "Ghost", value: "ghost" },
          ],
        },
        size: {
          type: "radio",
          label: "Size",
          options: [
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
          ],
        },
      },
      defaultProps: {
        label: "Click Me",
        href: "#",
        variant: "primary",
        size: "md",
      },
      render: ({ label, href, variant, size }) => {
        const baseClass = "inline-flex items-center justify-center font-medium rounded-lg transition-colors"
        const sizeClass = size === "sm" ? "px-3 py-1.5 text-sm" : size === "lg" ? "px-6 py-3 text-lg" : "px-4 py-2"
        const variantClass =
          variant === "secondary"
            ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            : variant === "outline"
              ? "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              : variant === "ghost"
                ? "hover:bg-accent hover:text-accent-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
        return (
          <a href={href} className={`${baseClass} ${sizeClass} ${variantClass}`}>
            {label}
          </a>
        )
      },
    },
    ButtonGroup: {
      fields: {
        primaryLabel: {
          type: "text",
          label: "Primary Button",
        },
        primaryHref: {
          type: "text",
          label: "Primary Link",
        },
        secondaryLabel: {
          type: "text",
          label: "Secondary Button",
        },
        secondaryHref: {
          type: "text",
          label: "Secondary Link",
        },
      },
      defaultProps: {
        primaryLabel: "Get Started",
        primaryHref: "#",
        secondaryLabel: "Learn More",
        secondaryHref: "#",
      },
      render: ({ primaryLabel, primaryHref, secondaryLabel, secondaryHref }) => (
        <div className="flex gap-4 items-center">
          <a
            href={primaryHref}
            className="inline-flex items-center justify-center font-medium rounded-lg px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {primaryLabel}
          </a>
          <a
            href={secondaryHref}
            className="inline-flex items-center justify-center font-medium rounded-lg px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {secondaryLabel}
          </a>
        </div>
      ),
    },
  },
}

// Initial data for a demo page
export const initialData: Data = {
  content: [],
  root: {},
}
