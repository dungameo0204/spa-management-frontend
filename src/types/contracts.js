/** @typedef {{id:number,tenant_id:number,branch_id:number|null,username:string,fullname:string,system_role:'MANAGER'|'STAFF'}} SpaUser */
/** @typedef {{token:string,user:SpaUser}} AuthSession */
/** @template T @typedef {{data:T[],total:number,page:number,pageSize:number,totalPages:number,message?:string}} PagedResult */
/** @typedef {{startDate:string,endDate:string,branchId?:number}} ReportRange */
/** @typedef {'invoices'|'debt_payments'|'wallet_logs'|'expenses'|'inventory_imports'|'commissions'|'consultants'} ReportDetailType */
export const REPORT_TYPES = ['invoices', 'debt_payments', 'wallet_logs', 'expenses', 'inventory_imports', 'commissions', 'consultants']