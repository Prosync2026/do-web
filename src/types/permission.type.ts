export interface PermissionResponse {
    message: string;
    data: PermissionClient[];
    error: any;
}

export interface PermissionClient {
    client_id: number;
    client_beneficiary_name: string;
    subscribed_modules: string[];
    system_companies: SystemCompany[];
}

export interface SystemCompany {
    system_company_id: number;
    system_company_name: string;
    projects: PermissionProject[];
}

export interface PermissionProject {
    project_id: number;
    project_name: string;
    roles: PermissionRole[];
}

export interface PermissionRole {
    project_role_id: number;
    project_role_name: string;
    project_role_system_permissions: string[];
}
