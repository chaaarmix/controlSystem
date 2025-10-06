import React, { useEffect } from "react";
import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { FrownOutlined } from "@ant-design/icons";

const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    const isAuthenticated = Boolean(localStorage.getItem("token"));

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate(isAuthenticated ? "/" : "/login");
        }, 3000);
        return () => clearTimeout(timer);
    }, [isAuthenticated, navigate]);

    return (
        <Result
            icon={<FrownOutlined style={{ fontSize: 72, color: "#ff4d4f" }} />}
            status="404"
            title="404"
            subTitle="Страница не найдена. Вы будете перенаправлены..."
            extra={
                <Button type="primary" onClick={() => navigate(isAuthenticated ? "/" : "/login")}>
                    Перейти
                </Button>
            }
        />
    );
};

export default NotFoundPage;
