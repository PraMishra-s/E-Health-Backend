# API Documentation

## 1. Introduction
This document provides comprehensive documentation for the E-HealthCST Backend API, developed as a final year project. The API supports user authentication, patient treatment management, inventory tracking, mental health case handling, health administrator operations, feed management, user management, analytics dashboards, illness management, notifications, and staff family management. Built using Express.js, TypeScript, and Drizzle ORM, it uses JWT-based authentication via cookies.

### Purpose
To guide future developers in understanding and interacting with the API’s 83 endpoints across 14 modules for maintenance or extension.

### How to Use
- **Base URL**: `/api/v1` (e.g., `/api/v1/auth/login`). Update to deployment URL (e.g., `https://healthcare-app.com/api/v1`).
- **Authentication**: `authenticateJWT` routes require an `accessToken` cookie from `/api/v1/auth/login` or `/api/v1/auth/refresh`. Some restrict to user types (e.g., HA, DEAN).
- **Request Format**: JSON for POST/PUT (`Content-Type: application/json`).
- **Responses**: JSON with `message` and data or error details.
- **Errors**: `BadRequestException` (400), `UnauthorizedException` (401), `NotFoundException` (404).
- **Rate Limiting**: Only `PUT /api/v1/users/change-password` has rate limiting (3 requests/5 min); others have none.

## 2. Authentication Setup
- **Mechanism**: `authenticateJWT` requires an `accessToken` cookie with a JWT (`{ userId: string, sessionId: string, userType: string }`). Some routes restrict to HA, DEAN, STAFF, etc.
- **Obtaining Token**:
  - `/api/v1/auth/login`: Sets `accessToken` and `refreshToken` cookies.
  - `/api/v1/auth/refresh`: Refreshes `accessToken` using `refreshToken`.
- **Cookie Details**:
  - `accessToken`: JWT, expires per `JWT.EXPIRES_IN`, `HttpOnly`, `Path=/`.
  - `refreshToken`: Expires per `JWT.REFRESH_EXPIRES_IN`, `HttpOnly`, `Path=/api/v1/auth/refresh`.
- **Example**:
  - Post-login cookies:
    ```
    Set-Cookie: accessToken=<jwt-token>; HttpOnly; Path=/; Expires=<date>
    Set-Cookie: refreshToken=<refresh-token>; HttpOnly; Path=/api/v1/auth/refresh; Expires=<date>
    ```
  - Request:
    ```bash
    curl -X POST /api/v1/notification/create -b "accessToken=<jwt-token>"
    ```
- **User Types**: STUDENT, STAFF, DEAN, NON-STAFF, HA, PREVIOUS_HA.

## 3. Common Headers
- `Content-Type: application/json` for POST/PUT.

## 4. API Routes

### 4.1 Auth Routes
| Method | Path | Description | Authentication | Rate Limiting |
|--------|------|-------------|----------------|---------------|
| POST   | /api/v1/auth/register | Registers a new user | None | None |
| POST   | /api/v1/auth/login | Authenticates a user | None | None |
| POST   | /api/v1/auth/refresh | Refreshes JWT token | None | None |
| POST   | /api/v1/auth/logout | Logs out a user | authenticateJWT | None |

