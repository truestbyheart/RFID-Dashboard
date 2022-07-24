import React, { useState } from 'react'
import { closeEditor, updateCellValue } from 'ka-table/actionCreators';
import { ICellEditorProps } from 'ka-table/props';

const CustomEditor: React.FC<ICellEditorProps> = ({
    column, rowKeyValue, dispatch, value,
}) => {
    const close = () => {
        dispatch(closeEditor(rowKeyValue, column.key));
    };
    const [editorValue, setValue] = useState(value);
    return (
        <div className='custom-editor'>
            <input
                className='form-control'
                type='text'
                value={editorValue}
                onChange={(event) => setValue(event.currentTarget.value)} />
            <button className='custom-editor-button custom-editor-button-save'
                onClick={() => {
                    dispatch(updateCellValue(rowKeyValue, column.key, editorValue));
                    close();
                }}>Save</button>
            <button className='custom-editor-button custom-editor-button-cancel' onClick={close}>Cancel</button>
        </div>
    );
};

export default CustomEditor;
