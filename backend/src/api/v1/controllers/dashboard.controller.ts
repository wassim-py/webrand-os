import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardData = async (req: Request, res: Response) => {
    try {
        // Basic data fetching
        const deliveredOrders = await prisma.order.findMany({
            where: { status: 'DELIVERED' },
            include: { lineItems: { include: { variant: true } } },
        });

        const returnedOrdersCount = await prisma.order.count({ where: { status: 'RETURNED' } });
        const ledger = await prisma.financesLedger.findMany();

        // 1. KPI Calculations
        const totalRevenue = deliveredOrders.reduce((sum, order) =>
            sum + order.lineItems.reduce((orderSum, item) =>
                orderSum + (item.quantity * Number(item.actualSalePrice)), 0), 0);

        const totalCOGS = deliveredOrders.reduce((sum, order) =>
            sum + order.lineItems.reduce((orderSum, item) =>
                orderSum + (item.quantity * Number(item.variant.costPrice)), 0), 0);

        const grossProfit = totalRevenue - totalCOGS;

        const totalMarketingSpend = ledger
            .filter(t => t.type === 'Marketing_Spend')
            .reduce((sum, t) => sum + Number(t.moneyOut), 0);

        const netProfit = grossProfit - totalMarketingSpend;

        const averageOrderValue = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;

        const returnRate = deliveredOrders.length > 0 ? (returnedOrdersCount / deliveredOrders.length) * 100 : 0;

        const currentCapital = ledger.reduce((sum, t) => sum + Number(t.moneyIn) - Number(t.moneyOut), 0);

        // 2. Chart Data
        // Revenue vs Profit (simplified: monthly for last 6 months)
        // In a real app, this would be more robust and handle date ranges from req.query
        const monthlyData = {};
        for (const order of deliveredOrders) {
            const month = new Date(order.orderDate).toISOString().slice(0, 7); // YYYY-MM
            if (!monthlyData[month]) {
                monthlyData[month] = { revenue: 0, profit: 0 };
            }
            const orderRevenue = order.lineItems.reduce((sum, i) => sum + (i.quantity * Number(i.actualSalePrice)), 0);
            const orderCogs = order.lineItems.reduce((sum, i) => sum + (i.quantity * Number(i.variant.costPrice)), 0);
            monthlyData[month].revenue += orderRevenue;
            monthlyData[month].profit += (orderRevenue - orderCogs);
        }
        const revenueVsProfitChart = Object.entries(monthlyData).map(([label, data]) => ({ label, ...data }));


        // Top 5 Best-Selling Products by Net Profit
        const productProfits = {};
        const products = await prisma.product.findMany({ include: { variants: { include: { orderLineItems: { where: { order: { status: 'DELIVERED' } } } } } } });

        for (const product of products) {
            let totalProductRevenue = 0;
            let totalProductCogs = 0;
            for (const variant of product.variants) {
                for (const item of variant.orderLineItems) {
                    totalProductRevenue += item.quantity * Number(item.actualSalePrice);
                    totalProductCogs += item.quantity * Number(variant.costPrice);
                }
            }
            if (totalProductRevenue > 0) {
                productProfits[product.name] = totalProductRevenue - totalProductCogs;
            }
        }

        const top5Products = Object.entries(productProfits)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, profit]) => ({ name, profit }));

        res.status(200).json({
            kpis: {
                currentCapital,
                netProfit,
                grossProfit,
                averageOrderValue,
                returnRate,
            },
            charts: {
                revenueVsProfit: revenueVsProfitChart,
                top5Products: top5Products,
            }
        });

    } catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).json({ error: 'Failed to fetch dashboard data.' });
    }
};