#### POST /api/v1/auth/register
- **Description**: Creates a user and login entry. Publicly accessible, but email must end in `.cst@rub.edu.bt`.
- **Authentication**: None.
- **Rate Limiting**: None.
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "02210217.cst@rub.edu.bt",
    "password": "Password123!",
    "userType": "STUDENT",
    "student_id": "02210217",
    "gender": "MALE",
    "department_id": "dep-1",
    "std_year": "3",
    "blood_type": "A+",
    "date_of_birth": "2000-01-01",
    "contact_number": "1234567890",
    "role": "STUDENT"
  }
  ```
- **Response**:
  - **201 Created**:
    ```json
    {
      "message": "User registered successfully",
      "user": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "John Doe",
        "email": "02210217.cst@rub.edu.bt",
        "userType": "STUDENT"
      }
    }
    ```
  - **400 Bad Request**: `{ "message": "Invalid email or password" }`
- **Example `curl`**:
  ```bash
  curl -X POST /api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d '{"name":"John Doe","email":"02210217.cst@rub.edu.bt","password":"Password123!","userType":"STUDENT","student_id":"02210217","role":"STUDENT"}'
  ```

#### POST /api/v1/auth/login
- **Description**: Authenticates a user and sets JWT cookies.
- **Authentication**: None.
- **Rate Limiting**: None.
- **Request Body**:
  ```json
  {
    "email": "02210217.cst@rub.edu.bt",
    "password": "Password123!"
  }
  ```
- **Response**:
  - **200 OK**:
    ```json
    {
      "message": "Login successful",
      "user": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "John Doe",
        "email": "02210217.cst@rub.edu.bt",
        "userType": "STUDENT"
      }
    }
    ```
    - Cookies: `accessToken`, `refreshToken`.
  - **401 Unauthorized**: `{ "message": "Invalid credentials" }`
- **Example `curl`**:
  ```bash
  curl -X POST /api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"02210217.cst@rub.edu.bt","password":"Password123!"}'
  ```

#### POST /api/v1/auth/refresh
- **Description**: Refreshes the access token using the refresh token.
- **Authentication**: None (requires `refreshToken` cookie).
- **Rate Limiting**: None.
- **Request Body**: None.
- **Response**:
  - **200 OK**:
    ```json
    {
      "message": "Token refreshed successfully"
    }
    ```
    - Cookie: New `accessToken`.
  - **401 Unauthorized**: `{ "message": "Invalid refresh token" }`
- **Example `curl`**:
  ```bash
  curl -X POST /api/v1/auth/refresh \
    -b "refreshToken=<refresh-token>"
  ```

#### POST /api/v1/auth/logout
- **Description**: Logs out a user by invalidating the session.
- **Authentication**: `authenticateJWT` (any logged-in user).
- **Rate Limiting**: None.
- **Request Body**: None.
- **Response**:
  - **200 OK**:
    ```json
    {
      "message": "Logged out successfully"
    }
    ```
  - **401 Unauthorized**: `{ "message": "Unauthorized access" }`
- **Example `curl`**:
  ```bash
  curl -X POST /api/v1/auth/logout \
    -b "accessToken=<jwt-token>"
  ```

### 4.2 Feed Routes
| Method | Path | Description | Authentication | Rate Limiting |
|--------|------|-------------|----------------|---------------|
| POST   | /api/v1/feed/create | Creates a feed post | authenticateJWT, HA only | None |
| PUT    | /api/v1/feed/update/:id | Updates a feed post | authenticateJWT, HA only | None |
| DELETE | /api/v1/feed/delete/:id | Deletes a feed post | authenticateJWT, HA only | None |
| DELETE | /api/v1/feed/deleteAll/all | Deletes all feed posts | authenticateJWT, HA only | None |
| GET    | /api/v1/feed | Retrieves all feed posts | None | None |

#### POST /api/v1/feed/create
- **Description**: Creates a feed post by an HA.
- **Authentication**: `authenticateJWT, HA only`.
- **Rate Limiting**: None.
- **Request Body**:
  ```json
  {
    "title": "Health Update",
    "description": "New health guidelines for students",
    "image_urls": ["https://example.com/image1.jpg"],
    "video_url": ["https://example.com/video1.mp4"]
  }
  ```
- **Response**:
  - **201 Created**:
    ```json
    {
      "message": "Feed created successfully",
      "feed": {
        "id": "123e4567-e89b-12d3-a456-426614174005",
        "user_id": "123e4567-e89b-12d3-a456-426614174000",
        "title": "Health Update",
        "description": "New health guidelines for students",
        "image_urls": ["https://example.com/image1.jpg"],
        "video_url": ["https://example.com/video1.mp4"],
        "created_at": "2025-05-01T00:00:00.000Z",
        "updated_at": "2025-05-01T00:00:00.000Z"
      }
    }
    ```
  - **401 Unauthorized**: `{ "message": "Only HA can create feeds" }`
- **Example `curl`**:
  ```bash
  curl -X POST /api/v1/feed/create \
    -H "Content-Type: application/json" \
    -b "accessToken=<jwt-token>" \
    -d '{"title":"Health Update","description":"New health guidelines for students","image_urls":["https://example.com/image1.jpg"],"video_url":["https://example.com/video1.mp4"]}'
  ```

#### DELETE /api/v1/feed/deleteAll/all
- **Description**: Deletes all feed posts. No confirmation required.
- **Authentication**: `authenticateJWT, HA only`.
- **Rate Limiting**: None.
- **Request Body**: None.
- **Response**:
  - **200 OK**:
    ```json
    {
      "message": "All feeds deleted successfully"
    }
    ```
  - **401 Unauthorized**: `{ "message": "Only HA can delete feeds" }`
- **Example `curl`**:
  ```bash
  curl -X DELETE /api/v1/feed/deleteAll/all \
    -b "accessToken=<jwt-token>"
  ```

### 4.3 HA Routes
| Method | Path | Description | Authentication | Rate Limiting |
|--------|------|-------------|----------------|---------------|
| POST   | /api/v1/ha/forgot-password | Initiates password reset | None | None |
| PUT    | /api/v1/ha/update | Updates HA secret key | authenticateJWT, HA only | None |
| PUT    | /api/v1/ha/toggle-availability | Toggles HA availability | authenticateJWT, HA only | None |
| POST   | /api/v1/ha/set-leave | Sets HA leave | authenticateJWT, HA only | None |
| PUT    | /api/v1/ha/cancel-leave | Cancels HA leave | authenticateJWT, HA only | None |
| GET    | /api/v1/ha/get-leave | Retrieves HA leave details | authenticateJWT, HA only | None |
| GET    | /api/v1/ha/get-ha-details | Retrieves HA profile | authenticateJWT, HA only | None |
| PUT    | /api/v1/ha/change-status/:id | Updates HA status | authenticateJWT, HA only | None |

#### PUT /api/v1/ha/change-status/:id
- **Description**: Updates HA status (e.g., `AVAILABLE`, `IN_INFIRMARY`) to inform users of availability.
- **Authentication**: `authenticateJWT, HA only`.
- **Rate Limiting**: None.
- **Request Body**:
  ```json
  {
    "status": "AVAILABLE"
  }
  ```
- **Response**:
  - **200 OK**:
    ```json
    {
      "message": "HA status updated successfully",
      "ha": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "user_id": "123e4567-e89b-12d3-a456-426614174000",
        "secret_key": "abc123",
        "status": "AVAILABLE"
      }
    }
    ```
  - **401 Unauthorized**: `{ "message": "Only HA can update status" }`
- **Example `curl`**:
  ```bash
  curl -X PUT /api/v1/ha/change-status/123e4567-e89b-12d3-a456-426614174000 \
    -H "Content-Type: application/json" \
    -b "accessToken=<jwt-token>" \
    -d '{"status":"AVAILABLE"}'
  ```

### 4.4 HA Dashboard Routes
| Method | Path | Description | Authentication | Rate Limiting |
|--------|------|-------------|----------------|---------------|
| GET    | /api/v1/ha_dashboard | Retrieves analytics for HA | authenticateJWT, HA only | None |

#### GET /api/v1/ha_dashboard
- **Description**: Retrieves analytics for HAs. Does not support query parameters.
- **Authentication**: `authenticateJWT, HA only`.
- **Rate Limiting**: None.
- **Response**:
  ```json
  {
    "message": "Analytics retrieved successfully",
    "analytics": {
      "total_treatments": 50,
      "low_inventory_items": 10,
      "active_mental_cases": 5
    }
  }
  ```
- **Example `curl`**:
  ```bash
  curl -X GET /api/v1/ha_dashboard \
    -b "accessToken=<jwt-token>"
  ```

### 4.5 Mental Cases Routes
| Method | Path | Description | Authentication | Rate Limiting |
|--------|------|-------------|----------------|---------------|
| GET    | /api/v1/mental-cases | Retrieves mental health cases | authenticateJWT, DEAN only | None |
| PUT    | /api/v1/mental-cases/update/:id | Updates a mental health case | authenticateJWT, DEAN only | None |

#### GET /api/v1/mental-cases
- **Description**: Retrieves all mental health cases. Does not support filtering.
- **Authentication**: `authenticateJWT, DEAN only`.
- **Rate Limiting**: None.
- **Response**:
  ```json
  {
    "message": "Mental cases retrieved successfully",
    "cases": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174007",
        "treatment_id": "123e4567-e89b-12d3-a456-426614174003",
        "user_id": "123e4567-e89b-12d3-a456-426614174002",
        "family_member_id": null,
        "illness_id": "123e4567-e89b-12d3-a456-426614174009",
        "action_taken": "Counseling provided",
        "is_resolved": false,
        "created_at": "2025-05-01T00:00:00.000Z",
        "updated_at": "2025-05-01T00:00:00.000Z"
      }
    ]
  }
  ```
- **Example `curl`**:
  ```bash
  curl -X GET /api/v1/mental-cases \
    -b "accessToken=<jwt-token>"
  ```

### 4.6 Illness Category Routes
| Method | Path | Description | Authentication | Rate Limiting |
|--------|------|-------------|----------------|---------------|
| POST   | /api/v1/illness_category/create | Creates an illness category | authenticateJWT, HA only | None |
| GET    | /api/v1/illness_category | Retrieves all illness categories | authenticateJWT, HA only | None |
| PUT    | /api/v1/illness_category/update/:id | Updates an illness category | authenticateJWT, HA only | None |
| DELETE | /api/v1/illness_category/delete/:id | Deletes an illness category | authenticateJWT, HA only | None |

#### POST /api/v1/illness_category/create
- **Description**: Creates an illness category.
- **Authentication**: `authenticateJWT, HA only`.
- **Rate Limiting**: None.
- **Request Body**:
  ```json
  {
    "name": "Respiratory"
  }
  ```
- **Response**:
  - **201 Created**:
    ```json
    {
      "message": "Illness category created successfully",
      "category": {
        "id": "123e4567-e89b-12d3-a456-426614174008",
        "name": "Respiratory"
      }
    }
    ```
  - **401 Unauthorized**: `{ "message": "Only HA can create illness categories" }`
- **Example `curl`**:
  ```bash
  curl -X POST /api/v1/illness_category/create \
    -H "Content-Type: application/json" \
    -b "accessToken=<jwt-token>" \
    -d '{"name":"Respiratory"}'
  ```

#### DELETE /api/v1/illness_category/delete/:id
- **Description**: Deletes an illness category. Sets `illnesses.category_id` to `null` for linked illnesses.
- **Authentication**: `authenticateJWT, HA only`.
- **Rate Limiting**: None.
- **Response**:
  - **200 OK**:
    ```json
    {
      "message": "Illness category deleted successfully"
    }
    ```
  - **401 Unauthorized**: `{ "message": "Only HA can delete illness categories" }`
- **Example `curl`**:
  ```bash
  curl -X DELETE /api/v1/illness_category/delete/123e4567-e89b-12d3-a456-426614174008 \
    -b "accessToken=<jwt-token>"
  ```

### 4.7 Illness Routes
| Method | Path | Description | Authentication | Rate Limiting |
|--------|------|-------------|----------------|---------------|
| POST   | /api/v1/illness/create | Creates a new illness | authenticateJWT, HA only | None |
| GET    | /api/v1/illness | Retrieves all illnesses | None | None |
| GET    | /api/v1/illness/:id | Retrieves an illness by ID | None | None |
| PUT    | /api/v1/illness/update/:id | Updates an illness | authenticateJWT, HA only | None |
| DELETE | /api/v1/illness/delete/:id | Deletes an illness | authenticateJWT, HA only | None |

#### POST /api/v1/illness/create
- **Description**: Creates a new illness.
- **Authentication**: `authenticateJWT, HA only`.
- **Rate Limiting**: None.
- **Request Body**:
  ```json
  {
    "name": "Flu",
    "type": "COMMUNICABLE",
    "category_id": "123e4567-e89b-12d3-a456-426614174008",
    "description": "Viral infection"
  }
  ```
- **Response**:
  - **201 Created**:
    ```json
    {
      "message": "Illness created successfully",
      "illness": {
        "id": "123e4567-e89b-12d3-a456-426614174009",
        "name": "Flu",
        "type": "COMMUNICABLE",
        "category_id": "123e4567-e89b-12d3-a456-426614174008",
        "description": "Viral infection"
      }
    }
    ```
  - **401 Unauthorized**: `{ "message": "Only HA can create illnesses" }`
- **Example `curl`**:
  ```bash
  curl -X POST /api/v1/illness/create \
    -H "Content-Type: application/json" \
    -b "accessToken=<jwt-token>" \
    -d '{"name":"Flu","type":"COMMUNICABLE","category_id":"123e4567-e89b-12d3-a456-426614174008","description":"Viral infection"}'
  ```

### 4.8 Notification Routes
| Method | Path | Description | Authentication | Rate Limiting |
|--------|------|-------------|----------------|---------------|
| POST   | /api/v1/notification/create | Creates a notification | authenticateJWT, HA only | None |
| GET    | /api/v1/notification | Retrieves notifications | authenticateJWT, HA only | None |
| PUT    | /api/v1/notification/read/:id | Marks notification as read | authenticateJWT, HA only | None |
| DELETE | /api/v1/notification/delete/:id | Deletes a notification | authenticateJWT, HA only | None |

#### POST /api/v1/notification/create
- **Description**: Creates a notification for HAs. Valid `type` values: `LOW_STOCK`, `EXPIRY`, `TREATMENT_UPDATE`.
- **Authentication**: `authenticateJWT, HA only`.
- **Rate Limiting**: None.
- **Request Body**:
  ```json
  {
    "type": "LOW_STOCK",
    "medicine_id": "123e4567-e89b-12d3-a456-426614174010",
    "batch_id": "123e4567-e89b-12d3-a456-426614174011",
    "message": "Paracetamol stock low",
    "for_role": "HA"
  }
  ```
- **Response**:
  - **201 Created**:
    ```json
    {
      "message": "Notification created successfully",
      "notification": {
        "id": "123e4567-e89b-12d3-a456-426614174012",
        "type": "LOW_STOCK",
        "medicine_id": "123e4567-e89b-12d3-a456-426614174010",
        "batch_id": "123e4567-e89b-12d3-a456-426614174011",
        "message": "Paracetamol stock low",
        "for_role": "HA",
        "is_read": false,
        "created_at": "2025-05-01T00:00:00.000Z",
        "updated_at": "2025-05-01T00:00:00.000Z"
      }
    }
    ```
  - **401 Unauthorized**: `{ "message": "Only HA can create notifications" }`
- **Example `curl`**:
  ```bash
  curl -X POST /api/v1/notification/create \
    -H "Content-Type: application/json" \
    -b "accessToken=<jwt-token>" \
    -d '{"type":"LOW_STOCK","medicine_id":"123e4567-e89b-12d3-a456-426614174010","batch_id":"123e4567-e89b-12d3-a456-426614174011","message":"Paracetamol stock low","for_role":"HA"}'
  ```

### 4.9 Staff Family Routes
| Method | Path | Description | Authentication | Rate Limiting |
|--------|------|-------------|----------------|---------------|
| POST   | /api/v1/staff-family/create | Creates a family member | authenticateJWT, STAFF or HA | None |
| GET    | /api/v1/staff-family/:staff_id | Retrieves active family members | authenticateJWT, STAFF or HA | None |
| GET    | /api/v1/staff-family/all/:staff_id | Retrieves all family members | authenticateJWT, STAFF or HA | None |
| PUT    | /api/v1/staff-family/update/:id | Updates a family member | authenticateJWT, STAFF or HA | None |
| DELETE | /api/v1/staff-family/delete/:id | Soft-deletes a family member | authenticateJWT, STAFF or HA | None |
| DELETE | /api/v1/staff-family/hard-delete/:id | Hard-deletes a family member | authenticateJWT, STAFF or HA | None |

#### POST /api/v1/staff-family/create
- **Description**: Creates a family member for a staff member.
- **Authentication**: `authenticateJWT, STAFF or HA`.
- **Rate Limiting**: None.
- **Request Body**:
  ```json
  {
    "name": "Alice Doe",
    "gender": "FEMALE",
    "contact_number": "9876543210",
    "relation": "SPOUSE",
    "date_of_birth": "1990-01-01",
    "blood_type": "O+"
  }
  ```
- **Response**:
  - **201 Created**:
    ```json
    {
      "message": "Family member created successfully",
      "family_member": {
        "id": "123e4567-e89b-12d3-a456-426614174013",
        "staff_id": "123e4567-e89b-12d3-a456-426614174001",
        "name": "Alice Doe",
        "gender": "FEMALE",
        "contact_number": "9876543210",
        "relation": "SPOUSE",
        "date_of_birth": "1990-01-01",
        "blood_type": "O+",
        "is_active": true,
        "created_at": "2025-05-01T00:00:00.000Z",
        "updated_at": "2025-05-01T00:00:00.000Z"
      }
    }
    ```
  - **401 Unauthorized**: `{ "message": "Only STAFF or HA can create family members" }`
- **Example `curl`**:
  ```bash
  curl -X POST /api/v1/staff-family/create \
    -H "Content-Type: application/json" \
    -b "accessToken=<jwt-token>" \
    -d '{"name":"Alice Doe","gender":"FEMALE","contact_number":"9876543210","relation":"SPOUSE","date_of_birth":"1990-01-01","blood_type":"O+"}'
  ```

#### GET /api/v1/staff-family/:staff_id
- **Description**: Retrieves active family members (`is_active: true`, excludes soft-deleted) for a staff member.
- **Authentication**: `authenticateJWT, STAFF or HA`.
- **Rate Limiting**: None.
- **Response**:
  ```json
  {
    "message": "Active family members retrieved successfully",
    "family_members": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174013",
        "staff_id": "123e4567-e89b-12d3-a456-426614174001",
        "name": "Alice Doe",
        "gender": "FEMALE",
        "contact_number": "9876543210",
        "relation": "SPOUSE",
        "date_of_birth": "1990-01-01",
        "blood_type": "O+",
        "is_active": true,
        "created_at": "2025-05-01T00:00:00.000Z",
        "updated_at": "2025-05-01T00:00:00.000Z"
      }
    ]
  }
  ```
- **Example `curl`**:
  ```bash
  curl -X GET /api/v1/staff-family/123e4567-e89b-12d3-a456-426614174001 \
    -b "accessToken=<jwt-token>"
  ```

#### GET /api/v1/staff-family/all/:staff_id
- **Description**: Retrieves all family members (including soft-deleted) for a staff member.
- **Authentication**: `authenticateJWT, STAFF or HA`.
- **Rate Limiting**: None.
- **Response**:
  ```json
  {
    "message": "All family members retrieved successfully",
    "family_members": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174013",
        "staff_id": "123e4567-e89b-12d3-a456-426614174001",
        "name": "Alice Doe",
        "gender": "FEMALE",
        "contact_number": "9876543210",
        "relation": "SPOUSE",
        "date_of_birth": "1990-01-01",
        "blood_type": "O+",
        "is_active": true,
        "created_at": "2025-05-01T00:00:00.000Z",
        "updated_at": "2025-05-01T00:00:00.000Z"
      },
      {
        "id": "123e4567-e89b-12d3-a456-426614174014",
        "staff_id": "123e4567-e89b-12d3-a456-426614174001",
        "name": "Bob Doe",
        "gender": "MALE",
        "contact_number": "9876543211",
        "relation": "CHILD",
        "date_of_birth": "2010-01-01",
        "blood_type": "O+",
        "is_active": false,
        "created_at": "2025-05-01T00:00:00.000Z",
        "updated_at": "2025-05-01T00:00:00.000Z"
      }
    ]
  }
  ```
- **Example `curl`**:
  ```bash
  curl -X GET /api/v1/staff-family/all/123e4567-e89b-12d3-a456-426614174001 \
    -b "accessToken=<jwt-token>"
  ```

### 4.10 Inventory Routes
| Method | Path | Description | Authentication | Rate Limiting |
|--------|------|-------------|----------------|---------------|
| POST   | /api/v1/inventory/categories/add | Creates a medicine category | authenticateJWT, HA only | None |
| GET    | /api/v1/inventory/categories | Retrieves all categories | authenticateJWT, HA only | None |
| PUT    | /api/v1/inventory/categories/:id | Updates a category | authenticateJWT, HA only | None |
| DELETE | /api/v1/inventory/categories/:id | Deletes a category | authenticateJWT, HA only | None |
| GET    | /api/v1/inventory/categories/counts | Retrieves category counts | authenticateJWT, HA only | None |
| POST   | /api/v1/inventory/medicines | Creates a new medicine | authenticateJWT, HA only | None |
| GET    | /api/v1/inventory/medicines | Retrieves all medicines | authenticateJWT, HA only | None |
| GET    | /api/v1/inventory/medicines/:id | Retrieves a medicine by ID | authenticateJWT, HA only | None |
| PUT    | /api/v1/inventory/medicines/:id | Updates a medicine | authenticateJWT, HA only | None |
| DELETE | /api/v1/inventory/medicines/:id | Deletes a medicine | authenticateJWT, HA only | None |
| GET    | /api/v1/inventory/medicines-expired | Retrieves expired medicines | authenticateJWT, HA only | None |
| POST   | /api/v1/inventory/transactions/add | Adds stock to inventory | authenticateJWT, HA only | None |
| POST   | /api/v1/inventory/transactions/use | Uses medicine for a patient | authenticateJWT, HA only | None |
| POST   | /api/v1/inventory/transactions/remove | Removes stock | authenticateJWT, HA only | None |
| GET    | /api/v1/inventory/transactions | Retrieves transaction history | authenticateJWT, HA only | None |
| GET    | /api/v1/inventory/medicine/batch/:id | Retrieves batches for a medicine | authenticateJWT, HA only | None |
| GET    | /api/v1/inventory/medicine/batch | Retrieves all batches | authenticateJWT, HA only | None |
| PUT    | /api/v1/inventory/medicine/batch/update/:id | Updates a batch | authenticateJWT, HA only | None |
| DELETE | /api/v1/inventory/medicine/batch/delete/:id | Deletes a batch | authenticateJWT, HA only | None |
| DELETE | /api/v1/inventory/medicine/batch/expired/delete/:id | Deletes an expired batch | authenticateJWT, HA only | None |

#### POST /api/v1/inventory/medicines
- **Description**: Creates a new medicine.
- **Authentication**: `authenticateJWT, HA only`.
- **Rate Limiting**: None.
- **Request Body**:
  ```json
  {
    "name": "Paracetamol",
    "category_id": "123e4567-e89b-12d3-a456-426614174014",
    "unit": "tablet"
  }
  ```
- **Response**:
  - **201 Created**:
    ```json
    {
      "message": "Medicine added successfully",
      "medicine": {
        "id": "123e4567-e89b-12d3-a456-426614174015",
        "name": "Paracetamol",
        "category_id": "123e4567-e89b-12d3-a456-426614174014",
        "unit": "tablet",
        "created_at": "2025-05-01T00:00:00.000Z",
        "updated_at": "2025-05-01T00:00:00.000Z"
      }
    }
    ```
  - **401 Unauthorized**: `{ "message": "Only HA can manage medicines" }`
- **Example `curl`**:
  ```bash
  curl -X POST /api/v1/inventory/medicines \
    -H "Content-Type: application/json" \
    -b "accessToken=<jwt-token>" \
    -d '{"name":"Paracetamol","category_id":"123e4567-e89b-12d3-a456-426614174014","unit":"tablet"}'
  ```

### 4.11 Treatment Routes
| Method | Path | Description | Authentication | Rate Limiting |
|--------|------|-------------|----------------|---------------|
| POST   | /api/v1/treatment/create | Creates a new treatment | authenticateJWT, HA only | None |
| PUT    | /api/v1/treatment/update/:id | Updates a treatment | authenticateJWT, HA only | None |
| GET    | /api/v1/treatment/patient/:id | Retrieves patient treatments | authenticateJWT | None |
| GET    | /api/v1/treatment/individual/:id | Retrieves a treatment by ID | authenticateJWT | None |
| DELETE | /api/v1/treatment/delete/:id | Deletes a treatment | authenticateJWT, HA only | None |
| GET    | /api/v1/treatment/patientAll | Retrieves all treatments | authenticateJWT, HA only | None |
| GET    | /api/v1/treatment/students | Retrieves student treatments | authenticateJWT, STAFF/DEAN/HA only | None |

#### POST /api/v1/treatment/create
- **Description**: Creates a treatment record, linking illnesses via `treatment_illnesses`.
- **Authentication**: `authenticateJWT, HA only`.
- **Rate Limiting**: None.
- **Request Body**:
  ```json
  {
    "patient_id": "123e4567-e89b-12d3-a456-426614174002",
    "family_member_id": null,
    "severity": "MILD",
    "notes": "Fever and cough",
    "blood_pressure": "120/80",
    "forward_to_hospital": false,
    "forwarded_by_hospital": false,
    "illness_ids": ["123e4567-e89b-12d3-a456-426614174009"],
    "medicines": [
      {
        "medicine_id": "123e4567-e89b-12d3-a456-426614174015",
        "batch_id": "123e4567-e89b-12d3-a456-426614174011",
        "dosage": "1 tablet"
      }
    ]
  }
  ```
- **Response**:
  - **201 Created**:
    ```json
    {
      "message": "Treatment created successfully",
      "treatment": {
        "id": "123e4567-e89b-12d3-a456-426614174003",
        "patient_id": "123e4567-e89b-12d3-a456-426614174002",
        "family_member_id": null,
        "doctor_id": "123e4567-e89b-12d3-a456-426614174000",
        "severity": "MILD",
        "notes": "Fever and cough",
        "blood_pressure": "120/80",
        "forward_to_hospital": false,
        "forwarded_by_hospital": false,
        "created_at": "2025-05-01T00:00:00.000Z"
      }
    }
    ```
  - **401 Unauthorized**: `{ "message": "Only HA can create treatments" }`
- **Example `curl`**:
  ```bash
  curl -X POST /api/v1/treatment/create \
    -H "Content-Type: application/json" \
    -b "accessToken=<jwt-token>" \
    -d '{"patient_id":"123e4567-e89b-12d3-a456-426614174002","severity":"MILD","notes":"Fever and cough","blood_pressure":"120/80","illness_ids":["123e4567-e89b-12d3-a456-426614174009"],"medicines":[{"medicine_id":"123e4567-e89b-12d3-a456-426614174015","batch_id":"123e4567-e89b-12d3-a456-426614174011","dosage":"1 tablet"}]}'
  ```

#### GET /api/v1/treatment/patient/:id
- **Description**: Retrieves treatments for a patient.
- **Authentication**: `authenticateJWT` (any logged-in user).
- **Rate Limiting**: None.
- **Response**:
  ```json
  {
    "message": "Patient treatments retrieved successfully",
    "treatments": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174003",
        "patient_id": "123e4567-e89b-12d3-a456-426614174002",
        "doctor_id": "123e4567-e89b-12d3-a456-426614174000",
        "severity": "MILD",
        "notes": "Fever and cough",
        "blood_pressure": "120/80",
        "forward_to_hospital": false,
        "forwarded_by_hospital": false,
        "created_at": "2025-05-01T00:00:00.000Z"
      }
    ]
  }
  ```
- **Example `curl`**:
  ```bash
  curl -X GET /api/v1/treatment/patient/123e4567-e89b-12d3-a456-426614174002 \
    -b "accessToken=<jwt-token>"
  ```

### 4.12 MFA Routes
| Method | Path | Description | Authentication | Rate Limiting |
|--------|------|-------------|----------------|---------------|
| POST   | /api/v1/mfa/invoke | Sets up MFA | authenticateJWT | None |
| POST   | /api/v1/mfa/verify-login | Verifies MFA code for login | None | None |
| PUT    | /api/v1/mfa/revoke | Revokes MFA | authenticateJWT | None |

#### POST /api/v1/mfa/invoke
- **Description**: Initiates MFA setup for a user.
- **Authentication**: `authenticateJWT` (any logged-in user).
- **Rate Limiting**: None.
- **Request Body**: None.
- **Response**:
  ```json
  {
    "message": "MFA has been enabled successfully.",
    "user": {
      "id": "21fe03b1-b358-4fe7-989c-2a8d103783a9",
      "email": "02210217.cst@rub.edu.bt",
      "role": "HA",
      "verified": true,
      "mfa_required": true
    }
  }
  ```
- **Example `curl`**:
  ```bash
  curl -X POST /api/v1/mfa/invoke \
    -b "accessToken=<jwt-token>"
  ```

#### POST /api/v1/mfa/verify-login
- **Description**: Verifies an MFA code during login.
- **Authentication**: None.
- **Rate Limiting**: None.
- **Request Body**:
  ```json
  {
    "email": "02210217.cst@rub.edu.bt",
    "code": "123456"
  }
  ```
- **Response**:
  ```json
  {
    "message": "MFA verified successfully"
  }
  ```
- **Example `curl`**:
  ```bash
  curl -X POST /api/v1/mfa/verify-login \
    -H "Content-Type: application/json" \
    -d '{"email":"02210217.cst@rub.edu.bt","code":"123456"}'
  ```

#### PUT /api/v1/mfa/revoke
- **Description**: Revokes MFA for a user.
- **Authentication**: `authenticateJWT` (any logged-in user).
- **Rate Limiting**: None.
- **Request Body**: None.
- **Response**:
  ```json
  {
    "message": "MFA successfully disabled."
  }
  ```
- **Example `curl`**:
  ```bash
  curl -X PUT /api/v1/mfa/revoke \
    -b "accessToken=<jwt-token>"
  ```

### 4.13 Session Routes
| Method | Path | Description | Authentication | Rate Limiting |
|--------|------|-------------|----------------|---------------|
| GET    | /api/v1/session/all | Retrieves all sessions | authenticateJWT | None |
| GET    | /api/v1/session | Retrieves current session | authenticateJWT | None |
| DELETE | /api/v1/session/:id | Deletes a session | authenticateJWT | None |
| DELETE | /api/v1/session/delete/all | Deletes all sessions | authenticateJWT | None |

#### GET /api/v1/session
- **Description**: Retrieves the current session for the authenticated user.
- **Authentication**: `authenticateJWT` (any logged-in user).
- **Rate Limiting**: None.
- **Response**:
  ```json
  {
    "message": "Session retrieved successfully",
    "user": {
      "sessionid": "f2664a0f-81fb-41de-98b7-ba1a714c60a5",
      "userId": "21fe03b1-b358-4fe7-989c-2a8d103783a9",
      "userAgent": "Thunder Client (https://www.thunderclient.com)",
      "createdAt": "2025-05-01T05:24:40.174Z",
      "expiredAt": "2025-05-08T05:24:40.127Z"
    }
  }
  ```
- **Example `curl`**:
  ```bash
  curl -X GET /api/v1/session \
    -b "accessToken=<jwt-token>"
  ```

#### GET /api/v1/session/all
- **Description**: Retrieves all sessions for the authenticated user.
- **Authentication**: `authenticateJWT` (any logged-in user).
- **Rate Limiting**: None.
- **Response**:
  ```json
  {
    "message": "Sessions retrieved successfully",
    "users": [
      {
        "sessionid": "f2664a0f-81fb-41de-98b7-ba1a714c60a5",
        "userId": "21fe03b1-b358-4fe7-989c-2a8d103783a9",
        "userAgent": "Thunder Client (https://www.thunderclient.com)",
        "createdAt": "2025-05-01T05:24:40.174Z",
        "expiredAt": "2025-05-08T05:24:40.127Z"
      }
    ]
  }
  ```
- **Example `curl`**:
  ```bash
  curl -X GET /api/v1/session/all \
    -b "accessToken=<jwt-token>"
  ```

#### DELETE /api/v1/session/:id
- **Description**: Deletes a specific session.
- **Authentication**: `authenticateJWT` (any logged-in user).
- **Rate Limiting**: None.
- **Response**:
  ```json
  {
    "message": "Session deleted successfully"
  }
  ```
- **Example `curl`**:
  ```bash
  curl -X DELETE /api/v1/session/f2664a0f-81fb-41de-98b7-ba1a714c60a5 \
    -b "accessToken=<jwt-token>"
  ```

#### DELETE /api/v1/session/delete/all
- **Description**: Deletes all sessions for the authenticated user.
- **Authentication**: `authenticateJWT` (any logged-in user).
- **Rate Limiting**: None.
- **Response**:
  ```json
  {
    "message": "All sessions deleted successfully"
  }
  ```
- **Example `curl`**:
  ```bash
  curl -X DELETE /api/v1/session/delete/all \
    -b "accessToken=<jwt-token>"
  ```

### 4.14 Users Routes
| Method | Path | Description | Authentication | Rate Limiting |
|--------|------|-------------|----------------|---------------|
| PUT    | /api/v1/users/update | Updates user profile | authenticateJWT | None |
| POST   | /api/v1/users/email | Checks email availability or initiates password reset | None | None |
| PUT    | /api/v1/users/update-profile | Updates profile picture | authenticateJWT | None |
| PUT    | /api/v1/users/change-password | Changes user password | authenticateJWT | 3 req/5 min |
| GET    | /api/v1/users/users | Retrieves all users | authenticateJWT, HA only | None |
| GET    | /api/v1/users/programmes | Retrieves academic programs | authenticateJWT | None |
| PUT    | /api/v1/users/change-userType/:id | Changes user type | authenticateJWT | None |
| GET    | /api/v1/users/getStaff | Retrieves staff users | authenticateJWT | None |

#### PUT /api/v1/users/update
- **Description**: Updates user profile.
- **Authentication**: `authenticateJWT` (any logged-in user).
- **Rate Limiting**: None.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "gender": "FEMALE",
    "department_id": "dep-2",
    "blood_type": "O+",
    "contact_number": "1234567890"
  }
  ```
