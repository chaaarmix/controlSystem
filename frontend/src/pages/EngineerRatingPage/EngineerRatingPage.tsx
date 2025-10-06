import React, { useEffect, useState, useMemo } from "react";
import {
    Layout,
    Typography,
    Card,
    Table,
    Tag,
    Row,
    Col,
    message,
    Statistic,
    Space,
    Spin,
    Skeleton,
} from "antd";
import {
    CrownOutlined,
    UserOutlined,
    BarChartOutlined,
} from "@ant-design/icons";
import { api } from "../../api/api";
import AppSidebar from "../../components/AppSidebar/AppSidebar";
import AppHeader from "../../components/AppHeader/AppHeader";
import styles from "../../main.module.css";
const { Title } = Typography;
const { Content } = Layout;

interface EngineerStat {
    name: string;
    total: number;
    closed: number;
    efficiency: number;
}

const topColors = ["#faad14", "#d9d9d9", "#b87333"];

const EngineerRatingPage: React.FC = () => {
    const [data, setData] = useState<EngineerStat[]>([]);
    const [loading, setLoading] = useState(true);

    const role =
        (localStorage.getItem("role") as "engineer" | "manager" | "customer") ||
        "engineer";

    useEffect(() => {
        setLoading(true);
        api.get("/engineers-summary")
            .then((res) => {
                const stats: EngineerStat[] = res.data.map((e: any) => ({
                    name: e.name,
                    total: e.total,
                    closed: e.closed,
                    efficiency:
                        e.total > 0 ? +(e.closed / e.total * 100).toFixed(1) : 0,
                }));
                setData(stats.sort((a, b) => b.efficiency - a.efficiency));
            })
            .catch(() => message.error("Не удалось загрузить рейтинг инженеров"))
            .finally(() => setLoading(false));
    }, []);

    const top3 = useMemo(() => data.slice(0, 3), [data]);

    return (
        <Layout className={styles.layout}>
            <AppSidebar role={role} />
            <Layout>
                <AppHeader />
                <Content className={styles.contentWrapper}>
                    <div style={{padding: 24}}
                   className={styles.content}>
                    <Title level={2}>
                        <BarChartOutlined/> Рейтинг инженеров
                    </Title>

                    {loading ? (
                        <>
                            <Skeleton active paragraph={{rows: 3}}/>
                            <Spin size="large" style={{display: "block", margin: 50}}/>
                        </>
                    ) : (
                        <>
                            <Row gutter={16} style={{marginBottom: 24}}>
                                {top3.map((eng, index) => (
                                    <Col xs={24} md={8} key={eng.name}>
                                        <Card
                                            bordered
                                            hoverable
                                            style={{
                                                textAlign: "center",
                                                borderColor: topColors[index],
                                            }}
                                        >
                                            <Space direction="vertical" align="center">
                                                <UserOutlined
                                                    style={{
                                                        fontSize: 50,
                                                        color: topColors[index],
                                                        marginBottom: 10,
                                                    }}
                                                />
                                                <Title level={4} style={{marginBottom: 5}}>
                                                    {eng.name}
                                                </Title>
                                                <CrownOutlined
                                                    style={{
                                                        fontSize: 24,
                                                        color: topColors[index],
                                                        marginBottom: 5,
                                                    }}
                                                />
                                                <Statistic
                                                    title="Эффективность"
                                                    value={eng.efficiency}
                                                    suffix="%"
                                                    valueStyle={{color: "#1890ff"}}
                                                />
                                            </Space>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>

                            <Card title={<><CrownOutlined/> Полный рейтинг</>}>
                                <Table
                                    columns={[
                                        {
                                            title: "Инженер",
                                            dataIndex: "name",
                                            key: "name",
                                            render: (text: string, record: EngineerStat, index: number) => (
                                                <Space>
                                                    {index < 3 && (
                                                        <CrownOutlined style={{color: topColors[index]}}/>
                                                    )}
                                                    {text}
                                                </Space>
                                            ),
                                        },
                                        {title: "Всего задач", dataIndex: "total", key: "total"},
                                        {title: "Закрыто", dataIndex: "closed", key: "closed"},
                                        {
                                            title: "Эффективность (%)",
                                            dataIndex: "efficiency",
                                            key: "efficiency",
                                            render: (value: number) => (
                                                <Tag
                                                    color={value > 80 ? "green" : value > 50 ? "gold" : "red"}
                                                >
                                                    {value}%
                                                </Tag>
                                            ),
                                        },
                                    ]}
                                    dataSource={data}
                                    rowKey="name"
                                    pagination={{pageSize: 10}}
                                />
                            </Card>
                        </>
                    )}
                </div>
            </Content>
        </Layout>
        </Layout>
    );
};

export default EngineerRatingPage;
