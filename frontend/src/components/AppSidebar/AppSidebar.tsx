import React from "react";
import { Layout, Menu, MenuProps } from "antd";
import {
    ProjectOutlined,
    ProfileOutlined,
    UserOutlined,
    FileTextOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./AppSidebar.module.css";

const { Sider } = Layout;

interface AppSidebarProps {
    role: "engineer" | "manager" | "customer";
}

const AppSidebar: React.FC<AppSidebarProps> = ({ role }) => {
    const navigate = useNavigate();
    const location = useLocation(); // узнаем текущий путь

    const menuItems: MenuProps["items"] = [];

    if (role === "engineer") {
        menuItems.push(
            { key: "/", icon: <UserOutlined />, label: "Мой профиль" },
            { key: "/projects", icon: <ProjectOutlined />, label: "Мои проекты" },
            { key: "/tasks", icon: <ProfileOutlined />, label: "Мои задачи" }
        );
    } else if (role === "manager") {
        menuItems.push(
            { key: "/", icon: <UserOutlined />, label: "Мой профиль" },
            { key: "/projects", icon: <ProjectOutlined />, label: "Проекты" },
            { key: "/tasks", icon: <ProfileOutlined />, label: "Задачи" },
            { key: "/reports", icon: <FileTextOutlined />, label: "Отчёты" }
        );
    } else if (role === "customer") {
        menuItems.push(
            { key: "/", icon: <UserOutlined />, label: "Мой профиль" },
            { key: "/reports", icon: <FileTextOutlined />, label: "Отчёты" }
        );
    }

    return (
        <Sider width={200} className={styles.sider}>
            <Menu
                mode="inline"
                selectedKeys={[location.pathname === "/" ? "/" : location.pathname]}
                onClick={(e) => navigate(e.key)}
                className={styles.menu}
                items={menuItems}
            />
        </Sider>
    );
};

export default AppSidebar;
