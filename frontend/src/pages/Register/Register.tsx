import React, { useState } from "react";
import { Form, Input, Button, Select, Row, Col, Typography, Card, message } from "antd";
import { Link } from "react-router-dom";
import { api } from "../../api/api";

const { Title, Text } = Typography;

type Role = "customer" | "manager" | "engineer";

export const Register: React.FC = () => {
    const [role, setRole] = useState<Role>("customer");
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            await api.post("/register", {
                full_name: values.full_name,
                email: values.email,
                password: values.password,
                role: values.role,
                code: values.code || "",
            });
            message.success("Регистрация прошла успешно. Войдите в аккаунт.");
            window.location.href = "/login";
        } catch (err: any) {
            const text = err?.response?.data?.error || "Ошибка регистрации";
            message.error(text);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Row style={{ minHeight: "100vh" }} align="middle" justify="center">
            <Col xs={22} sm={16} md={12} lg={8}>
                <Card bordered={false} style={{ borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                    <div style={{ textAlign: "center", marginBottom: 24 }}>
                        <img src="/images/logo.png" alt="logo" style={{ height: 60, marginBottom: 12 }} />
                        <Title level={3}>Регистрация</Title>
                        <Text type="secondary">Введите данные для создания аккаунта</Text>
                    </div>

                    <Form layout="vertical" onFinish={onFinish}>
                        <Form.Item
                            name="full_name"
                            label="ФИО"
                            rules={[{ required: true, message: "Введите ФИО" }]}
                        >
                            <Input placeholder="Иванов Иван Иванович" />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            label="Email"
                            rules={[{ required: true, type: "email", message: "Введите корректный email" }]}
                        >
                            <Input placeholder="you@example.com" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label="Пароль"
                            rules={[{ required: true, min: 6, message: "Минимум 6 символов" }]}
                            hasFeedback
                        >
                            <Input.Password placeholder="Пароль" />
                        </Form.Item>

                        <Form.Item
                            name="confirmPassword"
                            label="Повторите пароль"
                            dependencies={["password"]}
                            hasFeedback
                            rules={[
                                { required: true, message: "Подтвердите пароль" },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue("password") === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error("Пароли не совпадают"));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password placeholder="Повторите пароль" />
                        </Form.Item>

                        <Form.Item
                            name="role"
                            label="Роль"
                            initialValue="customer"
                            rules={[{ required: true }]}
                        >
                            <Select onChange={(val) => setRole(val)}>
                                <Select.Option value="customer">Руководитель / Заказчик</Select.Option>
                                <Select.Option value="manager">Менеджер</Select.Option>
                                <Select.Option value="engineer">Инженер</Select.Option>
                            </Select>
                        </Form.Item>

                        {role !== "customer" && (
                            <Form.Item
                                name="code"
                                label="Код доступа (6 цифр)"
                                rules={[
                                    { required: true, message: "Введите код доступа" },
                                    { pattern: /^\d{6}$/, message: "Код должен содержать ровно 6 цифр" },
                                ]}
                            >
                                <Input placeholder="123456" maxLength={6} />
                            </Form.Item>
                        )}

                        <Form.Item>
                            <Button type="primary" htmlType="submit" block loading={loading}>
                                Зарегистрироваться
                            </Button>
                        </Form.Item>

                        <Text style={{ display: "block", textAlign: "center" }}>
                            Уже есть аккаунт? <Link to="/login">Войдите</Link>
                        </Text>
                    </Form>
                </Card>
            </Col>
        </Row>
    );
};

export default Register;
