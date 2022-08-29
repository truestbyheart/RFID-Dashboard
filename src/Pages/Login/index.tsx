import React, { useEffect, useState } from "react"
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Card from '@mui/material/Card';
import Database from 'tauri-plugin-sql-api';
import CardContent from '@mui/material/CardContent';
// import { usersHandler } from "../../Utilities/db.util";
import { createConfigDir, createDatabaseConfigFile, readDatabaseConfigFile } from "../../Utilities/fs.util";
import { Navigate } from 'react-router-dom';
// import UserAuthForm, { AuthCredentials } from "./UserAuthForm";
import ConnectionForm from "./ConnectionForm";

export type DatabaseConnection = {
    user: string;
    password: string;
    host: string;
    port: string;
    database: string
}

const Login: React.FC = () => {
    // const [credentials, setCreadentials] = useState<AuthCredentials>({ username: '', password: '' })
    // const [authenticating, setAuthenticating] = useState<boolean>(false)
    const [canConnect, setCanConnect] = useState<boolean>(false)
    const [connectionOptions, setConnectionOptions] = useState<DatabaseConnection>({
        user: "postgres",
        password: "postgres",
        host: "127.0.0.1",
        port: "5432",
        database: "rfid"
    });
    const [isConnecting, setIsConnecting] = useState<boolean>(false);

    // const Login = async (credentials: AuthCredentials) => {
    //     setAuthenticating(true)
    //     try {
    //         await usersHandler.login_user(credentials.username, credentials.password)
    //         setAuthenticating(false)
    //     } catch (error) {
    //         setAuthenticating(false)
    //     }
    // }

    const generateDatabaseString = (connectionOptions: DatabaseConnection): string => {
        return `postgres://${connectionOptions.user}:${connectionOptions.password}@${connectionOptions.host}:${connectionOptions.port}/${connectionOptions.database}`;
    }

    const checkIfCanConnect = async (db_url: string) => {
        try {
            const db = await Database.load(db_url);
            await db.execute("SELECT COUNT(*) FROM users;");
            await createConfigDir();
            await createDatabaseConfigFile(connectionOptions);
            setIsConnecting(false);
            setCanConnect(true);
        } catch (error) {
            console.log(error)
            setIsConnecting(false);
            setCanConnect(false);
        }
    }

    useEffect(() => {
        readDatabaseConfigFile()
            .then((config) => {
                const DbOptions = JSON.parse(config) as unknown as DatabaseConnection;
                checkIfCanConnect(generateDatabaseString(DbOptions))
                    .then(() => setCanConnect(true))
                    .catch((err) => console.log(err))
            })
            .catch((err) => {
                console.log(err)
                setCanConnect(false)
            });
    });

    return (<>
        <Container>
            <Row className="d-flex justify-content-center align-content-center" style={{ "height": '100vh' }}>
                <Card style={{ "width": '60%' }} >
                    <CardContent>
                        {canConnect ? (<Navigate replace to="/panel"/>) : (
                            <ConnectionForm
                                connectionOptions={connectionOptions}
                                setConnectionOptions={setConnectionOptions}
                                isConnecting={isConnecting}
                                setIsConnecting={setIsConnecting}
                                checkIfCanConnect={checkIfCanConnect}
                                generateDatabaseString={generateDatabaseString}
                            />)}
                    </CardContent>
                </Card>
            </Row>
        </Container>
    </>)
}

export default Login;
