import React, { useEffect, useState, useCallback, useRef } from 'react';
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
        currency: 'USD',
        chartData: [],
        lastTransactions: [],
        lastAccounts: [],
        user: null
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const intervalRef = useRef(null);
    const mountedRef = useRef(true);

    const fetchDashboardStats = useCallback(async (isInitialLoad = false) => {
        if (!mountedRef.current) return;
        
        try {
            if (isInitialLoad) {
                setIsLoading(true);
            } else {
                setIsRefreshing(true);
            }
            
            const { data: res } = await api.get('/transactions/dashboard');
            
            if (!mountedRef.current) return;
            
            if (res?.status) {
                setData({
                    availableBalance: parseFloat(res.dashboard?.availableBalance) || 0,
                    totalIncome: parseFloat(res.dashboard?.totalIncome) || 0,
                    totalExpense: parseFloat(res.dashboard?.totalExpense) || 0,
                    currency: res.dashboard?.currency || 'USD',
                    chartData: res.dashboard?.chartData || [],
                    lastTransactions: res.dashboard?.lastTransactions || [],
                    lastAccounts: res.dashboard?.lastAccounts || [],
                    user: res.dashboard?.user || null
                });
            }
        } catch (error) {
            if (!mountedRef.current) return;
            
            console.error('Dashboard fetch error:', error);
            
            // Only show error toast on initial load, not on background refresh
            if (isInitialLoad) {
                toast.error(
                    error?.response?.data?.message || 
                    "Failed to load dashboard data. Please try again."
                );
            }

            if (error?.response?.data?.status === "auth_failed") {
                localStorage.removeItem("user");
                window.location.reload();
            }
        } finally {
            if (mountedRef.current) {
                if (isInitialLoad) {
                    setIsLoading(false);
                } else {
                    setIsRefreshing(false);
                }
            }
        }
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        
        // Initial load
        fetchDashboardStats(true);
        
        // Set up interval for background refresh (5 minutes instead of 30 seconds)
        intervalRef.current = setInterval(() => {
            if (mountedRef.current && document.visibilityState === 'visible') {
                fetchDashboardStats(false);
            }
        }, 300000); // 5 minutes

        // Cleanup on unmount
        return () => {
            mountedRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [fetchDashboardStats]);

    // Handle page visibility changes
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && !isLoading && mountedRef.current) {
                // Refresh data when user comes back to the tab (but not too frequently)
                const lastRefresh = localStorage.getItem('lastDashboardRefresh');
                const now = Date.now();
                if (!lastRefresh || now - parseInt(lastRefresh) > 60000) { // 1 minute cooldown
                    localStorage.setItem('lastDashboardRefresh', now.toString());
                    fetchDashboardStats(false);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isLoading, fetchDashboardStats]);

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
            {/* Show refresh indicator */}
            {isRefreshing && (
                <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm animate-pulse">
                    Refreshing...
                </div>
            )}
            
            <Info 
                title="Dashboard" 
                subTitle={`Monitor your financial activities • Currency: ${data.currency}`}
            />
            <Stats 
                balance={data.availableBalance}
                income={data.totalIncome}
                expense={data.totalExpense}
                currency={data.currency}
            />
            <div className="flex flex-col-reverse items-center gap-10 w-full md:flex-row mb-20">
                <Chart data={data?.chartData} currency={data.currency} />
                {(data?.totalIncome > 0 || data?.totalExpense > 0) && (
                    <DoughnutChart
                        dt={{
                            balance: data?.availableBalance,
                            income: data?.totalIncome,
                            expense: data?.totalExpense,
                        }}
                        currency={data.currency}
                    />
                )}
            </div>
            <div className="flex flex-col-reverse gap-0 md:flex-row md:gap-10 2xl:gap-20">
              <RecentTransactions data={data?.lastTransactions} />
              {data?.lastAccounts?.length > 0 && <Accounts data={data?.lastAccounts} />}
            </div>
        </div>
    );
};

export default Dashboard;