- **Response**:
  - **200 OK**:
    ```json
    {
      "message": "User profile updated successfully",
      "user": {
        "id": "123e4567-e89b-12d3-a456-426614174006",
        "name": "Jane Doe",
        "gender": "FEMALE",
        "department_id": "dep-2",
        "blood_type": "O+",
        "contact_number": "1234567890",
        "student_id": "02210217",
        "std_year": "3",
        "userType": "STUDENT",
        "date_of_birth": "2000-01-01",
        "profile_url": null
      }
    }
    ```
  - **401 Unauthorized**: `{ "message": "Unauthorized access" }`
- **Example `curl`**:
  ```bash
  curl -X PUT /api/v1/users/update \
    -H "Content-Type: application/json" \
    -b "accessToken=<jwt-token>" \
    -d '{"name":"Jane Doe","gender":"FEMALE","department_id":"dep-2","blood_type":"O+","contact_number":"1234567890"}'
  ```

#### POST /api/v1/users/email
- **Description**: Checks email availability or initiates password reset.
- **Authentication**: None.
- **Rate Limiting**: None.
- **Request Body**:
  ```json
  {
    "email": "02210217.cst@rub.edu.bt"
  }
  ```
- **Response**:
  - **200 OK**:
    ```json
    {
      "message": "Email availability checked or password reset initiated"
    }
    ```
  - **400 Bad Request**: `{ "message": "Invalid email" }`
