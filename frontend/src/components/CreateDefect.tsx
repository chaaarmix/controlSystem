import React, { useEffect, useState } from "react";
import { Form, Input, Button, Upload, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import AppHeader from "./AppHeader/AppHeader";
import AppSidebar from "./AppSidebar/AppSidebar";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/api";

const { Dragger } = Upload;

const CreateDefect: React.FC = () => {
    const [project, setProject] = useState<any | null>(null);
    const [fileList, setFileList] = useState<any[]>([]);
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();

    const params = new URLSearchParams(location.search);
    const projectId = params.get("projectId");

    useEffect(() => {
        if (projectId) {
            api.get(`/projects/${projectId}`)
                .then(res => setProject(res.data))
                .catch(() => message.error("Не удалось загрузить проект"));
        }
    }, [projectId]);

    const onFinish = async (values: any) => {
        if (!projectId) {
            message.error("Не указан проект");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("title", values.title);
            formData.append("description", values.description || "");
            formData.append("project_id", projectId);
            formData.append("initiator_id", String(currentUser?.id));

            console.log("Отправка дефекта:", Object.fromEntries(formData.entries()));
            const defectRes = await api.post("/defects", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            const defectId = defectRes.data.id;
            console.log("Создан дефект с ID:", defectId);

            if (fileList.length === 0) {
                message.success("Дефект создан без файлов");
                navigate("/projects");
                return;
            }

            for (const file of fileList) {
                const fileObj = file instanceof File ? file : file.originFileObj;
                if (!fileObj) {
                    console.warn("Файл не найден:", file);
                    continue;
                }

                const fileData = new FormData();
                fileData.append("file", fileObj);
                fileData.append("defect_id", String(defectId));

                await api.post("/defects/test-upload", fileData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
            }

            message.success("Дефект создан и файлы загружены");
            navigate("/projects");

        } catch (err) {
            console.error("Ошибка при создании дефекта или загрузке файлов:", err);
            message.error("Ошибка при создании дефекта или загрузке файлов");
        }
    };


    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            <AppSidebar role={localStorage.getItem("role") as "engineer" | "manager" | "customer"} />
            <div style={{ flex: 1 }}>
                <AppHeader />
                <div style={{ padding: 24 }}>
                    <h2>Создать дефект</h2>
                    <Form layout="vertical" onFinish={onFinish}>
                        <Form.Item
                            name="title"
                            label="Название"
                            rules={[{ required: true, message: "Введите название" }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item name="description" label="Описание">
                            <Input.TextArea rows={4} />
                        </Form.Item>

                        {project && (
                            <Form.Item label="Проект">
                                <Input value={project.name} disabled />
                            </Form.Item>
                        )}

                        <Form.Item label="Прикрепить файлы">
                            <Dragger
                                multiple
                                fileList={fileList}
                                beforeUpload={(file) => {
                                    setFileList(prev => [...prev, file]);
                                    return false;
                                }}
                                onRemove={(file) => {
                                    setFileList(prev => prev.filter(f => f !== file));
                                }}
                            >
                                <p className="ant-upload-drag-icon">
                                    <InboxOutlined />
                                </p>
                                <p className="ant-upload-text">
                                    Перетащите файлы или нажмите чтобы загрузить
                                </p>
                            </Dragger>
                        </Form.Item>

                        <Form.Item label="Инициатор">
                            <Input value={currentUser?.full_name} disabled />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit">Создать</Button>
                            <Button style={{ marginLeft: 8 }} onClick={() => navigate("/projects")}>Отмена</Button>
                        </Form.Item>
                    </Form>
                </div>
            </div>
        </div>
    );
};

export default CreateDefect;
