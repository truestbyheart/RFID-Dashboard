import React, { useEffect, useState } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import PrintIcon from '@mui/icons-material/Print';
import SearchIcon from '@mui/icons-material/Search';

import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import ReplayIcon from '@mui/icons-material/Replay';


import { get_db_string, QueryExecuteResult, usersHandler } from '../../../Utilities/db.util';
import { Button, TextField, Snackbar, Alert, AlertColor } from '@mui/material';
import { invoke } from '@tauri-apps/api';
import { PaginationMeta } from '../AccessLog/index';
import { format } from 'date-fns';
import { generateCSVFile } from '../../../Utilities/csv.util';
import AddUserDialog, { DialogProps } from './UserDialog';
import TableSkeleton from '../Shared/TableSkeleton';

interface Column {
    id: 'id' | 'full_name' | 'rf_id' | 'created_at' | 'updated_at';
    label: string;
    minWidth?: number;
    align?: 'right' | 'left';
    format?: (value: number) => string;
}

const columns: readonly Column[] = [
    { id: 'id', label: 'Id', minWidth: 20 },
    { id: 'full_name', label: 'Name', minWidth: 120 },
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


type User = {
    id: number;
    full_name: string;
    rf_id: string;
    created_at: string;
    updated_at: string;
}

type UsersDataSet = {
    data: User[];
    meta: PaginationMeta;
}

async function UsersHandler(limit: number, page: number): Promise<UsersDataSet> {
    const db_string = await get_db_string();
    const db = await invoke('plugin:sqlv|load', { db: db_string });
    const meta = await invoke('plugin:sqlv|generate_pagination_obj', { db, tableName: "users", limit: limit ? limit : 10, page }) as unknown as PaginationMeta;
    const data = await invoke('plugin:sqlv|get_all_users', { db, limit: limit ? limit : 10, offset: meta.offset }) as unknown as User[];
    return { data, meta }
}

async function SearchUsersHandler(search: string): Promise<UsersDataSet> {
    const db_string = await get_db_string();
    const db = await invoke('plugin:sqlv|load', { db: db_string });
    const data = await invoke('plugin:sqlv|search_all_users', { db, q: search }) as unknown as User[];

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



const ViewUsers: React.FC = () => {
    // State 
    const [rows, setRows] = useState<UsersDataSet['data']>([]);
    const [open, setOpen] = useState<boolean>(false);
    const [show, setShow] = useState<boolean>(false);
    const [createMode, setCreateMode] = useState<boolean>(false);
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [snackBody, setSnackBody] = useState<{ severity: AlertColor; message: string }>({ severity: 'success', message: '' })
    const [page, setPage] = React.useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = React.useState<number>(10);
    const [isDeleting, setIsDeleting] = React.useState<boolean>(false);
    const [data, setData] = React.useState<DialogProps['data']>({ full_name: '', rf_id: '', id: 1 });
    const [search, setSearch] = React.useState<string>('');
    const [isSearch, setIsSearch] = React.useState<boolean>(false);
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [rowsPerPageOptions, setRowsPerPageOptions] = React.useState<number>(0);
    const [hasError, setHasError] = React.useState<boolean>(false);
    const [errorMessage, setErrorMessage] = React.useState<string>("");

    const getting = async (page: number, limit: number): Promise<UsersDataSet> => {
        setIsLoading(true);
        return await UsersHandler(limit, page);
    }

    const stateRefreshHandler = (res: UsersDataSet) => {
        setRows(res.data);
        setRowsPerPageOptions(res.meta.count);
        setRowsPerPage(res.meta.limit);
        setPage(0);
        setIsLoading(false);
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

    const handleChangePage = (event: unknown, newPage: number) => {
        getting(page, rowsPerPage)
            .then((res) => {
                stateRefreshHandler(res);
                setIsSearch(false);
            })
            .catch((error: any) => console.log(error));
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(Number(event.target.value));
        getting(page > 0 ? page : 1, Number(event.target.value))
            .then(stateRefreshHandler)
            .catch((error: any) => console.log(error));
    };

    const handleUpdatedChanges = (payload: { full_name?: string; rf_id?: string }) => {
        if (payload.full_name) setData({ ...data, full_name: payload.full_name });
        if (payload.rf_id) setData({ ...data, rf_id: payload.rf_id })
    }

    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') return;
        setShow(false);
    };

    const updateUserDetails = async () => {
        setIsCreating(true);
        const result: QueryExecuteResult = await usersHandler.update_user_details(data.full_name, data.rf_id, data.id);
        if (result.hasAffected) {
            setShow(true)
            setOpen(false)
            setSnackBody({ severity: 'success', message: result.message })
            getting(page, rowsPerPage)
                .then((res) => {
                    stateRefreshHandler(res);
                    setIsCreating(false);
                })
                .catch((error: any) => {
                    setIsCreating(false);
                    console.log(error)
                });
        } else {
            setIsCreating(false)
            setHasError(true);
            setErrorMessage(result.message)
        }
    }

    const deleteUser = async () => {
        const hasDeleted = await usersHandler.delete_user(data.id);
        setIsDeleting(true);
        if (hasDeleted) {
            setShow(true);
            setOpen(false);
            setIsDeleting(false);
            setSnackBody({ severity: 'success', message: 'User deleted successfully' });
            getting(page, rowsPerPage)
                .then(stateRefreshHandler)
                .catch((error: any) => console.log(error));
        } else {
            setShow(true);
            setIsDeleting(false);
            setSnackBody({ severity: 'error', message: 'Failed to delete user' });
        }
    }

    const createNewUser = async () => {
        setIsCreating(true)
        const hasCreated = await usersHandler.create_rfid_user(data.full_name, data.rf_id);
        if (hasCreated) {
            setShow(true);
            setOpen(false);
            setIsDeleting(false);
            setSnackBody({ severity: 'success', message: "User created successfully" });
            setIsCreating(false)
            getting(page, rowsPerPage)
                .then(stateRefreshHandler)
                .catch((error: any) => console.log(error));
        } else {
            setShow(true);
            setIsCreating(false);
            setSnackBody({ severity: 'error', message: "Failed to create user" });
        }
    }

    const generateCSV = async () => {
        generateCSVFile(`Users_${format(new Date(), "YYY-MM-dd-ss")}.csv`, rows)
    }

    const handleDialogCancel = () => {
        setHasError(false);
        setShow(false);
        setErrorMessage("");
        setIsCreating(false);
        setOpen(false);
    }
    
    // Use Effect
    useEffect(() => {
        console.log({ page, rowsPerPage })
        getting(page, rowsPerPage)
            .then((res) =>{
                stateRefreshHandler(res)
            })
            .catch((error: any) => console.log(error));
    }, [page, rowsPerPage, rowsPerPageOptions]);



    return (<>
        <Container>
            <Row>
                <AddUserDialog
                    open={open}
                    setOpen={setOpen}
                    updateFunc={handleUpdatedChanges}
                    updateUserDetails={() => updateUserDetails()}
                    createNewUser={() => createNewUser()}
                    isCreating={isCreating}
                    data={data}
                    createMode={createMode}
                    hasError={hasError}
                    errorMessage={errorMessage}
                    handleDialogCancel={handleDialogCancel}
                />
                <Snackbar
                    open={show}
                    autoHideDuration={6000}
                    onClose={handleClose}
                    anchorOrigin={{ vertical: "top", horizontal: "right" }} className="w-50">
                    <Alert onClose={handleClose} severity={snackBody.severity} sx={{ width: '100%' }}>
                        {snackBody.message}
                    </Alert>
                </Snackbar>
            </Row>
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
                                        <Button onClick={() => {
                                            setData({ full_name: '', rf_id: '', id: 1 });
                                            setOpen(true);
                                            setCreateMode(true)
                                            setIsCreating(false)
                                        }}>
                                            <PersonAddAltIcon className='me-2' />
                                            Add User
                                        </Button>
                                        <Button color='primary' className='ms-3' onClick={() => generateCSV()}>
                                            <PrintIcon className='me-2' />
                                            Print CSV
                                        </Button>
                                        {/* <Button color='primary' className='ms-3' onClick={() => CreatePdf()}>
                                            <DescriptionIcon className='me-2' />
                                            Print PDF
                                        </Button> */}
                                        <Button color='primary' className='ms-3' onClick={async () => {
                                            await getting(page, rowsPerPage).then(stateRefreshHandler).catch(error => console.log(error))
                                        }}>
                                            <ReplayIcon />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    {columns.map((column) => (
                                        <TableCell
                                            key={column.id}
                                            align={column.align}
                                            style={{ top: 65, minWidth: column.minWidth }}
                                        >
                                            {column.label}
                                        </TableCell>
                                    ))}
                                    <TableCell key="action" align="left"
                                        style={{ top: 65, minWidth: 80 }}>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            {isLoading ? <TableSkeleton numberOfColumn={6}/> : (<TableBody>
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
                                                <TableCell key="action" align='left'>
                                                    <Row aria-label="text button group">
                                                        <div className="col-md-3">
                                                            <Button variant="contained" color="primary" onClick={() => {
                                                                setCreateMode(false)
                                                                setData({ id: row.id, full_name: row.full_name, rf_id: row.rf_id });
                                                                setOpen(true);
                                                            }} >
                                                                <BorderColorIcon className='me-2' />
                                                                Edit
                                                            </Button>
                                                        </div>
                                                        <div className="col-md-3 ms-3">
                                                            <Button variant="contained" color="error" className='ms-3' onClick={() => {
                                                                setData({ id: row.id, full_name: row.full_name, rf_id: row.rf_id })
                                                                deleteUser()
                                                            }} disabled={isDeleting}>
                                                                {isDeleting ? (
                                                                    <div className="spinner-border text-light me-3" role="status" style={{ "width": "20px", "height": "20px" }}>
                                                                        <span className="visually-hidden">Loading...</span>
                                                                    </div>
                                                                ) : <DeleteForeverIcon className='me-2' />}
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </Row>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                            </TableBody>)}
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 100, rowsPerPageOptions].sort((a,b) => a-b)}
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
    </>)
}

export default ViewUsers;
