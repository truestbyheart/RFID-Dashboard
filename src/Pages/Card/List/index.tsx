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

import { usersHandler, UsersResult } from '../../../Utilities/db.util';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, Snackbar, Alert, AlertColor } from '@mui/material';

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
                    ? (<Button variant='contained' color='primary' autoFocus onClick={() => createNewUser()}>
                        {isCreating ? (<div className="spinner-border text-light me-3" role="status" style={{ "width": "20px", "height": "20px" }}>
                            <span className="visually-hidden">Loading...</span>
                        </div>) : ""}
                        Create
                    </Button>)
                    : (<Button variant='contained' color='primary' autoFocus onClick={() => updateUserDetails()}>Update</Button>)
                }
            </DialogActions>
        </Dialog>
    </>
    )
}

const ViewUsers: React.FC = () => {
    // State 
    const [rows, setRows] = useState<UsersResult['data']>([]);
    const [open, setOpen] = useState<boolean>(false);
    const [show, setShow] = useState<boolean>(false);
    const [createMode, setCreateMode] = useState<boolean>(false);
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [snackBody, setSnackBody] = useState<{ severity: AlertColor; message: string }>({ severity: 'success', message: '' })

    const getting = async (): Promise<UsersResult> => {
        return await usersHandler.get_all_users(102, 1)
    }

    const [page, setPage] = React.useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = React.useState<number>(10);
    const [isDeleting, setIsDeleting] = React.useState<boolean>(false)
    const [data, setData] = React.useState<DialogProps['data']>({ full_name: '', rf_id: '', id: 1 });

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
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
        const hasUpdated = await usersHandler.update_user_details(data.full_name, data.rf_id, data.id);
        if (hasUpdated) {
            setShow(true)
            setOpen(false)
            setSnackBody({ severity: 'success', message: 'User updated successfully' })
            getting()
                .then((res: UsersResult) => {
                    setRows(res.data);
                }).catch((error: any) => console.log(error));
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
            getting()
                .then((res: UsersResult) => {
                    setRows(res.data);
                }).catch((error: any) => console.log(error));
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
            getting()
                .then((res: UsersResult) => {
                    setRows(res.data);
                }).catch((error: any) => console.log(error));
        } else {
            setShow(true);
            setIsDeleting(false);
            setIsCreating(false)
            setSnackBody({ severity: 'error', message: "Failed to create user" });
        }
    }
    // Use Effect
    useEffect(() => {
        getting()
            .then((res: UsersResult) => {
                setRows(res.data);
            }).catch((error: any) => console.log(error));
    }, []);



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
            <Row className="d-flex justify-content-center align-content-center" style={{ "height": '100vh' }}>
                <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                    <TableContainer sx={{ maxHeight: 440 }}>
                        <Table stickyHeader aria-label="sticky e">
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <Container>
                                            <Row>
                                                <Col md={10}>
                                                    <Row>
                                                        <Col md={9}>
                                                            <TextField variant='standard' label="Search" className="w-100"></TextField>
                                                        </Col>
                                                        <Col md={3}>
                                                            <Button variant="contained" color="primary" className="mt-2">Filter</Button>
                                                        </Col>
                                                    </Row>
                                                </Col>
                                                <Col md={2}>
                                                    <Button onClick={() => {
                                                        setData({ full_name: '', rf_id: '', id: 1 });
                                                        setOpen(true);
                                                        setCreateMode(true)
                                                        setIsCreating(false)
                                                    }}><PersonAddAltIcon className='me-3' />Add User</Button>
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
                                    <TableCell key="action">Action</TableCell>
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
                                                            }} className="w-100">Edit</Button>
                                                        </div>
                                                        <div className="col-md-3">
                                                            <Button variant="contained" color="secondary" className="w-100">View Logs</Button>
                                                        </div>
                                                        <div className="col-md-3">
                                                            <Button variant="contained" color="error" className="w-100" onClick={() => {
                                                                setData({ id: row.id, full_name: row.full_name, rf_id: row.rf_id })
                                                                deleteUser()
                                                            }}>
                                                                {isDeleting ? (
                                                                    <div className="spinner-border text-light me-3" role="status" style={{ "width": "20px", "height": "20px" }}>
                                                                        <span className="visually-hidden">Loading...</span>
                                                                    </div>
                                                                ) : ""}
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
