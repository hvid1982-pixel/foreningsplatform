import { Building2, Users } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { da } from "@/messages/da";

export default function LandingPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-20">
      <section className="max-w-3xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">{da.landing.title}</h1>
        <p className="text-lg text-muted-foreground">{da.landing.intro}</p>
        <Button asChild size="lg">
          <Link href="/opret-konto">{da.landing.cta}</Link>
        </Button>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-2" aria-label={da.landing.cta}>
        <Card>
          <CardHeader>
            <Users className="size-6 text-primary" aria-hidden />
            <CardTitle>{da.landing.forAssociations}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">{da.landing.forAssociationsText}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Building2 className="size-6 text-primary" aria-hidden />
            <CardTitle>{da.landing.forCompanies}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">{da.landing.forCompaniesText}</CardContent>
        </Card>
      </section>

      <Alert variant="info" className="mt-12">
        <AlertDescription>{da.landing.status}</AlertDescription>
      </Alert>
    </div>
  );
}
