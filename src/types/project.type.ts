export interface Project {
    id: string;
    name: string;
    user_id: string;
    created_at: Date;
}

export interface ProjectList {
    id: string;
    name: string;
    user_id: string;
    created_at: Date;
    project_owner: string;
    project_invited: Array<{
        avatar_url: string | null;
        username: string;
    }>;    
}