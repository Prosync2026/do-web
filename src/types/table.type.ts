export type ActionType = 'edit' | 'view' | 'delete' | 'comment' | 'approve' | 'reject';

export interface TableColumn {
    field?: string;
    header?: string;
    sortable?: boolean;
    frozen?: boolean;
    style?: string;
    bodySlot?: string;
    visible?: boolean;
    body?: (row: any) => any;
    action?: boolean;
    actions?: ActionType[] | ((row: any) => ActionType[]);
}
