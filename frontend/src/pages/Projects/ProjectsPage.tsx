import React, { useEffect, useState } from "react";
import { Layout, Spin, message } from "antd";
import AppHeader from "../../components/AppHeader/AppHeader";
import AppSidebar from "../../components/AppSidebar/AppSidebar";
import ProjectsList from "./components/ProjectList";
import { api } from "../../api/api";
import styles from "./ProjectsPage.module.css";
import { useAuth, User as AuthUser } from "../../context/AuthContext";

const { Content } = Layout;

interface Project {
    id: number;
    name: string;
    description: string;
    manager: AuthUser;
    customer: AuthUser;
    active: boolean;
    tasks?: { id: number; name: string; status: string; project_id: number }[];
}

const ProjectsPage: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const { setCurrentUser } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Получаем текущего пользователя
                const userRes = await api.get("/me", {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                setCurrentUser(userRes.data); // сохраняем в контекст

                // Получаем проекты
                const res = await api.get("/projects", {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                setProjects(res.data);
            } catch {
                message.error("Не удалось загрузить данные");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [setCurrentUser]);

    // Пока пользователь или проекты загружаются
    if (loading) return <Spin size="large" />;

    return (
        <Layout className={styles.layout}>
            {/* Роль для Sidebar можно взять из контекста */}
            <AppSidebar role={localStorage.getItem("role") as "engineer" | "manager" | "customer"} />
            <Layout>
                <AppHeader />
                <Content className={styles.contentWrapper}>
                    <ProjectsList projects={projects} />
                </Content>
            </Layout>
        </Layout>
    );
};

export default ProjectsPage;
