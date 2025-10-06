import React, { useEffect, useState } from "react";
import {
    Table,
    Select,
    Button,
    DatePicker,
    message,
    Typography,
    Row,
    Col,
    Card,
    Space,
    Layout,
} from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { api } from "../../api/api";
import * as XLSX from "xlsx";
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend,
    CartesianGrid,
    XAxis,
    YAxis,
} from "recharts";
import styles from "../../main.module.css";
import AppSidebar from "../../components/AppSidebar/AppSidebar";
import AppHeader from "../../components/AppHeader/AppHeader";
import { Content } from "antd/es/layout/layout";

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const COLORS = ["#1890ff", "#faad14", "#722ed1", "#52c41a", "#f5222d"];

interface ReportChartItem {
    name: string;
    count: number;
    [key: string]: string | number;
}



const ReportsPage: React.FC = () => {
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState<number | null>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

    const role =
        (localStorage.getItem("role") as "engineer" | "manager" | "customer") || "engineer";

    useEffect(() => {
        api.get("/projects")
            .then((res) => setProjects(res.data))
            .catch(() => message.error("Не удалось загрузить проекты"));
    }, []);

    useEffect(() => {
        if (!selectedProject) return;
        api.get(`/reports/tasks?project_id=${selectedProject}`)
            .then((res) => setTasks(res.data))
            .catch(() => message.error("Не удалось загрузить задачи для отчёта"));
    }, [selectedProject]);

    useEffect(() => {
        const userId = localStorage.getItem("user_id");
        if (!userId) {
            message.error("Ошибка: не найден ID пользователя");
            return;
        }

        api.get("/projects")
            .then((res) => {
                let allProjects = res.data;

                if (role === "manager") {
                    setProjects(allProjects);
                    return;
                }

                const filtered = allProjects.filter(
                    (p: any) =>
                        String(p.customer_id) === userId
                );

                setProjects(filtered);
            })
            .catch(() => message.error("Не удалось загрузить проекты"));
    }, [role]);

    const filteredTasks = tasks
        .filter((t) => !statusFilter || t.status === statusFilter)
        .filter(
            (t) =>
                !dateRange ||
                (dayjs(t.due_date).isAfter(dateRange[0]) &&
                    dayjs(t.due_date).isBefore(dateRange[1]))
        );

    const formatDate = (date: string | null) =>
        date ? dayjs(date).format("DD.MM.YYYY HH:mm") : "-";

    const columns = [
        { title: "Проект", dataIndex: "project_name", key: "project_name" },
        { title: "Дефект", dataIndex: "defect_name", key: "defect_name" },
        { title: "Задача", dataIndex: "task_name", key: "task_name" },
        { title: "Статус", dataIndex: "status", key: "status" },
        { title: "Исполнитель", dataIndex: "assignee_name", key: "assignee_name" },
        {
            title: "Срок выполнения",
            dataIndex: "due_date",
            key: "due_date",
            render: (text: string, record: any) => {
                const isOverdue = dayjs(text).isBefore(dayjs()) && record.status !== "Закрыта";
                return (
                    <span style={{ color: isOverdue ? "red" : "inherit" }}>
        {formatDate(text)} {isOverdue}
      </span>
                );
            },
        },
        { title: "История изменений", dataIndex: "history_count", key: "history_count" },
        {
            title: "Последнее обновление",
            dataIndex: "last_update",
            key: "last_update",
            render: (text: string) => formatDate(text),
        },
    ];

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(
            filteredTasks.map((t) => ({
                Проект: t.project_name,
                Дефект: t.defect_name,
                Задача: t.task_name,
                Статус: t.status,
                Исполнитель: t.assignee_name,
                "Срок выполнения": formatDate(t.due_date),
                "История изменений": t.history_count,
                "Последнее обновление": formatDate(t.last_update),
            }))
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Отчет");
        XLSX.writeFile(workbook, `report_${dayjs().format("DDMMYYYY_HHmm")}.xlsx`);
    };

    const tasksByStatus: ReportChartItem[] = Object.values(
        filteredTasks.reduce((acc: any, t) => {
            acc[t.status] = acc[t.status] || { name: t.status, count: 0 };
            acc[t.status].count++;
            return acc;
        }, {})
    );

    const tasksByAssignee: ReportChartItem[] = Object.values(
        filteredTasks.reduce((acc: any, t) => {
            acc[t.assignee_name] = acc[t.assignee_name] || {
                name: t.assignee_name || "Без исполнителя",
                count: 0,
            };
            acc[t.assignee_name].count++;
            return acc;
        }, {})
    );

    const closedTasks = filteredTasks.filter((t) => t.status === "Закрыта");

    const closedCount = closedTasks.length;
    const avgCompletionTime = filteredTasks
        .filter(t => t.status === "Закрыта")
        .map(t => dayjs(t.last_update).diff(dayjs(t.created_at), "hour"))
        .reduce((a, b) => a + b, 0) / closedCount;

    return (
        <Layout className={styles.layout}>
            <AppSidebar role={role} />
            <Layout>
                <AppHeader />
                <Content className={styles.contentWrapper}>
                    <div className={styles.content} >
                        <Title level={2}>Отчётность и аналитика</Title>

                        <Row gutter={16} style={{ marginBottom: 16 }}>
                            <Col xs={24} sm={8}>
                                <Select
                                    placeholder="Выберите проект"
                                    style={{ width: "100%" }}
                                    value={selectedProject || undefined}
                                    onChange={setSelectedProject}
                                >
                                    {projects.map((p) => (
                                        <Option key={p.id} value={p.id}>
                                            {p.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Col>
                            <Col xs={24} sm={8}>
                                <Select
                                    placeholder="Фильтр по статусу"
                                    allowClear
                                    style={{ width: "100%" }}
                                    value={statusFilter || undefined}
                                    onChange={setStatusFilter}
                                >
                                    <Option value="Новая">Новая</Option>
                                    <Option value="В работе">В работе</Option>
                                    <Option value="На проверке">На проверке</Option>
                                    <Option value="Закрыта">Закрыта</Option>
                                </Select>
                            </Col>
                            <Col xs={24} sm={8}>
                                <RangePicker
                                    style={{ width: "100%" }}
                                    onChange={(dates) =>
                                        setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])
                                    }
                                />
                            </Col>
                        </Row>

                        <Space style={{ marginBottom: 16 }}>
                            <Button
                                icon={<DownloadOutlined />}
                                type="primary"
                                onClick={exportToExcel}
                            >
                                Скачать Excel
                            </Button>
                        </Space>

                        <Card title="Таблица отчёта" style={{ marginBottom: 24 }}>
                            <Table columns={columns} dataSource={filteredTasks} rowKey="id" />
                        </Card>

                        <Row gutter={16}>
                            <Col xs={24} md={8}>
                                <Card title="Распределение задач по статусу">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={tasksByStatus}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip formatter={(value: number) => [`${value}`, "Количество"]} />
                                            <Legend />
                                            <Bar dataKey="count" fill="#1890ff" name="Количество" />
                                        </BarChart>

                                    </ResponsiveContainer>
                                </Card>
                            </Col>

                            <Col xs={24} md={8}>
                                <Card title="Количество задач по исполнителям">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={tasksByAssignee}
                                                dataKey="count"
                                                nameKey="name"
                                                outerRadius={100}
                                                label
                                                name="Количество"
                                            >
                                                {tasksByAssignee.map((_, index) => (
                                                    <Cell
                                                        key={`cell-assignee-${index}`}
                                                        fill={COLORS[index % COLORS.length]}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => [`${value}`, "Количество"]} />
                                            <Legend />

                                        </PieChart>
                                    </ResponsiveContainer>
                                </Card>


                            </Col>
                            <Col xs={24} md={8}>
                                <Card>
                                    <Title level={4}>Среднее время закрытия дефекта:</Title>
                                    <p>{avgCompletionTime.toFixed(1)} ч.</p>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default ReportsPage;
