export interface AuthUser {
    id: number;
    username: string;
    role: string;
    email?: string;
    project_member_system_user?: projectMemberSystemUserList[];
}

export interface ClientDetail {
    id: number;
}

export interface ClientData {
    client: ClientDetail;
}

export interface projectMemberSystemUserList {
    project_member: ProjectMemberDetail;
}

export interface ProjectMemberDetail {
    id: number;
    project_role_id: number;
    project_id: number;
    project: ProjectDetail;
    project_role: ProjectRoleDetail;
}

export interface ProjectDetail {
    code: string;
    name: string;
}

export interface ProjectRoleDetail {
    code: string;
    name: string;
}

export interface LoginResponse {
    token: string;
    user?: AuthUser;
    has_access_client: ClientData[];
    [key: string]: any;
}

export interface User {
    id: number;
    username: string;
    role: string;
    email?: string;
    role_id: number;
    project_id?: number;
    user_project_role_code?: string;
}

export interface AuthState {
    token: string | null;
    user: User | null;
    isLoading: boolean;
}