- **Example `curl`**:
  ```bash
  curl -X POST /api/v1/users/email \
    -H "Content-Type: application/json" \
    -d '{"email":"02210217.cst@rub.edu.bt"}'
  ```

#### PUT /api/v1/users/change-password
- **Description**: Changes the user’s password.
- **Authentication**: `authenticateJWT` (any logged-in user).
- **Rate Limiting**: 3 requests per 5 minutes.
- **Request Body**:
  ```json
  {
    "oldPassword": "Password123!",
    "newPassword": "NewPassword123!"
  }
  ```
- **Response**:
  - **200 OK**:
    ```json
    {
      "message": "Password changed successfully"
    }
    ```
  - **401 Unauthorized**: `{ "message": "Invalid old password" }`
- **Example `curl`**:
  ```bash
  curl -X PUT /api/v1/users/change-password \
    -H "Content-Type: application/json" \
    -b "accessToken=<jwt-token>" \
    -d '{"oldPassword":"Password123!","newPassword":"NewPassword123!"}'
  ```

#### GET /api/v1/users/programmes
- **Description**: Retrieves academic programs.
- **Authentication**: `authenticateJWT` (any logged-in user).
- **Rate Limiting**: None.
- **Response**:
  ```json
  {
    "message": "Programmes retrieved successfully",
    "programmes": [
      {
        "programme_id": "prog-1",
        "programme_name": "Computer Science"
      }
    ]
  }
  ```
