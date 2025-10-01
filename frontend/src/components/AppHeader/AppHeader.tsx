import React from "react";
import {Layout, Button, Flex} from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import styles from "./AppHeader.module.css";
import logo from "../../assets/logo.png";

const { Header } = Layout;

const AppHeader: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    return (
        <Header className={styles.header}>
            <Flex className={styles.centerContent}>
                <img src={logo} alt="logo" className={styles.logo} />
            </Flex>

            <Button
                type="primary"
                danger
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                className={styles.logoutButton}
            >
                Выйти
            </Button>
        </Header>
    );
};

export default AppHeader;
