'use client'
import { useRouter } from 'next/navigation';

export default function Home() {
    const router = useRouter();

    const goToUsers = () => {
        router.push('/users');
    }

    return (
        <div>
            <h1>WELCOME</h1>
            <button
                onClick={goToUsers}
                className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
            >
                Users
            </button>
        </div>
    );
}