- **Example `curl`**:
  ```bash
  curl -X GET /api/v1/users/programmes \
    -b "accessToken=<jwt-token>"
  ```

## 5. Error Handling
- **400 Bad Request**: Invalid input (e.g., missing fields, invalid email).
  ```json
  {
    "message": "Invalid input",
    "error": "Email is required"
  }
  ```
- **401 Unauthorized**: Missing or invalid JWT, or insufficient permissions.
  ```json
  {
    "message": "Unauthorized access",
    "error": "Only HA can perform this action"
  }
  ```
- **404 Not Found**: Resource not found (e.g., invalid `:id`).
  ```json
  {
    "message": "Resource not found",
    "error": "User with ID 123e4567-e89b-12d3-a456-426614174999 not found"
  }
  ```
- **429 Too Many Requests**: Rate limit exceeded (e.g., `PUT /api/v1/users/change-password`).
  ```json
  {
    "message": "Too many requests",
    "error": "Rate limit exceeded. Try again in 5 minutes"
  }
  ```

## 6. Appendix
### User Types
- `STUDENT`: Students of the institution.
- `STAFF`: Faculty or administrative staff.
- `DEAN`: Academic deans.
- `NON-STAFF`: Non-staff users (e.g., external contractors).
- `HA`: Health Administrators.
- `PREVIOUS_HA`: Former Health Administrators.

