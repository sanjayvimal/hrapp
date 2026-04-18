# HR Management System

A full-stack HR Management application built with React, Django, and PostgreSQL.

## Features

- **Employee Management** - Add, edit, view employee profiles with all details
- **Department & Designation** - Organize company structure
- **Attendance Tracking** - Mark and monitor daily attendance
- **Leave Management** - Apply, approve/reject leave requests
- **Salary & Payroll** - Define salary structures and generate payslips
- **Dashboard** - Real-time overview of HR metrics

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Material UI v5, React Router v6 |
| Backend | Django 4.2, Django REST Framework |
| Database | PostgreSQL 15 |
| Auth | JWT (djangorestframework-simplejwt) |

## Quick Start (Docker)

```bash
# Clone and start
docker-compose up --build

# Create a superuser (in another terminal)
docker-compose exec backend python manage.py createsuperuser
```

Then open:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/

## Manual Setup

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Run migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Start backend
python manage.py runserver
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start frontend
npm start
```

## Environment Variables (backend/.env)

```
SECRET_KEY=your-secret-key-here
DEBUG=True
DB_NAME=hrapp
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432
```

## API Endpoints

| Resource | Endpoint |
|----------|---------|
| Auth Login | POST `/api/auth/login/` |
| Employees | `/api/employees/` |
| Departments | `/api/departments/` |
| Designations | `/api/designations/` |
| Attendance | `/api/attendance/` |
| Leave Types | `/api/leave-types/` |
| Leave Applications | `/api/leave-applications/` |
| Salary Structures | `/api/salary-structures/` |
| Payslips | `/api/payslips/` |

## Initial Setup After Login

1. Create **Departments** (e.g., Engineering, HR, Finance)
2. Add **Designations** under each department
3. Add **Employees** with their details
4. Set up **Leave Types** (Annual Leave, Sick Leave, etc.)
5. Define **Salary Structures** for each employee
6. Start tracking **Attendance** daily
7. Manage **Leave Applications**
8. **Generate Payslips** monthly

## Database Schema

- `Employee` - Core employee record with personal, job, bank details
- `Department` - Organizational departments
- `Designation` - Job titles within departments
- `Attendance` - Daily attendance records (check-in/out, status)
- `LeaveType` - Types of leave (annual, sick, maternity, etc.)
- `LeaveBalance` - Employee leave balance per year
- `LeaveApplication` - Leave requests with approval workflow
- `SalaryStructure` - Component-wise salary breakdown per employee
- `PaySlip` - Generated monthly payslips with pro-rated calculations
