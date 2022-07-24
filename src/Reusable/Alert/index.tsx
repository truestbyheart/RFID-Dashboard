import React from 'react';
import Alert from 'react-bootstrap/Alert'

export type AlertProps = {
    type: string;
    message: string;
}
function AlertNotification({ type, message }: AlertProps) {
    return (
        <Alert variant={type} className="mt-3" >
            {message}
        </Alert>
    )
}

export default AlertNotification;
