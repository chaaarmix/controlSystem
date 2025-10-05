import React, { useEffect, useState } from "react";
import { Card, Tag, Typography, List, message, Select, Collapse, Space, Input, Button, Row, Col, Divider } from "antd";
import dayjs from "dayjs";
import AppHeader from "../../components/AppHeader/AppHeader";
import AppSidebar from "../../components/AppSidebar/AppSidebar";
import { api } from "../../api/api";
import { UploadOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;
const { Option } = Select;

interface User { id: number; full_name: string; role: string; }
interface DefectHistory { id: number; created_at: string; defect_id: number; actor_id: number; actor?: User; action_type: string; action_text: string; }
interface DefectFile { id: number; file_name: string; file_path: string; }
interface Project { id: number; name: string; }
interface Defect { id: number; title: string; description: string; project_id: number; project?: Project; initiator: User; files?: DefectFile[]; history?: DefectHistory[]; }
interface Task { id: number; name: string; description: string; status: string; project_id: number; due_date?: string; creator: User; assignee?: User; related_defect?: Defect; newComment?: string; newFile?: File; }

const statusColors: Record<string, string> = {
    "Новая": "blue",
    "В работа": "orange",
    "На проверке": "purple",
    "Закрыта": "green",
};

const statusOptions = ["Новая", "В работe", "На проверке", "Закрыта"];

const TasksPage: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [filterStatus, setFilterStatus] = useState<string | null>(null);

    const userId = localStorage.getItem("user_id");
    const storedRole = localStorage.getItem("role");
    const userRole: "engineer" | "manager" | "customer" =
        storedRole === "engineer" || storedRole === "manager" || storedRole === "customer"
            ? storedRole
            : "engineer";

    useEffect(() => {
        if (!userId || !userRole) { message.error("Пользователь не авторизован"); return; }
        const url = userRole === "manager" ? "/tasks" : `/my-tasks?assignee_id=${userId}`;
        api.get(url).then(res => setTasks(res.data)).catch(() => message.error("Не удалось загрузить задачи"));
    }, [userId, userRole]);

    const handleStatusChange = async (taskId: number, newStatus: string) => {
        if (newStatus === "Закрыта" && userRole !== "manager") { message.warning("Только менеджер может закрывать задачи"); return; }
        try {
            await api.put(`/tasks/${taskId}/status`, { status: newStatus, actor_id: Number(userId) });
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
            message.success("Статус задачи обновлен");
        } catch { message.error("Не удалось обновить статус задачи"); }
    };

    const handleAddComment = async (taskId: number, commentText: string) => {
        if (!commentText.trim()) return;
        try {
            const defectId = tasks.find(t => t.id === taskId)?.related_defect?.id;
            if (!defectId) return;
            const res = await api.post("/defects/comment", { defect_id: defectId, actor_id: Number(userId), comment: commentText });
            const newHistoryItem = res.data;
            setTasks(prevTasks => prevTasks.map(task => {
                if (task.id === taskId && task.related_defect) {
                    return {
                        ...task,
                        related_defect: { ...task.related_defect, history: [...(task.related_defect.history || []), newHistoryItem] },
                        newComment: ""
                    };
                }
                return task;
            }));
        } catch { message.error("Не удалось добавить комментарий"); }
    };

    const filteredTasks = tasks
        .filter(t => !searchTerm || t.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter(t => !filterStatus || t.status === filterStatus)
        .sort((a, b) => (a.status === "Закрыта" && b.status !== "Закрыта") ? 1 : (b.status === "Закрыта" && a.status !== "Закрыта") ? -1 : 0);

    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            <AppSidebar role={userRole} />
            <div style={{ flex: 1 }}>
                <AppHeader />
                <div style={{ padding: 24 }}>
                    <Typography.Title level={2}>{userRole === "manager" ? "Все задачи" : "Мои задачи"}</Typography.Title>

                    <Row gutter={[16, 16]} style={{ marginBottom: 24,justifyContent:"space-between" }}>
                        <Col xs={24} sm={12} md={8}>
                            <Input placeholder="Поиск по названию задачи" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Select placeholder="Фильтр по статусу" allowClear value={filterStatus || undefined} onChange={val => setFilterStatus(val || null)} style={{ width: "100%" }}>
                                {statusOptions.map(s => <Option key={s} value={s}>{s}</Option>)}
                            </Select>
                        </Col>
                    </Row>

                    <List
                        dataSource={filteredTasks}
                        grid={{ gutter: 16, column: 1 }}
                        renderItem={task => (
                            <List.Item>
                                <Card
                                    title={<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span>{task.name}</span>
                                        <Tag color={statusColors[task.status]}>{task.status}</Tag>
                                    </div>}
                                    bordered
                                    style={{
                                        backgroundColor: task.status === "Закрыта" ? "#f9f9f9" : "white",
                                        color: task.status === "Закрыта" ? "#888" : "inherit",
                                        borderRadius: 8,
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                                    }}
                                >
                                    <Row gutter={[16, 16]} >
                                        {/* Левый столбик: дефект */}
                                        <Col xs={24} md={12}>
                                            {task.related_defect ? (
                                                <Card type="inner" title={`Дефект: ${task.related_defect.title || "-"}`} size="small">
                                                    <Paragraph><Text strong>Описание:</Text> {task.related_defect.description || "-"}</Paragraph>
                                                    <Paragraph><Text strong>Проект:</Text> {task.related_defect?.project?.name || "-"}</Paragraph>
                                                    <Paragraph><Text strong>Инициатор:</Text> {task.related_defect.initiator?.full_name || "-"}</Paragraph>
                                                    {task.related_defect.files && task.related_defect.files.length > 0 && (
                                                        <Paragraph>
                                                            <Text strong>Файлы:</Text>
                                                            <List
                                                                size="small"
                                                                dataSource={task.related_defect.files}
                                                                renderItem={file => {
                                                                    const fileUrl = `http://localhost:8080/uploads/${encodeURIComponent(file.file_name)}`;
                                                                    return <List.Item><a href={fileUrl} target="_blank" rel="noreferrer">{file.file_name}</a></List.Item>;
                                                                }}
                                                            />
                                                        </Paragraph>
                                                    )}
                                                </Card>
                                            ) : <Text type="secondary">Нет связанного дефекта</Text>}
                                        </Col>

                                        {/* Правый столбик: описание задачи и статус */}
                                        <Col xs={24} md={12} >
                                            <Paragraph>
                                                <Text strong>Изменить статус:</Text>
                                                <Select value={task.status} onChange={value => handleStatusChange(task.id, value)} style={{ marginLeft: 8, width: 150 }}>
                                                    {statusOptions.map(s => { if (s === "Закрыта" && userRole !== "manager") return null; return <Option key={s} value={s}>{s}</Option>; })}
                                                </Select>
                                            </Paragraph>
                                            <Paragraph><Text strong>Описание задачи:</Text> {task.description}</Paragraph>
                                            {task.due_date && <Paragraph><Text strong>Срок выполнения:</Text> {dayjs(task.due_date).format("DD.MM.YYYY HH:mm")}</Paragraph>}
                                            <Paragraph><Text strong>Создатель:</Text> {task.creator?.full_name || "-"}</Paragraph>
                                            {task.assignee && <Paragraph><Text strong>Исполнитель:</Text> {task.assignee?.full_name || "-"}</Paragraph>}
                                        </Col>
                                    </Row>

                                    {/* История и комментарии */}
                                    {task.related_defect?.history && (
                                        <>
                                            <Divider />
                                            <Collapse>
                                                <Collapse.Panel header={`История дефекта (${task.related_defect.history.length})`} key="history">
                                                    <List
                                                        size="small"
                                                        dataSource={task.related_defect.history}
                                                        renderItem={h => (
                                                            <List.Item>
                                                                <div>
                                                                    <Text type="secondary">{dayjs(h.created_at).format("DD.MM.YYYY HH:mm")}</Text><br/>
                                                                    <Text strong>Пользователь:</Text> {h.actor?.full_name || "неизвестный пользователь"}<br/>
                                                                    <Text strong>Действие:</Text> {h.action_type}<br/>
                                                                    <Text strong>Описание:</Text> {h.action_text}
                                                                </div>
                                                            </List.Item>
                                                        )}
                                                    />

                                                    <Space direction="vertical" style={{ width: "100%", marginTop: 16 }}>
                                                        <Input.TextArea rows={3} placeholder="Добавить комментарий..." value={task.newComment || ""} onChange={e => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, newComment: e.target.value } : t))} />
                                                        <label htmlFor={`file-upload-${task.id}`}>
                                                            <Button icon={<UploadOutlined />} style={{ width: "100%" }}>{task.newFile ? task.newFile.name : "Выбрать файл"}</Button>
                                                        </label>
                                                        <input id={`file-upload-${task.id}`} type="file" style={{ display: "none" }} onChange={e => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, newFile: e.target.files?.[0] } : t))} />
                                                        <Button type="primary" onClick={async () => {
                                                            const taskToUpdate = tasks.find(t => t.id === task.id);
                                                            if (!taskToUpdate || !taskToUpdate.related_defect) return;
                                                            const formData = new FormData();
                                                            formData.append("defect_id", String(taskToUpdate.related_defect.id));
                                                            formData.append("actor_id", String(userId));
                                                            let commentText = taskToUpdate.newComment?.trim() || "";
                                                            if (taskToUpdate.newFile) commentText += commentText ? `; Добавлен файл ${taskToUpdate.newFile.name}` : `Добавлен файл ${taskToUpdate.newFile.name}`;
                                                            formData.append("comment", commentText);
                                                            if (taskToUpdate.newFile) formData.append("file", taskToUpdate.newFile);

                                                            try {
                                                                const res = await api.post("/defects/comment-with-file", formData, { headers: { "Content-Type": "multipart/form-data" } });
                                                                const { historyItem, file } = res.data;
                                                                setTasks(prev => prev.map(t => {
                                                                    if (t.id === task.id && t.related_defect) {
                                                                        return {
                                                                            ...t,
                                                                            related_defect: { ...t.related_defect, history: [...(t.related_defect.history || []), historyItem], files: file ? [...(t.related_defect.files || []), file] : t.related_defect.files },
                                                                            newComment: "",
                                                                            newFile: undefined
                                                                        };
                                                                    }
                                                                    return t;
                                                                }));
                                                                message.success("Комментарий с файлом добавлен!");
                                                            } catch { message.error("Не удалось добавить комментарий с файлом"); }
                                                        }}>Отправить</Button>
                                                    </Space>
                                                </Collapse.Panel>
                                            </Collapse>
                                        </>
                                    )}
                                </Card>
                            </List.Item>
                        )}
                    />
                </div>
            </div>
        </div>
    );
};

export default TasksPage;
