import { ITableProps } from 'ka-table';
import { DataType, SortingMode, PagingPosition, EditingMode } from 'ka-table/enums';
import { ICellEditorProps } from 'ka-table/props';

import React, { useEffect, useState } from 'react';
import { Container, Row } from 'react-bootstrap';
import TableComponent from '../../../Reusable/Table';
import CustomEditor from '../../../Reusable/Table/CustomInput';
import { usersHandler, UsersResult } from '../../../Utilities/db.util';



const ViewUsers: React.FC = () => {
    // State 
    const [data, setData] = useState<UsersResult>()
    const getting = async (): Promise<UsersResult> => {
        return await usersHandler.get_all_users(10, 1)
    }

    // Use Effect
    useEffect(() => {
        getting()
            .then((res: UsersResult) => {
                console.log(res)
                setData(res);
            }).catch((error: any) => console.log(error));
    }, []);

    // Table config
    const columns: ITableProps = {
        columns: [
            {
                dataType: DataType.Number,
                key: "id",
                width: 30,
                title: "Id"
            },
            {
                dataType: DataType.String,
                key: "full_name",
                width: 400,
                title: "Name"
            },
            {
                dataType: DataType.String,
                key: "rf_id",
                width: 120,
                title: "RFID"
            },
            {
                dataType: DataType.String,
                key: "created_at",
                width: 120,
                title: "Created At"
            },
            {
                dataType: DataType.String,
                key: "updated_at",
                width: 120,
                title: "Updated At"
            },
        ],
        rowKeyField: 'id',
        sortingMode: SortingMode.Single,
        paging: {
            enabled: true,
            pageIndex: 0,
            pageSize: 10,
            pageSizes: [5, 10, 15],
            position: PagingPosition.Bottom
        },
        data: data?.data as any[],
        editableCells: [{ columnKey: 'name', rowKeyValue: 1 }],
        editingMode: EditingMode.Cell,
    }
    

    const extras = {
        table: {
            elementAttributes: () => ({
                className: 'custom-editor-demo-table'
            })
        },
        cellEditor: {
            content: (props: JSX.IntrinsicAttributes & ICellEditorProps) => {
                switch (props.column.key) {
                    case 'name': return <CustomEditor {...props} />;
                }
            }
        }
    }
    

    return (<>
        <Container>
            <Row className="d-flex justify-content-center align-content-center" style={{ "height": '100vh' }}>
                <TableComponent columns={columns}  data={data?.data} extras={extras} />
            </Row>
        </Container>
    </>)
}

export default ViewUsers;
