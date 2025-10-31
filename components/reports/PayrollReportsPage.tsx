'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { SectionBreadcrumb } from '@/components/SectionBreadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';
import { reportService } from '@/lib/services/ReportService';
import { employeeRepository } from '@/lib/repositories/EmployeeRepository';
import { toast } from 'sonner';
import { EmployeeSalariesReportComponent } from './EmployeeSalariesReportComponent';
import { EmployeesRegisterComponent } from './EmployeesRegisterComponent';
import { ResourceCommissionsComponent } from './ResourceCommissionsComponent';
import { PayslipComponent } from './PayslipComponent';
import { SalariesRegisterComponent } from './SalariesRegisterComponent';
import type {
    EmployeeSalariesReport,
    EmployeesRegisterReport,
    ResourceCommissionsReport,
    PayslipReport,
    SalariesRegisterReport,
} from '@/types/reports';

export function PayrollReportsPage() {
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);

    // Report data states
    const [salariesReport, setSalariesReport] = useState<EmployeeSalariesReport | null>(null);
    const [registerReport, setRegisterReport] = useState<EmployeesRegisterReport | null>(null);
    const [commissionsReport, setCommissionsReport] = useState<ResourceCommissionsReport | null>(null);
    const [payslipReport, setPayslipReport] = useState<PayslipReport | null>(null);
    const [salariesRegisterReport, setSalariesRegisterReport] = useState<SalariesRegisterReport | null>(null);

    // Salaries Register filters
    const [salRegFromDate, setSalRegFromDate] = useState<string>(
        new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
    );
    const [salRegToDate, setSalRegToDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Employee Salaries filters
    const [empSalMode, setEmpSalMode] = useState<'payslip' | 'records'>('payslip');
    const [empSalEmployee, setEmpSalEmployee] = useState<string>('');
    const [empSalFromDate, setEmpSalFromDate] = useState<string>(
        new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
    );
    const [empSalToDate, setEmpSalToDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [empSalType, setEmpSalType] = useState<'earnings' | 'deductions'>('earnings');

    // Employee Register filters
    const [empRegType, setEmpRegType] = useState<'personal' | 'official' | 'auxiliary' | 'sales-support' | 'staff-loan'>('official');

    // Commissions filters
    const [commFromDate, setCommFromDate] = useState<string>(
        new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
    );
    const [commToDate, setCommToDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [commEmployee, setCommEmployee] = useState<string>('ALL');
    const [commType, setCommType] = useState<'sales' | 'support' | 'comprehensive'>('comprehensive');

    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        try {
            const allEmployees = await employeeRepository.findActive();
            setEmployees(allEmployees);
        } catch (error) {
            console.error('Error loading employees:', error);
            toast.error('Failed to load employees');
        }
    };

    const clearReports = () => {
        setSalariesReport(null);
        setRegisterReport(null);
        setCommissionsReport(null);
        setPayslipReport(null);
        setSalariesRegisterReport(null);
    };

    const handleRunSalariesRegister = async () => {
        setLoading(true);
        clearReports();
        try {
            const start = new Date(salRegFromDate);
            const end = new Date(salRegToDate);
            const report = await reportService.generateSalariesRegisterReport(start, end);
            setSalariesRegisterReport(report);
            toast.success('Salaries Register generated successfully');
        } catch (error) {
            console.error('Error generating report:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const handleRunEmployeeSalaries = async () => {
        setLoading(true);
        clearReports();
        try {
            if (empSalMode === 'payslip') {
                // Generate payslip for selected employee
                if (!empSalEmployee) {
                    toast.error('Please select an employee');
                    return;
                }
                const fromDate = new Date(empSalFromDate);
                const year = fromDate.getFullYear();
                const month = fromDate.getMonth() + 1; // 1-based month
                const report = await reportService.generatePayslipReport(empSalEmployee, year, month);
                setPayslipReport(report);
                toast.success('Payslip generated successfully');
            } else {
                // Generate employee salaries report (records)
                const start = new Date(empSalFromDate);
                const end = new Date(empSalToDate);
                const report = await reportService.generateEmployeeSalariesReport(start, end);
                setSalariesReport(report);
                toast.success('Employee Salaries Report generated successfully');
            }
        } catch (error) {
            console.error('Error generating report:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const handleRunEmployeeRegister = async () => {
        setLoading(true);
        clearReports();
        try {
            // For now, we only support "official" register
            const report = await reportService.generateEmployeesRegisterReport();
            setRegisterReport(report);
            toast.success('Employee Register generated successfully');
        } catch (error) {
            console.error('Error generating report:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const handleRunCommissions = async () => {
        setLoading(true);
        clearReports();
        try {
            const start = new Date(commFromDate);
            const end = new Date(commToDate);
            const report = await reportService.generateResourceCommissionsReport(start, end);
            setCommissionsReport(report);
            toast.success('Commissions Report generated successfully');
        } catch (error) {
            console.error('Error generating report:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = (format: 'PDF' | 'EXCEL') => {
        toast.info(`Exporting to ${format}... (Feature coming soon)`);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 p-6">
                <SectionBreadcrumb
                    items={[
                        { label: 'Reports', path: '/reports' },
                        { label: 'Payroll Reports', path: '/reports/payroll' },
                    ]}
                />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payroll Reports</h1>
                    <p className="text-muted-foreground mt-2">
                        Generate comprehensive payroll and employee reports
                    </p>
                </div>

                <Tabs defaultValue="home" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="home">Home</TabsTrigger>
                        <TabsTrigger value="salaries-register">Salaries Register</TabsTrigger>
                        <TabsTrigger value="employee-salaries">Employee Salaries</TabsTrigger>
                        <TabsTrigger value="employee-register">Employee Register</TabsTrigger>
                        <TabsTrigger value="commissions">Commissions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="home" className="space-y-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-8">
                                    <h2 className="text-2xl font-bold mb-4">Payroll Reports</h2>
                                    <p className="text-muted-foreground mb-6">
                                        Click on any of the above controls to run various forms of reports on payroll and employees.
                                    </p>
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-center space-y-4">
                                            <Users className="h-24 w-24 mx-auto text-primary" />
                                            <h3 className="text-xl font-semibold">Employee & Salary Reports</h3>
                                            <p className="text-sm text-muted-foreground max-w-md">
                                                Generate salary registers, employee data reports, payslips, and commission statements
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="salaries-register" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Salary Register</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>From</Label>
                                        <Input
                                            type="date"
                                            value={salRegFromDate}
                                            onChange={(e) => setSalRegFromDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>To</Label>
                                        <Input
                                            type="date"
                                            value={salRegToDate}
                                            onChange={(e) => setSalRegToDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Button className="w-full" onClick={handleRunSalariesRegister} disabled={loading}>
                                    {loading ? 'Generating...' : 'Run'}
                                </Button>
                            </CardContent>
                        </Card>

                        {salariesRegisterReport && (
                            <SalariesRegisterComponent
                                data={salariesRegisterReport}
                                onExport={handleExport}
                                onPrint={handlePrint}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="employee-salaries" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Employee Salaries</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <Label className="text-base font-semibold">Select mode</Label>
                                    <RadioGroup value={empSalMode} onValueChange={(value: any) => setEmpSalMode(value)}>
                                        <div className="flex gap-6">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="payslip" id="payslip" />
                                                <Label htmlFor="payslip">Payslip</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="records" id="records" />
                                                <Label htmlFor="records">Records</Label>
                                            </div>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {empSalMode === 'payslip' && (
                                    <div className="space-y-2">
                                        <Label>Employee</Label>
                                        <Select value={empSalEmployee} onValueChange={setEmpSalEmployee}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select employee" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {employees.map((emp) => (
                                                    <SelectItem key={emp.id} value={emp.id}>
                                                        {emp.employeeId} - {emp.firstName} {emp.surname}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>From</Label>
                                        <Input
                                            type="date"
                                            value={empSalFromDate}
                                            onChange={(e) => setEmpSalFromDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>To</Label>
                                        <Input
                                            type="date"
                                            value={empSalToDate}
                                            onChange={(e) => setEmpSalToDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {empSalMode === 'records' && (
                                    <div className="space-y-3">
                                        <RadioGroup value={empSalType} onValueChange={(value: any) => setEmpSalType(value)}>
                                            <div className="flex gap-6">
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="earnings" id="earnings" />
                                                    <Label htmlFor="earnings">Earnings</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="deductions" id="deductions" />
                                                    <Label htmlFor="deductions">Deductions</Label>
                                                </div>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                )}

                                <Button className="w-full" onClick={handleRunEmployeeSalaries} disabled={loading}>
                                    {loading ? 'Generating...' : 'Run'}
                                </Button>
                            </CardContent>
                        </Card>

                        {payslipReport && (
                            <PayslipComponent
                                data={payslipReport}
                                onExport={handleExport}
                                onPrint={handlePrint}
                            />
                        )}

                        {salariesReport && (
                            <EmployeeSalariesReportComponent
                                data={salariesReport}
                                onExport={handleExport}
                                onPrint={handlePrint}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="employee-register" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Employee Register</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <RadioGroup value={empRegType} onValueChange={(value: any) => setEmpRegType(value)}>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="personal" id="personal" />
                                            <Label htmlFor="personal">Personal</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="official" id="official" />
                                            <Label htmlFor="official">Official</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="auxiliary" id="auxiliary" />
                                            <Label htmlFor="auxiliary">Auxiliary</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="sales-support" id="sales-support" />
                                            <Label htmlFor="sales-support">Sales Support</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="staff-loan" id="staff-loan-register" />
                                            <Label htmlFor="staff-loan-register">Staff Loan</Label>
                                        </div>
                                    </div>
                                </RadioGroup>

                                <Button className="w-full" onClick={handleRunEmployeeRegister} disabled={loading}>
                                    {loading ? 'Generating...' : 'Run'}
                                </Button>
                            </CardContent>
                        </Card>

                        {registerReport && (
                            <EmployeesRegisterComponent
                                data={registerReport}
                                onExport={handleExport}
                                onPrint={handlePrint}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="commissions" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Commissions Reports</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>From</Label>
                                        <Input
                                            type="date"
                                            value={commFromDate}
                                            onChange={(e) => setCommFromDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>To</Label>
                                        <Input
                                            type="date"
                                            value={commToDate}
                                            onChange={(e) => setCommToDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Employee</Label>
                                    <Select value={commEmployee} onValueChange={setCommEmployee}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">ALL</SelectItem>
                                            {employees.map((emp) => (
                                                <SelectItem key={emp.id} value={emp.id}>
                                                    {emp.employeeId} - {emp.firstName} {emp.surname}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <RadioGroup value={commType} onValueChange={(value: any) => setCommType(value)}>
                                        <div className="flex gap-6">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="sales" id="sales-resource" />
                                                <Label htmlFor="sales-resource">Sales resource</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="support" id="support-resource" />
                                                <Label htmlFor="support-resource">Support resource</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="comprehensive" id="comprehensive" />
                                                <Label htmlFor="comprehensive">Comprehensive</Label>
                                            </div>
                                        </div>
                                    </RadioGroup>
                                </div>

                                <Button className="w-full" onClick={handleRunCommissions} disabled={loading}>
                                    {loading ? 'Generating...' : 'Run'}
                                </Button>
                            </CardContent>
                        </Card>

                        {commissionsReport && (
                            <ResourceCommissionsComponent
                                data={commissionsReport}
                                onExport={handleExport}
                                onPrint={handlePrint}
                            />
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
