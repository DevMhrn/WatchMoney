import React from 'react';
import { useStore } from '../store';
import Title from '../components/Title';
import { SettingsForm } from '../components/settingsForm';
import ChangePassword from '../components/changePassword';

const SettingsPage = () => {
    const { user } = useStore((state) => state);

    return (
        <div className="flex flex-col items-center w-full">
            <div className="w-full max-w-4xl px-4 py-4 my-6 shadow-lg bg-gray-50 dark:bg-black/20 md:px-10 md:my-10 rounded-lg">
                <div className="mt-6 border-b-2 border-gray-200 dark:border-gray-800">
                    <Title title="General Settings" />
                </div>
                
                <div className="py-10">
                    <p className="text-lg font-bold text-black dark:text-white mb-6">
                        Profile Information
                    </p>
                    <div className="flex items-center gap-4 my-8">
                        <div className="flex items-center justify-center w-12 h-12 font-bold text-2xl text-white bg-blue-600 rounded-full">
                            <p>{user?.firstname?.charAt(0)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-2xl font-semibold text-black dark:text-gray-400">
                                {user?.firstname}
                            </p>
                            <span className="text-sm text-gray-600 dark:text-gray-500">
                                {user?.email}
                            </span>
                        </div>
                    </div>
                    
                    <SettingsForm />
                    {!user?.provided && <ChangePassword/>}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
