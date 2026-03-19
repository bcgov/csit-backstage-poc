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
} from '@material-ui/core';

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
  return (
    <Card
      style={{
        borderRadius: 8,
        marginBottom: 16,
        border: '2px solid rgba(0,0,0,0.23)',
      }}
      variant="outlined"
    >
      <CardHeader title="Schema" />
      <CardContent>
        {tables?.length ? (
          tables.map(table => (
            <div key={table.name} style={{ marginBottom: 16 }}>
              <Typography
                variant="subtitle2"
                style={{ marginBottom: 4, fontWeight: 600 }}
              >
                {table.name}
              </Typography>

              {table.fields?.length ? (
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
                    {table.fields.map(field => (
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
                <Typography variant="body2">No fields available.</Typography>
              )}
            </div>
          ))
        ) : (
          <Typography variant="body2">No schema available.</Typography>
        )}
                        <Link
                          href="https://www.notimplemented.net/"
                          target="_blank"
                        >
                          {'Download schema'}
                        </Link>
      </CardContent>
    </Card>
  );
};