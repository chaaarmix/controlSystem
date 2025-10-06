import React, { useEffect, useState } from "react";
import {Layout, Spin, message, Typography, Button, Modal, Form, Input, Switch, Select, Flex} from "antd";
import AppHeader from "../../components/AppHeader/AppHeader";
import AppSidebar from "../../components/AppSidebar/AppSidebar";
import ProjectsList from "./components/ProjectList";
import { api } from "../../api/api";
import { useAuth, User as AuthUser } from "../../context/AuthContext";
import styles from "../../main.module.css";

const { Content } = Layout;
const { Option } = Select;

interface Project {
    id: number;
    name: string;
    description: string;
    manager: AuthUser;
    customer: AuthUser;
    active: boolean;
}

const ProjectsPage: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [customers, setCustomers] = useState<AuthUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    const { setCurrentUser, currentUser } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");
                const userRes = await api.get("/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setCurrentUser(userRes.data);
                const res = await api.get("/projects", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setProjects(res.data);
                const customersRes = await api.get("/users?role=customer", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setCustomers(customersRes.data);
            } catch {
                message.error("Не удалось загрузить данные");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [setCurrentUser]);

    const handleCreateProject = async (values: any) => {
        try {
            const token = localStorage.getItem("token");

            const payload = {
                name: values.name,
                description: values.description,
                customer_id: values.customer_id,
                manager_id: currentUser?.id,
                active: values.active ?? true,
            };

            const res = await api.post("/projects", payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setProjects((prev) => [...prev, res.data]);
            message.success("Проект успешно создан");
            form.resetFields();
            setIsModalVisible(false);
        } catch (err) {
            message.error("Ошибка при создании проекта");
        }
    };

    if (loading) return <Spin size="large" />;

    return (
        <Layout>
            <AppSidebar role={localStorage.getItem("role") as "engineer" | "manager" | "customer"} />
            <Layout>
                <AppHeader />
                <Content className={styles.contentWrapper}>
                    <div className={styles.content}>
                        <Flex style={{
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}>
                            <Typography.Title level={2}>Проекты</Typography.Title>
                            {localStorage.getItem("role") === "manager" && (
                                <Button type="primary" onClick={() => setIsModalVisible(true)} style={{ marginBottom: 16 }}>
                                    Создать проект
                                </Button>
                            )}
                        </Flex>

                        <ProjectsList projects={projects} />

                        <Modal
                            title="Создать проект"
                            open={isModalVisible}
                            onCancel={() => setIsModalVisible(false)}
                            onOk={() => form.submit()}
                            okText="Создать"
                            cancelText="Отмена"
                        >
                            <Form form={form} layout="vertical" onFinish={handleCreateProject}>
                                <Form.Item
                                    label="Название проекта"
                                    name="name"
                                    rules={[{ required: true, message: "Введите название проекта" }]}
                                >
                                    <Input placeholder="Введите название" />
                                </Form.Item>

                                <Form.Item label="Описание" name="description">
                                    <Input.TextArea rows={3} placeholder="Введите описание" />
                                </Form.Item>

                                <Form.Item
                                    label="Заказчик"
                                    name="customer_id"
                                    rules={[{ required: true, message: "Выберите заказчика" }]}
                                >
                                    <Select placeholder="Выберите заказчика">
                                        {customers.map((c) => (
                                            <Option key={c.id} value={c.id}>
                                                {c.full_name }
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                <Form.Item label="Активен" name="active" valuePropName="checked" initialValue={true}>
                                    <Switch />
                                </Form.Item>
                            </Form>
                        </Modal>
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default ProjectsPage;
