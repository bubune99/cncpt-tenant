import { StackHandler } from "@stackframe/stack"
import { stackServerApp } from "@/stack"

export default function SubdomainHandler(props: { params: Promise<{ stack: string[] }> }) {
  return <StackHandler fullPage app={stackServerApp} params={props.params} />
}
