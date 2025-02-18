export interface RegisterDto {
    name: string;
    student_id?: string;
    email?: string; 
    contact_number: string;
    password?: string;
    confirmPassword?: string; 
    gender: "MALE" | "FEMALE" | "OTHERS";
    blood_type?: "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-"; 
    department_id?: string; 
    std_year?: string; 
    user_type: "STUDENT" | "STAFF" | "DEAN" | "NON-STAFF" | "HA";
    role?: "STUDENT" | "STAFF" | "DEAN" | "HA";
    secret_word?: string
}
export interface LoginDto{
    email: string,
    password: string,
    userAgent?: string
}
export interface resetPasswordDto{
    password: string,
    verificationCode: string
}
