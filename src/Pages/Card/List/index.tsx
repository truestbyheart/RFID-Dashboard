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
import DescriptionIcon from '@mui/icons-material/Description';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import UpgradeIcon from '@mui/icons-material/Upgrade';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import ReplayIcon from '@mui/icons-material/Replay';
import { CSVLink } from "react-csv";


import { usersHandler } from '../../../Utilities/db.util';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, Snackbar, Alert, AlertColor } from '@mui/material';
import { invoke } from '@tauri-apps/api';
import { PaginationMeta } from '../AccessLog/List';
import generatePDF from '../../../Utilities/pdf.util';
import { format } from 'date-fns';

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

type DialogProps = {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    updateFunc: (payload: { full_name?: string; rf_id?: string; }) => void;
    updateUserDetails: () => void;
    createNewUser: () => void;
    data: { full_name: string; rf_id: string; id: number };
    isCreating?: boolean;
    createMode?: boolean;
}

const AddUserDialog: React.FC<DialogProps> = ({ open, data, setOpen, updateFunc, updateUserDetails, isCreating, createNewUser, createMode }) => {
    return (<>
        <Dialog open={open} maxWidth="lg" fullWidth={true}>
            <DialogTitle>Add New RFID User</DialogTitle>
            <DialogContent>
                <form>
                    <Container>
                        <Row>
                            <TextField label="Full Name" variant="standard" defaultValue={data.full_name} onChange={(e) => updateFunc({
                                full_name: e.target.value,
                            })}></TextField>
                        </Row>
                        <Row className="mt-4">
                            <TextField label="RFID" variant="standard" defaultValue={data.rf_id} onChange={(e) => updateFunc({
                                rf_id: e.target.value,
                            })}></TextField>
                        </Row>
                    </Container>
                </form>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                {createMode
                    ? (<Button variant='contained' color='primary' autoFocus onClick={() => createNewUser()} disabled={isCreating}>
                        {isCreating ? (<div className="spinner-border text-light me-3" role="status" style={{ "width": "20px", "height": "20px" }}>
                            <span className="visually-hidden">Loading...</span>
                        </div>) : <AddIcon className='me-2' />}
                        Create
                    </Button>)
                    : (<Button variant='contained' color='primary' autoFocus onClick={() => updateUserDetails()} disabled={isCreating}>
                        {isCreating ? (<div className="spinner-border text-light me-3" role="status" style={{ "width": "20px", "height": "20px" }}>
                            <span className="visually-hidden">Loading...</span>
                        </div>) : <UpgradeIcon className='me-2' />}
                        Update
                    </Button>)
                }
            </DialogActions>
        </Dialog>
    </>
    )
}

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
    const db_string = await invoke('get_db_string');
    const db = await invoke('plugin:sqlv|load', { db: db_string });
    const meta = await invoke('plugin:sqlv|generate_pagination_obj', { db, tableName: "users", limit, page }) as unknown as PaginationMeta;
    const data = await invoke('plugin:sqlv|get_all_users', { db, limit, offset: meta.offset }) as unknown as User[];

    return { data, meta }
}

async function SearchUsersHandler(search: string): Promise<UsersDataSet> {
    const db_string = await invoke('get_db_string');
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

    const getting = async (page: number, limit: number): Promise<UsersDataSet> => {
        return await UsersHandler(limit, page);
    }

    const [page, setPage] = React.useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = React.useState<number>(10);
    const [isDeleting, setIsDeleting] = React.useState<boolean>(false);
    const [data, setData] = React.useState<DialogProps['data']>({ full_name: '', rf_id: '', id: 1 });
    const [search, setSearch] = React.useState<string>('');
    const [isSearch, setIsSearch] = React.useState<boolean>(false);

    const stateRefreshHandler = (res: UsersDataSet) => {
        setRows(res.data);
        setRowsPerPage(res.meta.count);
        setPage(0);
    }

    const handleSearch = () => {
        setIsSearch(true);
        SearchUsersHandler(search)
            .then((res) => {
                console.log(res);
                // stateRefreshHandler(res);
                setRows(res.data);
                // setRowsPerPage(res.meta.count);
                // setPage(res.meta.page);
                setIsSearch(false);
            })
            .catch(error => console.log(error));
    }

    const handleChangePage = (event: unknown, newPage: number) => {
        console.log({ page, event })
        getting(page, rowsPerPage)
            .then((res) => {
                stateRefreshHandler(res);
                setIsSearch(false);
            })
            .catch((error: any) => console.log(error));
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(+event.target.value);
        getting(page > 0 ? page : 1, rowsPerPage)
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
        const hasUpdated = await usersHandler.update_user_details(data.full_name, data.rf_id, data.id);
        if (hasUpdated) {
            setShow(true)
            setOpen(false)
            setSnackBody({ severity: 'success', message: 'User updated successfully' })
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
            setShow(true)
            setSnackBody({ severity: 'error', message: 'Failed to update user' })
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
            setIsDeleting(false);
            setIsCreating(false)
            setSnackBody({ severity: 'error', message: "Failed to create user" });
        }
    }

    const CreatePdf = async () => {
        let tableRows = rows.map((row: User) => {
            return [
                row.id,
                row.full_name,
                row.rf_id,
                row.created_at,
                row.updated_at
            ]
        });
        console.log(tableRows)
        generatePDF(`Users_${format(new Date(), "YYY-MM-dd")}`, ["id", "full_name", "rf_id", "created_at", "updated_at"], tableRows)
    }
    // Use Effect
    useEffect(() => {
        getting(page, rowsPerPage)
            .then(stateRefreshHandler)
            .catch((error: any) => console.log(error));
    }, [page, rowsPerPage]);



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
                                        <Button color='primary' className='ms-3'>
                                            <PrintIcon className='me-2' />
                                            <CSVLink data={rows} style={{ textDecoration: "none" }}>Print CSV</CSVLink>
                                        </Button>
                                        <Button color='primary' className='ms-3' onClick={() => CreatePdf()}>
                                            <DescriptionIcon className='me-2' />
                                            Print PDF
                                        </Button>
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
                                        style={{ top: 65, minWidth: 120 }}>Action</TableCell>
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
        </Container>
    </>)
}

export default ViewUsers;
