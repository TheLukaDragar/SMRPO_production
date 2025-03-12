import {getUsers, handleAddUser} from "@/lib/actions/user-actions";
import { User } from "@/lib/types/user-types";
import UserCard from "@/components/UserCard";

export default async function Home() {
    const users: User[] = await getUsers();

    return (
        <div>
            <div>
                <h1>Users</h1>
                    {users.map((user: User) => (
                        <UserCard key={user._id} user={user} />
                    ))}
            </div>
            <div>
                <h1>add User</h1>
                <form action={handleAddUser}>
                    <input name="userName" placeholder="Username" required />
                    <input name="password" placeholder="Password" type="password" required />
                    <input name="firstName" placeholder="First Name" required />
                    <input name="lastName" placeholder="Last Name" required />
                    <input name="email" placeholder="Email" type="email" required />
                    <select id="role" name="role">
                        <option value="Administrators">Administrator</option>
                        <option value="Developer">Developer</option>
                    </select>
                    <button type="submit">Submit</button>
                </form>
            </div>
        </div>
    );
}
