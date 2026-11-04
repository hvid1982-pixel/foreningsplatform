import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

/** Centered card used by login, sign-up and password pages. */
export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <Card>
        <CardHeader>
          <h1 className="text-2xl leading-tight font-semibold">{title}</h1>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
