import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '../libs/apiCalls';
import { StatsCardShimmer, ChartShimmer, PieChartShimmer, TableShimmer, CardShimmer } from '../components/ui/shimmer';
import Info from '../components/info';
import Stats from '../components/stats';
import { Chart } from '../components/chart';
import DoughnutChart from '../components/piechart';
import RecentTransactions from '../components/recentTransactions';
import Accounts from '../components/accounts';



const Dashboard = () => {
    const [data, setData] = useState({
        availableBalance: 0,
        totalIncome: 0,
        totalExpense: 0,
        chartData: [],
        lastTransactions: [],
        lastAccounts: []
    });
    const [isLoading, setIsLoading] = useState(false);

    const fetchDashboardStats = async () => {
        try {
            setIsLoading(true);
            const { data: res } = await api.get('/transactions/dashboard');
            
            if (res.status) {
                setData({
                    availableBalance: parseFloat(res.dashboard.availableBalance) || 0,
                    totalIncome: parseFloat(res.dashboard.totalIncome) || 0,
                    totalExpense: parseFloat(res.dashboard.totalExpense) || 0,
                    chartData: res.dashboard.chartData || [],
                    lastTransactions: res.dashboard.lastTransactions || [],
                    lastAccounts: res.dashboard.lastAccounts || []
                });
            }
        } catch (error) {
            console.error(error);
            toast.error(
                error?.response?.data?.message || 
                "Something unexpected happened. Try again later."
            );

            if (error?.response?.data?.status === "auth_failed") {
                localStorage.removeItem("user");
                window.location.reload();
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardStats();
        const interval = setInterval(fetchDashboardStats, 30000);
        return () => clearInterval(interval);
    }, []);

    if (isLoading) {
        return (
            <div>
                {/* Info shimmer */}
                <div className="mb-8">
                    <div className="space-y-2">
                        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-48 rounded"></div>
                        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-64 rounded"></div>
                    </div>
                </div>

                {/* Stats shimmer */}
                <div className="flex flex-col items-center justify-between gap-8 mb-20 md:flex-row 2xl:gap-x-40">
                    <div className="flex flex-col items-center justify-between w-full gap-10 md:flex-row 2xl:gap-20">
                        <StatsCardShimmer />
                        <StatsCardShimmer />
                        <StatsCardShimmer />
                    </div>
                </div>

                {/* Charts shimmer */}
                <div className="flex flex-col-reverse items-center gap-10 w-full md:flex-row mb-20">
                    <ChartShimmer />
                    <PieChartShimmer />
                </div>

                {/* Tables shimmer */}
                <div className="flex flex-col-reverse gap-0 md:flex-row md:gap-10 2xl:gap-20">
                    <div className="flex-1 w-full py-20">
                        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-48 rounded mb-5"></div>
                        <TableShimmer rows={5} columns={5} />
                    </div>
                    <div className="mt-20 md:mt-0 py-5 md:py-20 w-full md:w-1/3">
                        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-32 rounded mb-6"></div>
                        <div className="w-full space-y-4">
                            <CardShimmer />
                            <CardShimmer />
                            <CardShimmer />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Info 
                title="Dashboard" 
                subTitle="Monitor your financial activities" 
            />
            <Stats 
                balance={data.availableBalance}
                income={data.totalIncome}
                expense={data.totalExpense}
            />
            <div className="flex flex-col-reverse items-center gap-10 w-full md:flex-row">
                <Chart data={data?.chartData} />
                {data?.totalIncome > 0 && (
                    <DoughnutChart
                        dt={{
                            balance: data?.availableBalance,
                            income: data?.totalIncome,
                            expense: data?.totalExpense,
                        }}
                    />
                )}
            </div>
            <div className="flex flex-col-reverse gap-0 md:flex-row md:gap-10 2xl:gap-20">
              <RecentTransactions data={data?.lastTransactions} />
              {data?.lastAccounts.length > 0 && <Accounts data={data?.lastAccounts} />}
            </div>
        </div>
    );
};

export default Dashboard;
