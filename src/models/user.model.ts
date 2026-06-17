// src/models/user.model.ts

export interface User {
    id: string;
    name: string;
    email: string;
    password?: string; // Opcional ao trafegar dados de perfil
}
