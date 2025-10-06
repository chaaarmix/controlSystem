import React, { useEffect, useState } from "react";
import {Card, Button, Select, DatePicker, message, Tag, Typography, List, Layout} from "antd";
import dayjs from "dayjs";
import AppHeader from "../../components/AppHeader/AppHeader";
import AppSidebar from "../../components/AppSidebar/AppSidebar";
import { api } from "../../api/api";
import styles from "../../main.module.css";
import {Content} from "antd/es/layout/layout";

const { Option } = Select;
const { Text, Link, Paragraph } = Typography;

interface User {
    id: number;
    full_name: string;
    role: string;
}

interface DefectFile {
    id: number;
    file_name: string;
    file_path: string;
}

interface Defect {
    id: number;
    title: string;
    description: string;
    project_id: number;
    initiator: User;
    status: string;
    files?: DefectFile[];
}

const statusColors: Record<string, string> = {
    "Новая": "blue"
};

const DefectsPage: React.FC = () => {
    const [defects, setDefects] = useState<Defect[]>([]);
    const [engineers, setEngineers] = useState<User[]>([]);
    const [assignees, setAssignees] = useState<{ [key: number]: number }>({});
    const [dueDates, setDueDates] = useState<{ [key: number]: any }>({});

    useEffect(() => {
        api.get("/defects/for-manager")
            .then(res => setDefects(res.data))
            .catch(() => message.error("Не удалось загрузить дефекты"));

        api.get("/users?role=engineer")
            .then(res => setEngineers(res.data))
            .catch(() => message.error("Не удалось загрузить инженеров"));
    }, []);

    const handleAssign = async (defectId: number) => {
        if (!assignees[defectId]) return;
        console.log("Assign payload:", {
            defect_id: defectId,
            assignee_id: assignees[defectId],
            due_date: dueDates[defectId]?.toISOString(),
            actor_id: Number(localStorage.getItem("user_id")),
        });

        try {
            await api.post("/defects/assign", {
                defect_id: defectId,
                assignee_id: assignees[defectId],
                due_date: dueDates[defectId]?.toISOString(),
                actor_id: Number(localStorage.getItem("user_id")),
            });

            message.success("Дефект преобразован в задачу!");
            setDefects(defects.filter(d => d.id !== defectId));
        } catch {
            message.error("Ошибка при назначении дефекта");
        }
    };

    return (
        <Layout className={styles.layout} style={{ display: "flex", minHeight: "100vh" }}>
            <AppSidebar role="manager" />
            <div style={{ flex: 1 }}>
                <AppHeader />
                <Content style={{ padding: 24 }}  className={styles.contentWrapper}>
                    <div className={styles.content}>
                    <Typography.Title level={2}>Дефекты</Typography.Title>
                    <List
                        dataSource={defects}
                        renderItem={defect => (
                            <List.Item style={{ marginBottom: 16 }}>
                                <Card title={defect.title} style={{ width: "100%" }}>
                                    <Paragraph>
                                        <Text strong>Описание: </Text>
                                        <Text>{defect.description}</Text>
                                    </Paragraph>

                                    <Paragraph>
                                        <Text strong>Инициатор: </Text>
                                        <Text>{defect.initiator.full_name}</Text>
                                    </Paragraph>

                                    <Paragraph>
                                        <Text strong>Статус: </Text>
                                        <Tag color={statusColors[defect.status] || "default"}>
                                            {defect.status}
                                        </Tag>
                                    </Paragraph>

                                    {defect.files && defect.files.length > 0 && (
                                        <Paragraph>
                                            <Text strong>Файлы: </Text>
                                            <List
                                                size="small"
                                                dataSource={defect.files}
                                                renderItem={file => {
                                                    const fileUrl = `http://localhost:8080/uploads/${encodeURIComponent(file.file_name)}`;

                                                    return (
                                                        <List.Item>
                                                            <Link href={fileUrl} target="_blank">{file.file_name}</Link>
                                                        </List.Item>
                                                    );
                                                }}
                                            />
                                        </Paragraph>
                                    )}

                                    <Select
                                        placeholder="Выберите инженера"
                                        style={{ width: 200, marginRight: 8 }}
                                        value={assignees[defect.id]}
                                        onChange={val => setAssignees({ ...assignees, [defect.id]: val })}
                                    >
                                        {engineers.map(e => (
                                            <Option key={e.id} value={e.id}>
                                                {e.full_name}
                                            </Option>
                                        ))}
                                    </Select>

                                    <DatePicker
                                        showTime
                                        style={{ marginRight: 8 }}
                                        value={dueDates[defect.id] ? dayjs(dueDates[defect.id]) : undefined}
                                        onChange={date => setDueDates({ ...dueDates, [defect.id]: date })}
                                    />

                                    <Button
                                        type="primary"
                                        onClick={() => handleAssign(defect.id)}
                                        disabled={!assignees[defect.id]}
                                    >
                                        Сохранить
                                    </Button>
                                </Card>
                            </List.Item>
                        )}
                    />
                    </div>
                </Content>
            </div>
        </Layout>
    );
};

export default DefectsPage;
