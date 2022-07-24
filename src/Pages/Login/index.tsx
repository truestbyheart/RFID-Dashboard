import React, { useState } from "react"
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import { usersHandler } from "../../Utilities/db.util";

const Login: React.FC = () => {
    const [pass, setPass] = useState<string>('')
    const [email, setEmail] = useState<string>('')
    const [authenticating, setAuthenticating] = useState<boolean>(false)

    const Login = async () => {
        setAuthenticating(true) 
        try {
            let db = await usersHandler.login_user(email, pass)
            console.log(db)
            setAuthenticating(false) 
        } catch (error) {
            console.log(error)
            setAuthenticating(false) 
        }
    }

    const updateEmail = (value: string) => setEmail(value)
    const updatePass = (value: string) => setPass(value)

    return (<>
        <Container>
            <Row className="d-flex justify-content-center align-content-center" style={{ "height": '100vh' }}>
                <Card className="p-5" style={{"height": '250px', "width": '50%'}} >
                    <Form.Group className="mb-3">
                        <Form.Control
                            type="Text"
                            id="inputUsername"
                            aria-describedby="passwordHelpBlock"
                            placeholder="username"
                            onChange={(e: any) => updateEmail(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Control
                            type="password"
                            id="inputPassword5"
                            aria-describedby="passwordHelpBlock"
                            placeholder="password"
                            onChange={(e: any) => updatePass(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group>
                        <div className="d-grid gap-2">
                            <Button variant="success" onClick={() => Login()} size="lg">Login</Button>
                        </div>
                    </Form.Group>
                </Card>
            </Row>
        </Container>
    </>)
}

export default Login;
