import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Filter, BarChart3, Mail, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../store';
import { budgetAPI } from '../libs/apiCalls';
import AlertCard from '../components/AlertCard';
import { StatsCardShimmer, AlertCardShimmer } from '../components/ui/shimmer';

const AlertsPage = () => {
  const { user } = useStore(state => state);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterRead, setFilterRead] = useState('all');

  useEffect(() => {
    if (user?.id) {
      fetchAlerts();
      fetchStats();
    }
  }, [user?.id]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await budgetAPI.getUserAlerts(user.id, 1, 50);
      setAlerts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to fetch alerts');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await budgetAPI.getAlertStats(user.id);
      setStats(response.data.data || null);
    } catch (error) {
      console.error('Error fetching alert stats:', error);
    }
  };

  const handleMarkAsRead = async (alertId) => {
    try {
      await budgetAPI.markAlertAsRead(user.id, alertId);
      toast.success('Alert marked as read');
      
      // Update the alert in the local state
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ));
      
      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error('Error marking alert as read:', error);
      toast.error('Failed to mark alert as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await budgetAPI.markAllAlertsAsRead(user.id);
      toast.success(`${response.data.data.markedCount} alerts marked as read`);
      
      // Update all alerts in local state
      setAlerts(prev => prev.map(alert => ({ ...alert, is_read: true })));
      
      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
      toast.error('Failed to mark all alerts as read');
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const typeMatch = filterType === 'all' || alert.alert_type === filterType;
    const readMatch = filterRead === 'all' || 
                     (filterRead === 'unread' && !alert.is_read) ||
                     (filterRead === 'read' && alert.is_read);
    
    return typeMatch && readMatch;
  });

  const unreadCount = alerts.filter(alert => !alert.is_read).length;

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Bell className="mr-3" size={28} />
              Alerts & Notifications
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Stay informed about your budget status and spending patterns
            </p>
          </div>
        </div>

        {/* Stats Cards Shimmer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatsCardShimmer key={index} />
          ))}
        </div>

        {/* Alert Cards Shimmer */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <AlertCardShimmer key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Bell className="mr-3" size={28} />
            Alerts & Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay informed about your budget status and spending patterns
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <CheckCheck size={20} className="mr-2" />
            Mark All Read ({unreadCount})
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Alerts</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.totalAlerts}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Unread Alerts</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.unreadAlerts}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Emails Sent</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.emailsSent}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.alertsThisWeek}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Type Breakdown */}
      {stats && stats.alertsByType && Object.keys(stats.alertsByType).length > 0 && (
        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Alert Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(stats.alertsByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                <span className="capitalize text-gray-700 dark:text-gray-300">{type}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center">
          <Filter className="mr-2 text-gray-400" size={20} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="warning">Warning</option>
            <option value="exceeded">Exceeded</option>
            <option value="info">Info</option>
          </select>
        </div>
        <div className="flex items-center">
          <select
            value={filterRead}
            onChange={(e) => setFilterRead(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All Alerts</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {alerts.length === 0 ? 'No alerts yet' : 'No alerts match your filters'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {alerts.length === 0 
              ? 'Budget alerts will appear here when your spending approaches or exceeds your budget limits'
              : 'Try adjusting your filter criteria to see more alerts'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onMarkAsRead={handleMarkAsRead}
            />
          ))}
        </div>
      )}

      {/* Email Service Notice */}
      <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start">
          <Mail className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Email Service Status
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Email notifications are currently unavailable. You'll receive alerts in the application, 
              but email delivery is temporarily disabled while the service is being configured.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsPage;
