import React, { createContext, useState, ReactNode, useContext } from "react";

// Тип пользователя
export interface User {
    id: number;
    full_name: string;
    role: "engineer" | "manager" | "customer";
}

// Тип контекста
interface AuthContextType {
    currentUser: User | null;
    setCurrentUser: (user: User) => void;
}

// Создаём контекст
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Провайдер контекста
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    return (
        <AuthContext.Provider value={{ currentUser, setCurrentUser }}>
            {children}
        </AuthContext.Provider>
    );
};

// Хук для удобного использования контекста
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
