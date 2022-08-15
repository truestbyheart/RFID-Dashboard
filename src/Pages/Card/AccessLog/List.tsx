import { Button, Paper, Table, TableContainer, TableHead, TableRow, TableCell, TextField, TableBody, TablePagination } from '@mui/material';
import { invoke } from '@tauri-apps/api';
import React, { useEffect } from 'react'
import { Col, Container, Row } from 'react-bootstrap';

interface Column {
    id: 'id' | 'full_name' | 'current_state' | 'rf_id' | 'created_at' | 'updated_at';
    label: string;
    minWidth?: number;
    align?: 'right' | 'left';
    format?: (value: number) => string;
}

const columns: readonly Column[] = [
    { id: 'id', label: 'Id', minWidth: 20 },
    { id: 'full_name', label: 'Name', minWidth: 120},
    { id: 'current_state', label: 'State', minWidth: 120 },
    {
        id: 'rf_id',
        label: 'RFID',
        minWidth: 120,
        align: 'left',
    },
    {
        id: 'created_at',
        label: 'Created At',
        minWidth: 60,
        align: 'right',
        format: (value: number) => value.toLocaleString('en-US'),
    },
    {
        id: 'updated_at',
        label: 'Updated At',
        minWidth: 60,
        align: 'right',
        format: (value: number) => value.toFixed(2),
    },
];
export type PaginationMeta = {
    limit: number;
    page: number;
    currentPage: number;
    offset: number;
    count: number;
}

export type AccessLog = {
    id: number;
    full_name: string;
    rf_id: string;
    current_state: string;
    created_at: string;
    updated_at: string;
}

export type AccessLogDataSet = {
    data: AccessLog[];
    meta: PaginationMeta;
}

async function LogsHandler(limit: number, page: number): Promise<AccessLogDataSet> {
    const db_string = await invoke('get_db_string');
    const db = await invoke('plugin:sqlv|load', { db: db_string });
    const meta = await invoke('plugin:sqlv|generate_pagination_obj', { db, tableName: "access_logs", limit, page }) as unknown as PaginationMeta;
    const data = await invoke('plugin:sqlv|get_all_access_logs', { db, limit, offset: meta.offset }) as unknown as AccessLog[];

    return { data, meta }
}


const AccessLogList = () => {
    const [page, setPage] = React.useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = React.useState<number>(10);
    const [rows, setRows] = React.useState<AccessLogDataSet['data']>([]);

    const getting = async (page: number, limit: number): Promise<AccessLogDataSet> => {
        return await LogsHandler(limit, page);
    }

    const stateRefreshHandler = (res: AccessLogDataSet) => {
        setRows(res.data);
        setRowsPerPage(res.meta.count);
        setPage(0);
    }

    const handleChangePage = (event: unknown, newPage: number) => {
        console.log({ page, event })
        getting(page, rowsPerPage)
            .then(stateRefreshHandler)
            .catch((error: any) => console.log(error));
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(+event.target.value);
        getting(page > 0 ? page : 1, rowsPerPage)
            .then().catch((error: any) => console.log(error));
    };

    useEffect(() => {
        getting(page, rowsPerPage)
            .then(stateRefreshHandler)
    }, [page, rowsPerPage])

    return (<Container>
        <Row className="d-flex justify-content-center">
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: 740 }}>
                    <Table stickyHeader aria-label="sticky table">
                        <TableHead>
                            <TableRow>
                                <TableCell colSpan={12}>
                                    <Container>
                                        <Row>
                                            <Col md={6}>
                                                <Row>
                                                    <Col md={10}>
                                                        <TextField variant='standard' label="Search" className="w-100"></TextField>
                                                    </Col>
                                                    <Col md={2}>
                                                        <Button variant="contained" color="primary" className="mt-2">Filter</Button>
                                                    </Col>
                                                </Row>
                                            </Col>
                                        </Row>
                                    </Container>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableHead>
                            <TableRow>
                                {columns.map((column) => (
                                    <TableCell
                                        key={column.id}
                                        align={column.align}
                                        style={{ minWidth: column.minWidth }}
                                    >
                                        {column.label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows
                                ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row) => {
                                    return (
                                        <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                                            {columns.map((column) => {
                                                return (
                                                    <TableCell key={column.id} align={column.align}>
                                                        {row[column.id]}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    );
                                })}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 100]}
                    component="div"
                    count={rows.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>
        </Row>
    </Container>)
}

export default AccessLogList;