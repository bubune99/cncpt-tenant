import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SubdomainForm } from "../subdomain-form"

export function CreateSubdomainCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Subdomain</CardTitle>
        <CardDescription>Add a new subdomain to your account with a custom emoji</CardDescription>
      </CardHeader>
      <CardContent>
        <SubdomainForm />
      </CardContent>
    </Card>
  )
}
