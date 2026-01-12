import {
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  Grid,
  Text,
  CardFooter,
} from '@backstage/ui';

interface CardData {
  title: string;
  description: string;
  linkText: string;
  linkHref: string;
}

const cardsData: CardData[] = [
  {
    title: 'Find services, datasets, components',
    description: 'Search across APIs and datasets',
    linkText: 'Search Integration toolkit',
    linkHref: '#',
  },
  {
    title: 'API Management',
    description: 'Share and manager your APIs, review access and audit logs',
    linkText: 'Share and manage my APIs',
    linkHref: '#',
  },
  {
    title: 'API Management',
    description: 'Share and manager your APIs, review access and audit logs',
    linkText: 'Share and manage my APIs',
    linkHref: '#',
  },
  {
    title: 'Development Environment',
    description:
      'Access the APIs, test in sandboxes, build an application or service',
    linkText: 'Access environment',
    linkHref: '#',
  },
  {
    title: 'Data Dictionary',
    description: 'View field names, definitions, formats, and rules.',
    linkText: 'Open Data Dictionary',
    linkHref: '#',
  },
  {
    title: 'Data Glossary',
    description:
      'Explore plain-language definitions for key terms and concepts.',
    linkText: 'Open Glossary',
    linkHref: '#',
  },
];

export const IntegrationToolkitCards = () => (
  <Grid.Root columns="12" gap="md">
    {cardsData.map((card, index) => (
      <Grid.Item key={index} colSpan={{ xs: '12', sm: '4' }}>
        <Card>
          <CardHeader>
            <Text variant="title-small">{card.title}</Text>
          </CardHeader>
          <CardBody>
            <Text>{card.description}</Text>
          </CardBody>
          <CardFooter>
            <ButtonLink href={card.linkHref}>{card.linkText}</ButtonLink>
          </CardFooter>
        </Card>
      </Grid.Item>
    ))}
  </Grid.Root>
);