### Database Tables Schemas (Drizzle ORM)
- `users`: `{ id, name, email, userType, student_id, gender, department_id, std_year, blood_type, date_of_birth, contact_number, profile_url }`
- `login`: `{ user_id, email, password }`
- `ha_details`: `{ id, user_id, secret_key, status }`
- `feed`: `{ id, user_id, title, description, image_urls, video_url, created_at, updated_at }`
- `mental_cases`: `{ id, treatment_id, user_id, family_member_id, illness_id, action_taken, is_resolved, created_at, updated_at }`
- `illness_categories`: `{ id, name }`
- `illnesses`: `{ id, name, type, category_id, description }`
- `notifications`: `{ id, type, medicine_id, batch_id, message, for_role, is_read, created_at, updated_at }`
- `staff_family`: `{ id, staff_id, name, gender, contact_number, relation, date_of_birth, blood_type, is_active, created_at, updated_at }`
- `medicine_categories`: `{ id, name }`
- `medicines`: `{ id, name, category_id, unit, created_at, updated_at }`
- `medicine_batches`: `{ id, medicine_id, batch_no, stock, manufactured_date, expiry_date, created_at, updated_at }`
- `treatments`: `{ id, patient_id, family_member_id, doctor_id, severity, notes, blood_pressure, forward_to_hospital, forwarded_by_hospital, created_at }`
- `treatment_illnesses`: `{ treatment_id, illness_id }`
- `programmes`: `{ programme_id, programme_name }`


