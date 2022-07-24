import "./custom.scss"
import React, { useState, useEffect } from 'react';

import { ITableProps, kaReducer, Table } from 'ka-table';
import { DispatchFunc } from 'ka-table/types';
import { ChildComponents } from 'ka-table/Models/ChildComponents';

import { UsersDataSet } from '../../Utilities/db.util';
import CustomEditor from './CustomInput';

type TableComponentProps = {
    columns: ITableProps;
    extras?: ChildComponents;
    data?: UsersDataSet[]
};

const TableComponent = ({ columns, extras, data }: TableComponentProps) => {
    const [tableProps, changeTableProps] = useState(columns);
    const dispatch: DispatchFunc = (action) => {
        changeTableProps((prevState: ITableProps) => kaReducer(prevState, action));
    };

    useEffect(() => {
        changeTableProps(columns)
        console.log(columns)
    }, [columns])

    return (
        <>
            <Table
                {...tableProps}
                dispatch={dispatch}
                childComponents={{
                    table: {
                        elementAttributes: () => ({
                            className: 'custom-editor-demo-table'
                        })
                    },
                    cellEditor: {
                        content: (props) => {
                            console.log(props)
                            switch (props.column.key) {
                                case 'full_name': return <CustomEditor {...props} />;
                            }
                        }
                    }
                }}
            />
        </>
    );
}

export default TableComponent;
