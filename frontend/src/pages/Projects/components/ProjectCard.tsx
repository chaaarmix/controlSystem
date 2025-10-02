import React from "react";
import { Card, Tag, Button } from "antd";

interface User { id: number; full_name: string; role: string; }
interface Task {
    id: number;
    name: string;
    status: string;
    project_id: number;
}

interface Project {
    id: number;
    name: string;
    description: string;
    manager: User;
    customer: User;
    active: boolean;
    tasks?: Task[];
}

interface Props {
    project: Project;
    userRole: "engineer" | "manager" | "customer"; // текущая роль пользователя
}

const ProjectCard: React.FC<Props> = ({ project, userRole }) => {
    return (
        <Card
            title={project.name}
            extra={project.active ? <Tag color="green">Активен</Tag> : <Tag color="red">Не активен</Tag>}
            bordered
        >
            <p>{project.description}</p>
            <p><b>Руководитель:</b> {project.manager.full_name}</p>
            <p><b>Заказчик:</b> {project.customer.full_name}</p>
            <p><b>Задачи:</b> {project.active ? project.tasks?.length : 0}</p>

            {/* Кнопка добавления дефекта только для инженера */}
            {userRole === "engineer" && (
                <Button type="primary">Добавить дефект</Button>
            )}
            {userRole === "manager" && (
                <Button type="primary">Добавить дефект</Button>
            )}
        </Card>
    );
};

export default ProjectCard;
