import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Form from 'react-bootstrap/Form';
import CreditCardTwoToneIcon from '@mui/icons-material/CreditCardTwoTone';

export type AuthCredentials = {
    password: string;
    username: string;
}

export type AuthFormProps = {
    credentials: AuthCredentials;
    setCredentials: React.Dispatch<React.SetStateAction<AuthCredentials>>;
    authenticating: boolean;
    setAuthenticating: React.Dispatch<React.SetStateAction<boolean>>;
    login: (credentials: AuthCredentials) => Promise<void>;
}


const UserAuthForm: React.FC<AuthFormProps> = ({ credentials, setCredentials, authenticating, setAuthenticating, login }) => {
    return (<>
        <Form.Group className='mb-3' style={{ display: "flex", justifyContent: "center", flexDirection: "column" }}>
            <CreditCardTwoToneIcon style={{ width: "100px", height: "100px" }} />
            <h3>RFID CONTROL PANEL</h3>
        </Form.Group>
        <Form.Group className="mb-3">
            <TextField id="standard-basic" label="Username" variant="standard" className="w-100"
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                disabled={authenticating}
            />
        </Form.Group><Form.Group className="mb-3">
            <TextField id="standard-basic" label="Password" variant="standard" className="w-100"
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                disabled={authenticating}
            />

        </Form.Group>
        <Form.Group>
            <Button variant="contained" className="w-100" disabled={authenticating} onClick={async () => {
                setAuthenticating(true);
                login(credentials);
            }}>Login</Button>
        </Form.Group>
    </>)
}

export default UserAuthForm;
