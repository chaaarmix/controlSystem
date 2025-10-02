import React, { useState } from "react";
import {Row, Col, Input, Select, Spin} from "antd";
import ProjectCard from "./ProjectCard";
import {useAuth} from "../../../context/AuthContext";

const { Search } = Input;
const { Option } = Select;

interface User { id: number; full_name: string; role: string; }
interface Project {
    id: number;
    name: string;
    description: string;
    manager: User;
    customer: User;
    active: boolean;
    tasks?: { id: number; name: string; status: string; project_id: number }[];
}

interface Props {
    projects: Project[];
}

const ProjectsList: React.FC<Props> = ({ projects }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
    const { currentUser } = useAuth();
    // Если пользователь ещё не загружен, показываем загрузку
    if (!currentUser) {
        return <Spin tip="Загрузка пользователя..." />;
    }

    // Фильтруем проекты по названию, активности и роли пользователя
    const filteredProjects = projects.filter(project => {
        const matchesName = project.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesActive =
            activeFilter === "all" ||
            (activeFilter === "active" && project.active) ||
            (activeFilter === "inactive" && !project.active);

        // Проверка роли
        let matchesRole = true;
        if (currentUser.role === "customer") {
            // Для customer показываем только проекты, где он manager или customer
            matchesRole =
                project.manager.id === currentUser.id || project.customer.id === currentUser.id;
        }

        return matchesName && matchesActive && matchesRole;
    });


    return (
        <div>
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <Search
                    placeholder="Введите название проекта"
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ flex: 1 }}
                    allowClear
                />
                <Select
                    value={activeFilter}
                    onChange={(value) => setActiveFilter(value)}
                    style={{ width: 200 }}
                >
                    <Option value="all">Все</Option>
                    <Option value="active">Активные</Option>
                    <Option value="inactive">Не активные</Option>
                </Select>
            </div>

            <Row gutter={[16, 16]}>
                {filteredProjects.map(project => (
                    <Col span={24} key={project.id}>
                        <ProjectCard project={project} userRole={currentUser!.role} />

                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default ProjectsList;
