import {
  Card,
  CardContent,
  CardHeader,
  Link,
  Typography,
} from '@material-ui/core';
import { EntityRefLink } from '@backstage/plugin-catalog-react';

type AccessMethod = {
  id: string;
  title: string;
  url: string;
  type?: string;
  format?: string;
  description?: string;
  entityRef?: string;
};

type Props = {
  accessMethods?: AccessMethod[];
  apiEntityRefs?: string[];
};

export const AccessMethodsCard = ({
  accessMethods,
  apiEntityRefs,
}: Props) => {
  const hasApis = !!apiEntityRefs?.length;
  const hasOther = !!accessMethods?.length;

  return (
    <Card>
      <CardHeader title="Access Methods" />
      <CardContent>
        {!hasApis && !hasOther ? (
          <Typography variant="body2">No access methods defined.</Typography>
        ) : (
          <>
            {hasApis && (
              <>
                <Typography variant="h6">APIs</Typography>
                <ul>
                  {apiEntityRefs!.map(apiRef => (
                    <li key={apiRef}>
                      <EntityRefLink entityRef={apiRef} defaultKind="API" />
                    </li>
                  ))}
                </ul>
              </>
            )}

            {hasOther && (
              <>
                <Typography variant="h6">Other</Typography>
                <ul>
                  {accessMethods!.map(method => (
                    <li key={method.id}>
                      {method.entityRef ? (
                        <>
                          <EntityRefLink
                            entityRef={method.entityRef}
                            defaultKind="Resource"
                            title={method.title}
                          />
                          {' '}
                          <Link
                            href={method.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open
                          </Link>
                        </>
                      ) : (
                        <Link
                          href={method.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {method.title}
                        </Link>
                      )}

                      {(method.type || method.format) && (
                        <>
                          {' '}
                          ({method.type}
                          {method.format ? ` • ${method.format}` : ''})
                        </>
                      )}

                      {method.description && (
                        <Typography variant="body2">
                          {method.description}
                        </Typography>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
