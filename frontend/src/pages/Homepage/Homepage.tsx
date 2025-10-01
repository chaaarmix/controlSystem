// src/pages/Homepage/Homepage.tsx
import React, { useEffect, useState } from "react";
import { Layout, Card, Descriptions, Spin, message } from "antd";
import styles from "./Homepage.module.css";
import AppHeader from "../../components/AppHeader/AppHeader";
import AppSidebar from "../../components/AppSidebar/AppSidebar";
import { api } from "../../api/api";

const { Content } = Layout;

interface User {
    id: number;
    full_name: string;
    email: string;
    role: "engineer" | "manager" | "customer";
}

const Homepage: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Читаем роль из localStorage
    const role =
        (localStorage.getItem("role") as "engineer" | "manager" | "customer") ||
        "engineer";

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get("/me", {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });

                // Бэкенд возвращает объект user прямо
                setUser(res.data);
            } catch (err: any) {
                message.error("Не удалось загрузить данные профиля");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    return (
        <Layout className={styles.layout}>
            <AppSidebar role={role} />

            <Layout>
                <AppHeader />

                <Content className={styles.contentWrapper}>
                    <div className={styles.content}>
                        {loading ? (
                            <Spin size="large" />
                        ) : user ? (
                            <Card
                                title="Мой аккаунт"
                                bordered={false}
                                style={{ maxWidth: 600, margin: "0 auto" }}
                            >
                                <Descriptions column={1} bordered>
                                    <Descriptions.Item label="Имя">
                                        {user.full_name}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Email">
                                        {user.email}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Роль">
                                        {user.role === "engineer"
                                            ? "Инженер"
                                            : user.role === "manager"
                                                ? "Менеджер"
                                                : "Заказчик"}
                                    </Descriptions.Item>
                                </Descriptions>
                            </Card>
                        ) : (
                            <p>Нет данных пользователя</p>
                        )}
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default Homepage;
