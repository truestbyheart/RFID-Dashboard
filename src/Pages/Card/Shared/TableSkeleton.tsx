import React from 'react';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import { Skeleton } from '@mui/material';

export type TableSkeletonProps = {
    numberOfColumn: number;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ numberOfColumn }) => {
    return (<>
        <TableBody>
            {new Array(20).fill(0).map(() =>
                <TableRow>
                    {new Array(numberOfColumn).fill(0).map(() => {
                        return (
                            <TableCell>
                                <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                            </TableCell>
                        );
                    })}
                </TableRow>)
            }
        </TableBody>
    </>)
}

export default TableSkeleton;
