import React, { useState } from "react";
import { Form, Input, Button, Row, Col, Typography, Card, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/api";

const { Title, Text } = Typography;

interface LoginFormValues {
    email: string;
    password: string;
}

const Login: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values: LoginFormValues) => {
        setLoading(true);
        try {
            const res = await api.post("/login", {
                email: values.email,
                password: values.password,
            });
            const loggedInUser = res.data.user;
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user_id", loggedInUser.id.toString());
            localStorage.setItem("role", loggedInUser.role);
            localStorage.setItem("user_full_name", loggedInUser.full_name);

            message.success("Вы успешно вошли!");
            navigate("/");
        } catch (err: any) {
            const text = err?.response?.data?.error || "Ошибка входа";
            message.error(text);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Row style={{ minHeight: "100vh" }} align="middle" justify="center">
            <Col xs={22} sm={16} md={12} lg={8}>
                <Card
                    bordered={false}
                    style={{ borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                >
                    <div style={{ textAlign: "center", marginBottom: 24 }}>
                        <img
                            src="/images/logo.png"
                            alt="logo"
                            style={{ height: 60, marginBottom: 12 }}
                        />
                        <Title level={3}>Вход</Title>
                        <Text type="secondary">Введите почту и пароль</Text>
                    </div>

                    <Form<LoginFormValues> layout="vertical" onFinish={onFinish}>
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
                            rules={[{ required: true, message: "Введите пароль" }]}
                        >
                            <Input.Password placeholder="Пароль" />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" block loading={loading}>
                                Войти
                            </Button>
                        </Form.Item>

                        <Text style={{ display: "block", textAlign: "center" }}>
                            Нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link>
                        </Text>
                    </Form>
                </Card>
            </Col>
        </Row>
    );
};

export default Login;
