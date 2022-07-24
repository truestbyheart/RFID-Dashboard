import React, { useState } from "react";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import { FiCreditCard } from "react-icons/fi";
import { useForm, SubmitHandler } from "react-hook-form";
import { usersHandler } from "../../../Utilities/db.util";
import AlertNotification, { AlertProps } from "../../../Reusable/Alert";

type AddCardType = {
    name: string;
    cardNo: string;
}

const AddCard = () => {
    // Form State
    const { register, handleSubmit, reset } = useForm<AddCardType>();

    // Component states
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [hasResponse, setHasResponse] = useState<boolean>(false);
    const [response, setResponse] = useState<AlertProps>({ type: '', message: '' })
    
    const addCard: SubmitHandler<AddCardType> = async (data) => {
        setIsLoading(true)
        try {
            const res = await usersHandler.create_rfid_user(data.name, data.cardNo)
            setIsLoading(false)
            setHasResponse(true)
            setResponse(res)
            reset()
        } catch (error: any) {
            setIsLoading(false)
            setHasResponse(true)
            setResponse(error)
        }
    }
    return (<>
        <Container>
            <Row className="d-flex justify-content-center align-content-center" style={{ "height": '100vh' }}>
                <Card className="p-5" style={{ "minHeight": "350px", "width": '50%' }} >
                    <div className="text-center">
                        <FiCreditCard style={{ "width": "3rem", "height": "3rem" }} />
                        <h3>Add New Card</h3>
                        {hasResponse ? <AlertNotification type={response.type} message={response.message} /> : ''}
                    </div>
                    <Card.Body>
                        <form onSubmit={handleSubmit(addCard)}>
                            <Form.Group className="mb-3">
                                <Form.Control
                                    type="Text"
                                    id="nameCard"
                                    aria-describedby="name input"
                                    placeholder="Full Name"
                                    // onChange={(e: any) => setName(e.target.value)}
                                    disabled={isLoading}
                                    {...register("name", { required: true })}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Control
                                    type="Text"
                                    id="inputCard"
                                    aria-describedby="card input"
                                    placeholder="Card No."
                                    disabled={isLoading}
                                    {...register("cardNo", { required: true })}
                                />
                            </Form.Group>
                            <Form.Group>
                                <div className="d-grid gap-2">
                                    <Button variant="success" type="submit"  size="lg" disabled={isLoading}>
                                        {isLoading ? (<span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>) : ''}
                                        Add New Card
                                    </Button>
                                </div>
                            </Form.Group>
                        </form>
                    </Card.Body>
                </Card>
            </Row>
        </Container>
    </>)
}

export default AddCard;
