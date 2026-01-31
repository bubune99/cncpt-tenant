"use client";

import { ComponentConfig } from "@puckeditor/core";
import { Img } from "@react-email/components";

export interface EmailImageProps {
  src: string;
  alt: string;
  width: number | "auto";
  height: number | "auto";
  align: "left" | "center" | "right";
  borderRadius: number;
  href?: string;
  puck?: { isEditing?: boolean };
}

export const EmailImage = ({
  src,
  alt,
  width,
  height,
  align,
  borderRadius,
  href,
  puck,
}: EmailImageProps) => {
  const isEditing = puck?.isEditing ?? false;

  const imageStyle = {
    width: width === "auto" ? "auto" : width,
    height: height === "auto" ? "auto" : height,
    borderRadius,
    display: "block",
    maxWidth: "100%",
  };

  const wrapperStyle = {
    textAlign: align as "left" | "center" | "right",
    width: "100%",
  };

  // Placeholder for empty src
  const displaySrc = src || "https://placehold.co/600x300/e5e7eb/9ca3af?text=Add+Image";

  // In editor mode, use standard HTML
  if (isEditing) {
    const img = <img src={displaySrc} alt={alt} style={imageStyle} />;

    return (
      <div style={wrapperStyle}>
        {href ? <a href={href}>{img}</a> : img}
      </div>
    );
  }

  // In render mode, use React Email component
  const img = <Img src={displaySrc} alt={alt} style={imageStyle} />;

  return (
    <div style={wrapperStyle}>
      {href ? <a href={href}>{img}</a> : img}
    </div>
  );
};

export const EmailImageConfig: ComponentConfig<EmailImageProps> = {
  label: "Email Image",
  defaultProps: {
    src: "",
    alt: "Image description",
    width: "auto",
    height: "auto",
    align: "center",
    borderRadius: 0,
    href: "",
  },
  fields: {
    src: {
      type: "text",
      label: "Image URL",
    },
    alt: {
      type: "text",
      label: "Alt Text",
    },
    width: {
      type: "text",
      label: "Width (px or 'auto')",
    },
    height: {
      type: "text",
      label: "Height (px or 'auto')",
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
    borderRadius: {
      type: "number",
      label: "Border Radius (px)",
    },
    href: {
      type: "text",
      label: "Link URL (optional)",
    },
  },
  render: EmailImage,
};
