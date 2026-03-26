import { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Link,
  IconButton,
} from '@material-ui/core';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

type SchemaField = {
  columnName: string;
  dataType?: string;
  dataPrecision?: string;
  shortName?: string;
  columnComments?: string;
};

type SchemaTable = {
  name: string;
  resourceType?: string;
  fields?: SchemaField[];
};

type Props = {
  tables?: SchemaTable[];
};

export const SchemaCard = ({ tables }: Props) => {
  const safeTables = tables ?? [];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex >= safeTables.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex, safeTables.length]);

  const currentTable = safeTables[currentIndex];

  const goPrevious = () => {
    setCurrentIndex(index => Math.max(0, index - 1));
  };

  const goNext = () => {
    setCurrentIndex(index =>
      Math.min(safeTables.length - 1, index + 1),
    );
  };

  return (
    <Card
      style={{
        borderRadius: 8,
        marginBottom: 16,
        border: '2px solid rgba(0,0,0,0.23)',
      }}
      variant="outlined"
    >
      <CardHeader
        title="Schema"
        action={
          safeTables.length > 1 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 4,
              }}
            >
              <Typography variant="body2">
                {currentIndex + 1} of {safeTables.length}
              </Typography>

              <IconButton
                aria-label="Previous schema table"
                onClick={goPrevious}
                disabled={currentIndex === 0}
                size="small"
              >
                <ChevronLeftIcon />
              </IconButton>

              <IconButton
                aria-label="Next schema table"
                onClick={goNext}
                disabled={currentIndex === safeTables.length - 1}
                size="small"
              >
                <ChevronRightIcon />
              </IconButton>
            </div>
          ) : undefined
        }
      />

      <CardContent>
        {currentTable ? (
          <div style={{ marginBottom: 16 }}>
            <Typography
              variant="subtitle2"
              style={{ marginBottom: 4, fontWeight: 600 }}
            >
              {currentTable.name}
            </Typography>

            {currentTable.fields?.length ? (
              <Table
                size="small"
                style={{
                  border: '1px solid rgba(0,0,0,0.23)',
                  borderCollapse: 'collapse',
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell
                      style={{
                        fontWeight: 700,
                        border: '1px solid rgba(0,0,0,0.23)',
                      }}
                    >
                      Field Name
                    </TableCell>

                    <TableCell
                      style={{
                        fontWeight: 700,
                        border: '1px solid rgba(0,0,0,0.23)',
                      }}
                    >
                      Type
                    </TableCell>

                    <TableCell
                      style={{
                        fontWeight: 700,
                        border: '1px solid rgba(0,0,0,0.23)',
                      }}
                    >
                      Description
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {currentTable.fields.map(field => (
                    <TableRow key={field.columnName}>
                      <TableCell
                        style={{ border: '1px solid rgba(0,0,0,0.23)' }}
                      >
                        {field.columnName}
                      </TableCell>

                      <TableCell
                        style={{ border: '1px solid rgba(0,0,0,0.23)' }}
                      >
                        {field.dataType
                          ? field.dataPrecision
                            ? `${field.dataType} (${field.dataPrecision})`
                            : field.dataType
                          : '—'}
                      </TableCell>

                      <TableCell
                        style={{ border: '1px solid rgba(0,0,0,0.23)' }}
                      >
                        {field.columnComments ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography variant="body2">
                No fields available.
              </Typography>
            )}
          </div>
        ) : (
          <Typography variant="body2">
            No schema available.
          </Typography>
        )}

        <Link href="https://www.notimplemented.net/" target="_blank">
          {'Download schema'}
        </Link>
      </CardContent>
    </Card>
  );
};