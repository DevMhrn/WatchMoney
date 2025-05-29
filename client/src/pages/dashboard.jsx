import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '../libs/apiCalls';
import Loading from '../components/loading';
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
            <div className="flex items-center justify-center w-full h-[80vh]">
                <Loading />
            </div>
        );
    }

    return (
        <div className="px-0 md:px-5 2xl:px-20">
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
