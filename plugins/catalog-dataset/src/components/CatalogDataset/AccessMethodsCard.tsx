import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Link
} from '@material-ui/core';
import { EntityRefLink } from '@backstage/plugin-catalog-react';

type AccessMethod = {
  id: string;
  title: string;
  url: string;
  type?: string;
  format?: string;
  description?: string;
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
    <Card
      style={{
        borderRadius: 8,
        marginBottom: 16,
        border: '2px solid rgba(0,0,0,0.23)',
      }}
      variant="outlined"
    >
      <CardHeader title="Access Methods" />
      <CardContent>
        {!hasApis && !hasOther ? (
          <Typography variant="body2">
            No access methods defined.
          </Typography>
        ) : (
          <>
            {hasApis && (
              <>
                <Typography
                  variant="subtitle1"
                  style={{ marginBottom: 8, fontWeight: 600 }}
                >
                  APIs
                </Typography>

                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {apiEntityRefs!.map(apiRef => (
                    <li key={apiRef}>
                      <EntityRefLink entityRef={apiRef} />
                    </li>
                  ))}
                </ul>
              </>
            )}

            {hasOther && (
              <>
                <Typography
                  variant="subtitle1"
                  style={{ marginTop: hasApis ? 16 : 0, marginBottom: 8, fontWeight: 600 }}
                >
                  Other
                </Typography>

                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {accessMethods!.map(m => (
                    <li key={m.id} style={{ marginBottom: 8 }}>
                    <Typography variant="body2">
                        <Link
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        >
                        {m.title}
                        </Link>
                        {(m.type || m.format) && (
                        <>
                            {' '}
                            ({m.type}
                            {m.format ? ` • ${m.format}` : ''})
                        </>
                        )}
                    </Typography>

                    {m.description && (
                        <Typography variant="body2" color="textSecondary" style={{ whiteSpace: 'pre-line' }}>
                        {m.description}
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