### Detailed Database Tables
Below is a list of database tables with their fields and relationships, defined using Drizzle ORM. Relationships are indicated by foreign keys, including cascade behavior where applicable.

#### users
- **Fields**:
  - `id`: uuid
  - `student_id`: varchar
  - `name`: varchar
  - `gender`: enum(MALE, FEMALE, OTHERS)
  - `department_id`: varchar
  - `std_year`: varchar
  - `userType`: enum(STUDENT, STAFF, DEAN, NON-STAFF, HA, PREVIOUS_HA)
  - `blood_type`: enum(O+, O-, A+, A-, B+, B-, AB+, AB-, Unknown)
  - `date_of_birth`: timestamp
  - `contact_number`: varchar
  - `profile_url`: varchar
- **Relationships**:
  - Primary key: `id` (uuid, unique)
  - Referenced by: `login.user_id`, `sessions.user_id`, `ha_details.ha_id`, `feeds.user_id`, `inventory_transactions.user_id`, `inventory_transactions.patient_id`, `patient_treatment_history.patient_id`, `patient_treatment_history.doctor_id`, `staff_family_members.staff_id`, `mental_health_cases.user_id`

#### login
- **Fields**:
  - `id`: uuid
  - `user_id`: uuid
  - `email`: varchar
  - `password`: text
  - `role`: enum(STUDENT, STAFF, DEAN, HA, PREVIOUS_HA)
  - `verified`: boolean
  - `mfa_required`: boolean
