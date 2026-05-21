import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, MapPin, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Seo } from '@/components/Seo'
import { site } from '@/lib/site'

interface PublicInfoPageProps {
  kind: 'contact' | 'mentions-legales' | 'confidentialite'
}

function contentFor(kind: PublicInfoPageProps['kind']) {
  if (kind === 'contact') {
    return {
      title: 'Contact',
      description:
        'Informations de contact et fonctionnement du formulaire de réservation du Comité des Fêtes.',
      body: [
        `Le formulaire de ce site permet d'envoyer une demande de réservation au ${site.name}. Les demandes sont relues et traitées manuellement avant toute validation.`,
        site.contactEmail || site.contactPhone
          ? 'Les coordonnées directes ci-dessous peuvent être utilisées pour toute question complémentaire.'
          : "Les coordonnées directes du comité n'ont pas encore été publiées sur le site. En attendant, utilisez le formulaire de demande pour être recontacté.",
      ],
    }
  }
  if (kind === 'confidentialite') {
    return {
      title: 'Confidentialité',
      description:
        'Traitement des données transmises via le formulaire public de demande de réservation.',
      body: [
        "Les informations transmises dans le formulaire sont utilisées uniquement pour étudier une demande de réservation, recontacter le demandeur et organiser le retrait ou le retour du matériel.",
        "Les données demandées sont limitées aux éléments utiles au traitement de la demande : identité, moyen de contact, dates souhaitées, matériel demandé et message libre.",
        "Aucune validation automatique n'est effectuée : la demande est relue par le comité avant acceptation ou refus.",
      ],
    }
  }
  return {
    title: 'Mentions légales',
    description:
      'Informations d’identification du site de demande de réservation du Comité des Fêtes.',
    body: [
      `Ce site est publié pour le ${site.name}, situé à ${site.locality}.`,
      "Son objectif est de permettre l'envoi de demandes de réservation de matériel communal. Les disponibilités et confirmations sont gérées manuellement par le comité.",
      "Le site est hébergé sur l'infrastructure Netlify. Le nom de domaine actuel est une adresse technique de publication en attendant le domaine personnalisé.",
    ],
  }
}

export function PublicInfoPage({ kind }: PublicInfoPageProps) {
  const content = contentFor(kind)

  return (
    <div className="min-h-screen bg-background [background-image:linear-gradient(rgba(58,91,160,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(58,91,160,0.08)_1px,transparent_1px)] [background-size:28px_28px]">
      <Seo
        title={content.title}
        description={content.description}
        path={`/${kind}`}
      />
      <main className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Retour au formulaire
          </Link>
        </Button>

        <Card className="border-primary/20 shadow-md">
          <CardHeader>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              {kind === 'contact' ? (
                <Mail className="h-5 w-5" />
              ) : kind === 'confidentialite' ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <MapPin className="h-5 w-5" />
              )}
            </div>
            <CardTitle>{content.title}</CardTitle>
            <CardDescription>{content.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            {content.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}

            <div className="rounded-md border bg-muted/35 p-4">
              <div className="font-medium text-foreground">{site.name}</div>
              <div>{site.locality}, France</div>
              {site.streetAddress && <div>{site.streetAddress}</div>}
              {site.contactEmail && <div>{site.contactEmail}</div>}
              {site.contactPhone && <div>{site.contactPhone}</div>}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
