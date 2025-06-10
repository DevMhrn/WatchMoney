import React from 'react';
import { AlertTriangle, CheckCircle, Mail, MailOpen, Clock } from 'lucide-react';

const AlertCard = ({ alert, onMarkAsRead }) => {
  const getAlertIcon = () => {
    switch (alert.alert_type) {
      case 'exceeded':
        return <AlertTriangle className="text-red-500" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'info':
        return <CheckCircle className="text-blue-500" size={20} />;
      default:
        return <AlertTriangle className="text-gray-500" size={20} />;
    }
  };

  const getAlertBorderColor = () => {
    switch (alert.alert_type) {
      case 'exceeded':
        return 'border-l-red-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'info':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const getAlertTypeLabel = () => {
    switch (alert.alert_type) {
      case 'exceeded':
        return 'Budget Exceeded';
      case 'warning':
        return 'Budget Warning';
      case 'info':
        return 'Information';
      default:
        return 'Alert';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 border-l-4 ${getAlertBorderColor()} ${!alert.is_read ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-1">
            {getAlertIcon()}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className={`text-sm font-semibold ${!alert.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                {getAlertTypeLabel()}
              </h4>
              {!alert.is_read && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  New
                </span>
              )}
            </div>
            <p className={`text-sm ${!alert.is_read ? 'text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400'}`}>
              {alert.message}
            </p>
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <Clock size={12} className="mr-1" />
                {formatDate(alert.created_at)}
              </div>
              <div className="flex items-center">
                {alert.email_sent ? (
                  <>
                    <MailOpen size={12} className="mr-1 text-green-500" />
                    Email Sent
                  </>
                ) : (
                  <>
                    <Mail size={12} className="mr-1 text-gray-400" />
                    No Email
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        {!alert.is_read && (
          <button
            onClick={() => onMarkAsRead(alert.id)}
            className="ml-2 px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Mark Read
          </button>
        )}
      </div>
    </div>
  );
};

export default AlertCard;