- **Relationships**:
  - Primary key: `id` (uuid, unique)
  - Foreign key: `user_id` references `users.id` (no cascade)

#### sessions
- **Fields**:
  - `id`: uuid
  - `user_id`: uuid
  - `user_agent`: varchar
  - `created_at`: timestamp
  - `expired_at`: timestamp
- **Relationships**:
  - Primary key: `id` (uuid, unique)
  - Foreign key: `user_id` references `users.id` (no cascade)

#### ha_details
- **Fields**:
  - `ha_id`: uuid
  - `secret_key`: text
  - `is_available`: boolean
  - `is_onLeave`: boolean
  - `status`: enum(ACTIVE, INACTIVE)
  - `updated_at`: timestamp
- **Relationships**:
  - Primary key: `ha_id` (uuid, unique)
  - Foreign key: `ha_id` references `users.id` (onDelete: cascade)
  - Referenced by: `ha_availability.ha_id`

#### ha_availability
- **Fields**:
  - `id`: uuid
  - `ha_id`: uuid
  - `start_date`: timestamp
  - `end_date`: timestamp
  - `reason`: text
  - `created_at`: timestamp
  - `processed`: boolean
- **Relationships**:
  - Primary key: `id` (uuid, unique)
  - Foreign key: `ha_id` references `ha_details.ha_id` (onDelete: cascade)

#### feeds
- **Fields**:
  - `id`: uuid
  - `user_id`: uuid
  - `title`: text
  - `description`: text
  - `image_urls`: jsonb
  - `video_url`: jsonb
  - `created_at`: timestamp
  - `updated_at`: timestamp
- **Relationships**:
  - Primary key: `id` (uuid, unique)
  - Foreign key: `user_id` references `users.id` (no cascade)

#### medicine_categories
- **Fields**:
  - `id`: uuid
  - `name`: text
  - `created_at`: timestamp
- **Relationships**:
  - Primary key: `id` (uuid, unique)
  - Referenced by: `medicines.category_id`

#### medicines
- **Fields**:
  - `id`: uuid
  - `name`: text
  - `category_id`: uuid
  - `unit`: text
  - `created_at`: timestamp
  - `updated_at`: timestamp
- **Relationships**:
  - Primary key: `id` (uuid, unique)
  - Foreign key: `category_id` references `medicine_categories.id` (onDelete: set null)
  - Referenced by: `medicine_batches.medicine_id`, `inventory_transactions.medicine_id`, `treatment_medicines.medicine_id`, `notifications.medicine_id`

#### medicine_batches
- **Fields**:
  - `id`: uuid
  - `medicine_id`: uuid
  - `batch_name`: text
  - `quantity`: integer
  - `is_deleted`: boolean
  - `expiry_date`: timestamp
  - `created_at`: timestamp
- **Relationships**:
  - Primary key: `id` (uuid, unique)
  - Foreign key: `medicine_id` references `medicines.id` (onDelete: cascade)
  - Referenced by: `inventory_transactions.batch_id`, `treatment_medicines.batch_id`, `notifications.batch_id`

#### inventory_transactions
- **Fields**:
  - `id`: uuid
  - `batch_id`: uuid
  - `batch_name`: text
  - `medicine_id`: uuid
  - `change`: integer
  - `type`: enum(ADDED, USED_FOR_PATIENT, REMOVED)
  - `reason`: text
  - `user_id`: uuid
  - `patient_id`: uuid
  - `family_member_id`: uuid
  - `created_at`: timestamp
- **Relationships**:
  - Primary key: `id` (uuid, unique)
  - Foreign key: `batch_id` references `medicine_batches.id` (onDelete: set null)
  - Foreign key: `medicine_id` references `medicines.id` (no cascade)
  - Foreign key: `user_id` references `users.id` (onDelete: set null)
  - Foreign key: `patient_id` references `users.id` (onDelete: set null)
  - Foreign key: `family_member_id` references `staff_family_members.id` (onDelete: cascade)

#### illness_categories
- **Fields**:
  - `id`: uuid
  - `name`: text
- **Relationships**:
  - Primary key: `id` (uuid, unique)
  - Referenced by: `illnesses.category_id`

#### illnesses
- **Fields**:
  - `id`: uuid
  - `name`: text
  - `type`: enum(COMMUNICABLE, NON_COMMUNICABLE)
  - `category_id`: uuid
  - `description`: text
- **Relationships**:
  - Primary key: `id` (uuid, unique)
  - Foreign key: `category_id` references `illness_categories.id` (onDelete: set null)
  - Referenced by: `treatment_illnesses.illness_id`, `mental_health_cases.illness_id`

#### patient_treatment_history
- **Fields**:
  - `id`: uuid
  - `patient_id`: uuid
  - `family_member_id`: uuid
  - `doctor_id`: uuid
  - `severity`: enum(MILD, MODERATE, SEVERE)





## 7. Notes
- Update the base URL (`/api/v1`) to the production URL post-deployment.
- `POST /api/v1/auth/register` requires email domain `*.cst@rub.edu.bt`for all the users.
- Session responses include joined user and HA data; simplified for documentation.
- All MFA schemas are confirmed and included.