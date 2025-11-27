import { UserProvider } from "@/context/UserContext"; // Import user context
import DashboardLayout from "./Dashboardlayout";
import NextTopLoader from "nextjs-toploader";


export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <UserProvider>
            <DashboardLayout>
                   <NextTopLoader />
                   {children}</DashboardLayout>
        </UserProvider>
    );
}
