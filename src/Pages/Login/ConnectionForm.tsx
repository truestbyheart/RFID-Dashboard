import Form from 'react-bootstrap/Form';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { DatabaseConnection } from '.';

export type ConnectFormProps = {
    setConnectionOptions: React.Dispatch<React.SetStateAction<DatabaseConnection>>;
    connectionOptions: DatabaseConnection;
    isConnecting: boolean;
    setIsConnecting: React.Dispatch<React.SetStateAction<boolean>>;
    generateDatabaseString: (connectionOptions: DatabaseConnection) => string;
    checkIfCanConnect: (db_string: string) => Promise<void>;
}

const ConnectionForm: React.FC<ConnectFormProps> = ({ connectionOptions, setConnectionOptions, isConnecting, setIsConnecting, generateDatabaseString, checkIfCanConnect }) => {
    return (
        <Form.Group className="mb-5">
            <h3 className="mb-3 text-uppercase">Database Connection Details</h3>
            <Form.Group className="mb-3">
                <TextField id="standard-user"
                    InputLabelProps={{
                        shrink: true,
                    }}
                    label="User"
                    variant="standard"
                    className="me-3"
                    style={{ "width": "350px" }}
                    defaultValue={connectionOptions.user}
                    onChange={(e) => setConnectionOptions({ ...connectionOptions, user: e.target.value })}
                    disabled={isConnecting}
                />
                <TextField
                    id="standard-pass"
                    label="Password"
                    InputLabelProps={{
                        shrink: true,
                    }}
                    variant="standard"
                    style={{ "width": "350px" }}
                    defaultValue={connectionOptions.password}
                    onChange={(e) => setConnectionOptions({ ...connectionOptions, password: e.target.value })}
                    disabled={isConnecting}
                />
            </Form.Group>
            <Form.Group className="mt-4">
                <TextField
                    id="standard-host"
                    label="Host"
                    InputLabelProps={{
                        shrink: true,
                    }}
                    variant="standard"
                    className="me-3"
                    style={{ "width": "350px" }}
                    defaultValue={connectionOptions.host}
                    onChange={(e) => setConnectionOptions({ ...connectionOptions, host: e.target.value })}
                    disabled={isConnecting}
                />
                <TextField
                    id="standard-basic"
                    label="Port"
                    InputLabelProps={{
                        shrink: true,
                    }}
                    variant="standard"
                    style={{ "width": "350px" }}
                    defaultValue={connectionOptions.port}
                    onChange={(e) => setConnectionOptions({ ...connectionOptions, port: e.target.value })}
                    disabled={isConnecting}
                />
            </Form.Group>
            <Form.Group className="mt-4">
                <TextField
                    id="standard-basic"
                    label="Database Name"
                    InputLabelProps={{
                        shrink: true,
                    }}
                    variant="standard"
                    style={{ "width": "100%" }}
                    defaultValue={connectionOptions.database}
                    onChange={(e) => setConnectionOptions({ ...connectionOptions, database: e.target.value })}
                    disabled={isConnecting}
                />
            </Form.Group>
            <Form.Group>
                <Button variant="contained" className="w-100 mt-3" onClick={async () => {
                    setIsConnecting(true);
                    const db_string = generateDatabaseString(connectionOptions);
                    await checkIfCanConnect(db_string);
                }}
                disabled={isConnecting}
                >
                    {isConnecting ? (<div className="spinner-border text-light me-3" role="status" style={{ "width": "20px", "height": "20px" }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>) : ""}
                    Test Connection
                </Button>
            </Form.Group>
        </Form.Group>
    );
}

export default ConnectionForm;
