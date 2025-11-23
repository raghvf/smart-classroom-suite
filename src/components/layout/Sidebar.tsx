import { NavLink } from "@/components/NavLink";
import { UserRole } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Calendar,
  ClipboardList,
  BookOpen,
  Bell,
  Settings,
  GraduationCap,
  BookOpenCheck,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role: UserRole;
  collapsed?: boolean;
}

const adminLinks = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/students", label: "Students", icon: Users },
  { to: "/admin/faculty", label: "Faculty", icon: UserCog },
  { to: "/admin/timetable", label: "Timetable", icon: Calendar },
  { to: "/admin/attendance", label: "Attendance", icon: ClipboardList },
  { to: "/admin/resources", label: "Resources", icon: BookOpen },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

const facultyLinks = [
  { to: "/faculty/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/faculty/classes", label: "My Classes", icon: GraduationCap },
  { to: "/faculty/attendance", label: "Attendance", icon: BookOpenCheck },
  { to: "/faculty/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/faculty/notifications", label: "Notifications", icon: Bell },
  { to: "/faculty/settings", label: "Settings", icon: Settings },
];

const studentLinks = [
  { to: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/attendance", label: "My Attendance", icon: BookOpenCheck },
  { to: "/student/timetable", label: "Timetable", icon: Calendar },
  { to: "/student/chatbot", label: "AI Assistant", icon: MessageSquare },
  { to: "/student/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/student/settings", label: "Settings", icon: Settings },
];

const linksByRole: Record<UserRole, typeof adminLinks> = {
  admin: adminLinks,
  faculty: facultyLinks,
  student: studentLinks,
};

export function Sidebar({ role, collapsed = false }: SidebarProps) {
  const links = linksByRole[role];

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-lg font-bold text-sidebar-foreground">SmartClass</h2>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{role}</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
          >
            <link.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{link.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
