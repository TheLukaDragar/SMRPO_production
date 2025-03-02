'use client';

import React from 'react';

interface UserCardProps {
    user: {
        userName: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
        createdAt?: Date;
    };
    onEdit?: (userId: number) => void;
    onDelete?: (userId: number) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onEdit, onDelete }) => {
    const {userName, firstName, lastName, email, role, createdAt } = user;

    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

    const formattedDate = createdAt
        ? new Date(createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
        : '';

    const getRoleBadgeColor = (role: string) => {
        switch(role.toLowerCase()) {
            case 'Administrator':
                return 'bg-red-100 text-red-800';
            case 'Developer':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="w-full max-w-md bg-white rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="p-5">
                <div className="flex items-center gap-4 mb-4">
                    <div className="relative h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium overflow-hidden">
                        {initials}
                    </div>
                    <div>
                        <h5 className="text-xl font-bold text-gray-900">{firstName} {lastName}</h5>
                        <p className="text-sm text-gray-500">@{userName}</p>
                    </div>
                </div>

                <div className="space-y-3 mb-4">
                    <div className="flex items-center">
                        <span className="text-gray-500 w-24">Email:</span>
                        <span className="text-gray-700">{email}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="text-gray-500 w-24">User ID:</span>
                        <span className="text-gray-700">{123}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="text-gray-500 w-24">Role:</span>
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(role)}`}>
              {role}
            </span>
                    </div>
                    {createdAt && (
                        <div className="flex items-center">
                            <span className="text-gray-500 w-24">Created:</span>
                            <span className="text-gray-700">{formattedDate}</span>
                        </div>
                    )}
                </div>

                {(onEdit || onDelete) && (
                    <div className="flex gap-2 mt-6">
                        {onEdit && (
                            <button
                                onClick={() => onEdit(123)}
                                className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                            >
                                Edit
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={() => onDelete(123)}
                                className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserCard;