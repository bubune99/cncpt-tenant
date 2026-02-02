import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SubdomainForm } from "../subdomain-form"

export function CreateSubdomainCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Subdomain</CardTitle>
        <CardDescription>Add a new subdomain to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <SubdomainForm />
      </CardContent>
    </Card>
  )
}
