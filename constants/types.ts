// types.ts
export interface UserData {
    id: number;
    userId: string;
    schoolId: number;
    name: string;
    role: number;
    teacherId?: number;
} 

export interface Permission {
    id: number;
    featueName: string;
    icon: string;
    navigation: string | null;
}

export interface Section {
    id: number;
    name: string;
}

export interface Class {
    id: number;
    name: string;
    sections: Section[];
}