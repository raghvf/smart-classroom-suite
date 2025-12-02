import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { getStoredUser } from "@/lib/auth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Search, Mail, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Faculty() {
  const user = getStoredUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  if (!user || user.role !== "admin") {
    return <Navigate to="/auth/login" replace />;
  }

  // Mock faculty data
  const facultyMembers = [
    { id: 1, name: "Dr. Sarah Johnson", email: "sarah.j@university.edu", phone: "+1234567890", department: "Computer Science", status: "active" },
    { id: 2, name: "Prof. Michael Chen", email: "m.chen@university.edu", phone: "+1234567891", department: "Mathematics", status: "active" },
    { id: 3, name: "Dr. Emily Brown", email: "e.brown@university.edu", phone: "+1234567892", department: "Physics", status: "active" },
  ];

  const filteredFaculty = facultyMembers.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Faculty Management</h1>
            <p className="text-muted-foreground">Manage faculty members and their details</p>
          </div>
          <Button className="gap-2">
            <UserPlus className="w-4 h-4" />
            Add Faculty
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Faculty Members</CardTitle>
                <CardDescription>View and manage all faculty</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search faculty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaculty.map((faculty) => (
                  <TableRow key={faculty.id}>
                    <TableCell className="font-medium">{faculty.name}</TableCell>
                    <TableCell>{faculty.department}</TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          {faculty.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {faculty.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={faculty.status === "active" ? "default" : "secondary"}>
                        {faculty.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}