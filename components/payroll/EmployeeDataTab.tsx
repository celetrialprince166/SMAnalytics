'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiEmployeeService } from '@/lib/services/ApiEmployeeService';
import { Employee } from '@/types';
import { toast } from 'sonner';

const EMPLOYEE_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'ON_LEAVE', label: 'On Leave' },
  { value: 'TERMINATED', label: 'Terminated' },
];

const NATIONALITIES = [
  { value: 'GHANAIAN', label: 'Ghanaian' },
  { value: 'OTHER', label: 'Other' },
];

export function EmployeeDataTab() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [surname, setSurname] = useState('');
  const [firstName, setFirstName] = useState('');
  const [otherNames, setOtherNames] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [nationality, setNationality] = useState('GHANAIAN');
  const [gender, setGender] = useState('MALE');
  const [maritalStatus, setMaritalStatus] = useState('SINGLE');
  const [numberOfChildren, setNumberOfChildren] = useState('0');
  const [residentialAddress, setResidentialAddress] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [ssnitNumber, setSsnitNumber] = useState('');

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0 && currentIndex >= 0 && currentIndex < employees.length) {
      loadEmployeeData(employees[currentIndex]);
    }
  }, [currentIndex, employees]);

  const loadEmployees = async () => {
    try {
      const employeeList = await apiEmployeeService.getEmployees();
      setEmployees(employeeList);
      if (employeeList.length > 0) {
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  const loadEmployeeData = (employee: Employee) => {
    setEntryDate(new Date(employee.entryDate).toISOString().split('T')[0]);
    setEmployeeId(employee.employeeId);
    setStatus(employee.status);
    setSurname(employee.surname);
    setFirstName(employee.firstName);
    setOtherNames(employee.otherNames || '');
    setDateOfBirth(new Date(employee.dateOfBirth).toISOString().split('T')[0]);
    setPlaceOfBirth(employee.placeOfBirth || '');
    setNationality(employee.nationality);
    setGender(employee.gender);
    setMaritalStatus(employee.maritalStatus);
    setNumberOfChildren(employee.numberOfChildren.toString());
    setResidentialAddress(employee.residentialAddress || '');
    setEmailAddress(employee.emailAddress);
    setPhoneNumber(employee.phoneNumber);
    setPosition(employee.position || '');
    setDepartment(employee.department || '');
    setBasicSalary(employee.basicSalary.toString());
    setTaxNumber(employee.taxNumber || '');
    setSsnitNumber(employee.ssnitNumber || '');
  };

  const handleNew = () => {
    setEntryDate(new Date().toISOString().split('T')[0]);
    setEmployeeId('');
    setStatus('ACTIVE');
    setSurname('');
    setFirstName('');
    setOtherNames('');
    setDateOfBirth('');
    setPlaceOfBirth('');
    setNationality('GHANAIAN');
    setGender('MALE');
    setMaritalStatus('SINGLE');
    setNumberOfChildren('0');
    setResidentialAddress('');
    setEmailAddress('');
    setPhoneNumber('');
    setPosition('');
    setDepartment('');
    setBasicSalary('');
    setTaxNumber('');
    setSsnitNumber('');
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await apiEmployeeService.createEmployee({
        entryDate: new Date(entryDate),
        status: status as any,
        surname,
        firstName,
        otherNames,
        dateOfBirth: new Date(dateOfBirth),
        placeOfBirth,
        nationality: nationality as any,
        gender: gender as any,
        maritalStatus: maritalStatus as any,
        numberOfChildren: parseInt(numberOfChildren) || 0,
        residentialAddress,
        emailAddress,
        phoneNumber,
        position,
        department,
        basicSalary: parseFloat(basicSalary),
        taxNumber,
        ssnitNumber,
      });
      toast.success('Employee created successfully');
      loadEmployees();
      handleNew();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create employee');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!employees[currentIndex]) return;
    
    setIsLoading(true);
    try {
      await apiEmployeeService.updateEmployee(employees[currentIndex].id, {
        entryDate: new Date(entryDate),
        status: status as any,
        surname,
        firstName,
        otherNames,
        dateOfBirth: new Date(dateOfBirth),
        placeOfBirth,
        nationality: nationality as any,
        gender: gender as any,
        maritalStatus: maritalStatus as any,
        numberOfChildren: parseInt(numberOfChildren) || 0,
        residentialAddress,
        emailAddress,
        phoneNumber,
        position,
        department,
        basicSalary: parseFloat(basicSalary),
        taxNumber,
        ssnitNumber,
      });
      toast.success('Employee updated successfully');
      loadEmployees();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update employee');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!employees[currentIndex]) return;
    
    if (!confirm('Are you sure you want to delete this employee?')) return;
    
    setIsLoading(true);
    try {
      await apiEmployeeService.deleteEmployee(employees[currentIndex].id);
      toast.success('Employee deleted successfully');
      loadEmployees();
      handleNew();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete employee');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFirst = () => setCurrentIndex(0);
  const handlePrevious = () => setCurrentIndex(Math.max(0, currentIndex - 1));
  const handleNext = () => setCurrentIndex(Math.min(employees.length - 1, currentIndex + 1));
  const handleLast = () => setCurrentIndex(employees.length - 1);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Employee Information</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleFirst} disabled={currentIndex === 0}>
              <ChevronFirst className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handlePrevious} disabled={currentIndex === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Input 
              className="w-16 text-center" 
              value={currentIndex + 1}
              readOnly
            />
            <span className="text-sm text-muted-foreground">of {employees.length || 0}</span>
            <Button variant="outline" size="icon" onClick={handleNext} disabled={currentIndex >= employees.length - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleLast} disabled={currentIndex >= employees.length - 1}>
              <ChevronLast className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="entryDate">Entry date</Label>
            <Input 
              id="entryDate" 
              type="date" 
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employeeIdDisplay">Employee ID</Label>
            <Input 
              id="employeeIdDisplay" 
              value={employeeId || 'Auto-generated'}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employeeStatus">Employee status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="employeeStatus">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYEE_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Personal</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="surname">Surname</Label>
                    <Input 
                      id="surname" 
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input 
                      id="firstName" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="otherNames">Other names</Label>
                    <Input 
                      id="otherNames" 
                      value={otherNames}
                      onChange={(e) => setOtherNames(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of birth</Label>
                    <Input 
                      id="dateOfBirth" 
                      type="date" 
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="placeOfBirth">Place of birth</Label>
                    <Input 
                      id="placeOfBirth" 
                      value={placeOfBirth}
                      onChange={(e) => setPlaceOfBirth(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Select value={nationality} onValueChange={setNationality}>
                      <SelectTrigger id="nationality">
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent>
                        {NATIONALITIES.map((n) => (
                          <SelectItem key={n.value} value={n.value}>
                            {n.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <RadioGroup value={gender} onValueChange={setGender} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="MALE" id="male" />
                        <Label htmlFor="male">Male</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="FEMALE" id="female" />
                        <Label htmlFor="female">Female</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Marital status</Label>
                    <RadioGroup value={maritalStatus} onValueChange={setMaritalStatus} className="flex gap-4 flex-wrap">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="SINGLE" id="single" />
                        <Label htmlFor="single">Single</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="MARRIED" id="married" />
                        <Label htmlFor="married">Married</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="DIVORCED" id="divorced" />
                        <Label htmlFor="divorced">Divorced</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="WIDOWED" id="widowed" />
                        <Label htmlFor="widowed">Widowed</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numberOfChildren">Number of children</Label>
                    <Input 
                      id="numberOfChildren" 
                      type="number" 
                      value={numberOfChildren}
                      onChange={(e) => setNumberOfChildren(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="residentialAddress">Residential address</Label>
                    <Input 
                      id="residentialAddress" 
                      value={residentialAddress}
                      onChange={(e) => setResidentialAddress(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailAddress">Email address</Label>
                    <Input 
                      id="emailAddress" 
                      type="email" 
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone number</Label>
                    <Input 
                      id="phoneNumber" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Employment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input 
                    id="position" 
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input 
                    id="department" 
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="basicSalary">Basic Salary</Label>
                  <Input 
                    id="basicSalary" 
                    type="number"
                    step="0.01"
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Tax & Pension</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxNumber">Tax Number</Label>
                  <Input 
                    id="taxNumber" 
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ssnitNumber">SSNIT Number</Label>
                  <Input 
                    id="ssnitNumber" 
                    value={ssnitNumber}
                    onChange={(e) => setSsnitNumber(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Button onClick={handleNew} disabled={isLoading}>New</Button>
          <Button variant="outline" onClick={handleSave} disabled={isLoading}>Save</Button>
          <Button variant="outline" onClick={handleUpdate} disabled={isLoading || !employees[currentIndex]}>Update</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading || !employees[currentIndex]}>Delete</Button>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="secondary" className="flex-1">Employee Sales</Button>
          <Button variant="secondary" className="flex-1">Employee Loan</Button>
        </div>
      </CardContent>
    </Card>
  );
}
