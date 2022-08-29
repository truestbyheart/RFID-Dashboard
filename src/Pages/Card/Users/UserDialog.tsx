import React from 'react';
import { Container, Row } from 'react-bootstrap';
import AddIcon from '@mui/icons-material/Add';
import UpgradeIcon from '@mui/icons-material/Upgrade';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, Alert, AlertTitle } from '@mui/material';

export type DialogProps = {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    updateFunc: (payload: { full_name?: string; rf_id?: string; }) => void;
    updateUserDetails: () => void;
    createNewUser: () => void;
    data: { full_name: string; rf_id: string; id: number };
    isCreating?: boolean;
    createMode?: boolean;
    hasError?: boolean;
    errorMessage?: string;
    handleDialogCancel: () => void
}


const AddUserDialog: React.FC<DialogProps> = ({ open, data, setOpen, updateFunc, updateUserDetails, isCreating, createNewUser, createMode, hasError, errorMessage, handleDialogCancel }) => {
    return (<>
        <Dialog open={open} maxWidth="lg" fullWidth={true}>
            <DialogTitle>Add New RFID User</DialogTitle>
            <DialogContent>
                {hasError ? (
                    <Alert severity="error" className='mb-3'>
                        <AlertTitle>Error</AlertTitle>
                        {errorMessage}
                    </Alert>
                ) : ""}
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
                <Button onClick={() => {
                    setOpen(false);
                    handleDialogCancel()
                    }}>Cancel</Button>
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

export default AddUserDialog;
