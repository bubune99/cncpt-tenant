import { puckHandler } from "@puckeditor/cloud-client";
import type { NextRequest } from "next/server";

export const POST = (request: NextRequest) => {
  return puckHandler(request, {
    ai: {
      context: `You are building pages for a professional blog and content management system.

Guidelines:
- Create clean, readable layouts with good visual hierarchy
- Use professional typography and spacing
- Include engaging hero sections for blog posts
- Add call-to-action elements where appropriate
- Maintain a consistent design language
- Optimize for readability on both desktop and mobile`,
    },
  });
};
