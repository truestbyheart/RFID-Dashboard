import { Button, Paper, Table, TableContainer, TableHead, TableRow, TableCell, TextField, TableBody, TablePagination } from '@mui/material';
import { invoke } from '@tauri-apps/api';
import React, { useEffect } from 'react'
import { Col, Container, Row } from 'react-bootstrap';
import TableSkeleton from '../Shared/TableSkeleton';
import SearchIcon from '@mui/icons-material/Search';
import ReplayIcon from '@mui/icons-material/Replay';
import PrintIcon from '@mui/icons-material/Print';
import { get_db_string } from '../../../Utilities/db.util';
import { generateCSVFile } from '../../../Utilities/csv.util';
import { format } from 'date-fns';


interface Column {
    id: 'id' | 'full_name' | 'current_state' | 'rf_id' | 'created_at' | 'updated_at';
    label: string;
    minWidth?: number;
    align?: 'right' | 'left';
    format?: (value: number) => string;
}

const columns: readonly Column[] = [
    { id: 'id', label: 'Id', minWidth: 20 },
    { id: 'full_name', label: 'Name', minWidth: 120 },
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
    const db_string = await get_db_string();
    const db = await invoke('plugin:sqlv|load', { db: db_string });
    const meta = await invoke('plugin:sqlv|generate_pagination_obj', { db, tableName: "access_logs", limit, page }) as unknown as PaginationMeta;
    const data = await invoke('plugin:sqlv|get_all_access_logs', { db, limit, offset: meta.offset }) as unknown as AccessLog[];

    return { data, meta }
}

async function SearchUsersHandler(search: string): Promise<AccessLogDataSet> {
    const db_string = await get_db_string();
    const db = await invoke('plugin:sqlv|load', { db: db_string });
    const data = await invoke('plugin:sqlv|search_all_logs', { db, q: search }) as unknown as AccessLog[];

    return {
        data,
        meta: {
            limit: data.length,
            page: 1,
            currentPage: 1,
            offset: 0,
            count: data.length,
        }
    };
}


const AccessLogComp = () => {
    const [page, setPage] = React.useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = React.useState<number>(10);
    const [rows, setRows] = React.useState<AccessLogDataSet['data']>([]);
    const [search, setSearch] = React.useState<string>('');
    const [isSearch, setIsSearch] = React.useState<boolean>(false);
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [rowsPerPageOptions, setRowsPerPageOptions] = React.useState<number>(0);


    const getting = async (page: number, limit: number): Promise<AccessLogDataSet> => {
        return await LogsHandler(limit, page);
    }

    const handleSearch = () => {
        setIsSearch(true);
        setIsLoading(true);
        SearchUsersHandler(search)
            .then((res) => {
                console.log(res);
                setRows(res.data);
                setIsSearch(false);
                setIsLoading(false);
            })
            .catch(error => console.log(error));
    }

    const stateRefreshHandler = (res: AccessLogDataSet) => {
        setRows(res.data);
        setRowsPerPage(res.meta.count);
        setRowsPerPageOptions(res.meta.limit)
        setPage(0);
        setIsLoading(false)
    }

    const handleChangePage = (event: unknown, newPage: number) => {
        console.log({ page, event })
        setIsLoading(true);
        getting(page, rowsPerPage)
            .then(stateRefreshHandler)
            .catch((error: any) => console.log(error));
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(+event.target.value);
        setIsLoading(true);
        getting(page > 0 ? page : 1, rowsPerPage)
            .then().catch((error: any) => console.log(error));
    };

    useEffect(() => {
        setIsLoading(true);
        getting(page, rowsPerPage)
            .then(stateRefreshHandler)
    }, [page, rowsPerPage])

    function generateCSV(): void {
        generateCSVFile(`logs_${format(new Date(), "YYY-MM-dd-ss")}.csv`, rows);
    }

    return (
        <Container>
            <Row className="d-flex justify-content-center">
                <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                    <TableContainer sx={{ maxHeight: 740 }}>
                        <Table stickyHeader aria-label="sticky table">
                            <TableHead>
                                <TableRow>
                                    <TableCell align="center" colSpan={4}>
                                        <Row>
                                            <Col md={9}>
                                                <TextField variant='standard' label="Search Name Or Rfid" className="w-100" onChange={(e) => setSearch(e.target.value)}></TextField>
                                            </Col>
                                            <Col md={3}>
                                                <Button onClick={() => {
                                                    handleSearch();
                                                }} variant="contained" color="primary" className="mt-2" disabled={isSearch}>
                                                    {isSearch ? (
                                                        <div className="spinner-border text-light me-3" role="status" style={{ "width": "20px", "height": "20px" }}>
                                                            <span className="visually-hidden">Loading...</span>
                                                        </div>
                                                    ) : <SearchIcon className='me-2' />}
                                                    Search
                                                </Button>
                                            </Col>
                                        </Row>
                                    </TableCell>
                                    <TableCell align="center" colSpan={4}>
                                        <Button color='primary' className='ms-3' onClick={() => generateCSV()}>
                                            <PrintIcon className='me-2' />
                                            Print CSV
                                        </Button>
                                        <Button color='primary' className='ms-3' onClick={async () => {
                                            setIsLoading(true);
                                            await getting(page, rowsPerPage).then(stateRefreshHandler).catch(error => console.log(error))
                                        }}>
                                            <ReplayIcon />
                                        </Button>
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
                            {isLoading ? <TableSkeleton numberOfColumn={6} /> : (<TableBody>
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
                            </TableBody>)}
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 100, rowsPerPageOptions].sort((a, b) => a - b)}
                        component="div"
                        count={rows.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Paper>
            </Row>
        </Container>
    )
}

export default AccessLogComp;
