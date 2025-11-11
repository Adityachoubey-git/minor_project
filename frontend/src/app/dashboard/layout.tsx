import { UserProvider } from "@/context/UserContext"; // Import user context
import DashboardLayout from "./Dashboardlayout";


export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <UserProvider>
            <DashboardLayout>{children}</DashboardLayout>
        </UserProvider>
    );
}
