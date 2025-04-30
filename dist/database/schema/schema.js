"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifications = exports.mental_health_cases = exports.illness_categories = exports.staff_family_members = exports.treatment_illnesses = exports.treatment_medicines = exports.patient_treatment_history = exports.illnesses = exports.medicine_batches = exports.inventory_transactions = exports.medicines = exports.medicine_categories = exports.feeds = exports.ha_availability = exports.ha_details = exports.sessions = exports.login = exports.users = exports.programmes = exports.HASTATUS = exports.RELATION_ENUM = exports.severityEnum = exports.illnessTypeEnum = exports.transactionTypeEnum = exports.ROLE_ENUM = exports.USER_TYPE_ENUM = exports.BLOOD_GROUP_ENUM = exports.GENDER_ENUM = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.GENDER_ENUM = (0, pg_core_1.pgEnum)('gender', ['MALE', 'FEMALE', 'OTHERS']);
exports.BLOOD_GROUP_ENUM = (0, pg_core_1.pgEnum)('blood_type', ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'Unknown']);
exports.USER_TYPE_ENUM = (0, pg_core_1.pgEnum)('user_type', ['STUDENT', 'STAFF', 'DEAN', 'NON-STAFF', 'HA', 'PREVIOUS_HA']);
exports.ROLE_ENUM = (0, pg_core_1.pgEnum)('role', ['STUDENT', 'STAFF', 'DEAN', 'HA', 'PREVIOUS_HA']);
exports.transactionTypeEnum = (0, pg_core_1.pgEnum)("transaction_type", ["ADDED", "USED_FOR_PATIENT", "REMOVED"]);
exports.illnessTypeEnum = (0, pg_core_1.pgEnum)("illness_type", ["COMMUNICABLE", "NON_COMMUNICABLE"]);
exports.severityEnum = (0, pg_core_1.pgEnum)("severity", ["MILD", "MODERATE", "SEVERE"]);
exports.RELATION_ENUM = (0, pg_core_1.pgEnum)("relation", ["CHILD", "SPOUSE", "PARENT", "SIBLING", "OTHER"]);
exports.HASTATUS = (0, pg_core_1.pgEnum)("ha_status", ["ACTIVE", "INACTIVE"]);
exports.programmes = (0, pg_core_1.pgTable)('programmes', {
    programme_id: (0, pg_core_1.varchar)('programme_id', { length: 10 }).unique().notNull().primaryKey(),
    programme_name: (0, pg_core_1.varchar)('programme_name', { length: 255 }).unique().notNull()
});
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.uuid)('id').notNull().primaryKey().defaultRandom().unique(),
    student_id: (0, pg_core_1.varchar)('student_id', { length: 8 }).unique(),
    name: (0, pg_core_1.varchar)('name').notNull(),
    gender: (0, exports.GENDER_ENUM)('gender'),
    department_id: (0, pg_core_1.varchar)('department_id', { length: 10 }),
    std_year: (0, pg_core_1.varchar)('std_year'),
    userType: (0, exports.USER_TYPE_ENUM)('user_type'),
    blood_type: (0, exports.BLOOD_GROUP_ENUM)('blood_type'),
    date_of_birth: (0, pg_core_1.timestamp)("date_of_birth"),
    contact_number: (0, pg_core_1.varchar)('contact_number', { length: 10 }).unique(),
    profile_url: (0, pg_core_1.varchar)('profile_url', { length: 255 })
});
exports.login = (0, pg_core_1.pgTable)("login", {
    id: (0, pg_core_1.uuid)('id').notNull().primaryKey().defaultRandom().unique(),
    user_id: (0, pg_core_1.uuid)("user_id").references(() => exports.users.id).notNull(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    password: (0, pg_core_1.text)().notNull(),
    role: (0, exports.ROLE_ENUM)('role'),
    verified: (0, pg_core_1.boolean)().default(false),
    mfa_required: (0, pg_core_1.boolean)("mfa_required").default(false)
});
exports.sessions = (0, pg_core_1.pgTable)("sessions", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    user_id: (0, pg_core_1.uuid)("user_id").references(() => exports.users.id).notNull(),
    user_agent: (0, pg_core_1.varchar)("user_agent", { length: 255 }).notNull(),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    expired_at: (0, pg_core_1.timestamp)("expired_at").notNull()
});
exports.ha_details = (0, pg_core_1.pgTable)("ha_details", {
    ha_id: (0, pg_core_1.uuid)("ha_id").primaryKey().references(() => exports.users.id, { onDelete: "cascade" }),
    secret_key: (0, pg_core_1.text)("secret_key").notNull(),
    is_available: (0, pg_core_1.boolean)("is_available").default(true),
    is_onLeave: (0, pg_core_1.boolean)("is_on_leave").default(false),
    status: (0, exports.HASTATUS)("status").default("INACTIVE"),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow()
});
exports.ha_availability = (0, pg_core_1.pgTable)("ha_availability", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom().notNull(),
    ha_id: (0, pg_core_1.uuid)("ha_id").references(() => exports.ha_details.ha_id, { onDelete: "cascade" }),
    start_date: (0, pg_core_1.timestamp)("start_date").notNull(),
    end_date: (0, pg_core_1.timestamp)("end_date").notNull(),
    reason: (0, pg_core_1.text)("reason"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    processed: (0, pg_core_1.boolean)("processed").default(false),
});
exports.feeds = (0, pg_core_1.pgTable)("feeds", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    user_id: (0, pg_core_1.uuid)("user_id").references(() => exports.users.id),
    title: (0, pg_core_1.text)("title").default(""),
    description: (0, pg_core_1.text)("description").default(""),
    image_urls: (0, pg_core_1.jsonb)("image_urls").default([]),
    video_url: (0, pg_core_1.jsonb)("video_url").default([]),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.medicine_categories = (0, pg_core_1.pgTable)("medicine_categories", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    name: (0, pg_core_1.text)("name").unique().notNull(),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.medicines = (0, pg_core_1.pgTable)("medicines", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    category_id: (0, pg_core_1.uuid)("category_id").references(() => exports.medicine_categories.id, { onDelete: "set null" }),
    unit: (0, pg_core_1.text)("unit").notNull(),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.inventory_transactions = (0, pg_core_1.pgTable)("inventory_transactions", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    batch_id: (0, pg_core_1.uuid)("batch_id").references(() => exports.medicine_batches.id, { onDelete: "set null" }),
    batch_name: (0, pg_core_1.text)("batch_name"),
    medicine_id: (0, pg_core_1.uuid)("medicine_id").references(() => exports.medicines.id),
    change: (0, pg_core_1.integer)("change").notNull(),
    type: (0, exports.transactionTypeEnum)("type").notNull(),
    reason: (0, pg_core_1.text)("reason").notNull(),
    user_id: (0, pg_core_1.uuid)("user_id").references(() => exports.users.id, { onDelete: "set null" }),
    patient_id: (0, pg_core_1.uuid)("patient_id").references(() => exports.users.id, { onDelete: "set null" }),
    family_member_id: (0, pg_core_1.uuid)("family_member_id").references(() => exports.staff_family_members.id, { onDelete: "cascade" }),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.medicine_batches = (0, pg_core_1.pgTable)("medicine_batches", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    medicine_id: (0, pg_core_1.uuid)("medicine_id").references(() => exports.medicines.id, { onDelete: "cascade" }),
    batch_name: (0, pg_core_1.text)("batch_name").default("Batch 1").notNull(),
    quantity: (0, pg_core_1.integer)("quantity").notNull(),
    is_deleted: (0, pg_core_1.boolean)("is_deleted").default(false),
    expiry_date: (0, pg_core_1.timestamp)("expiry_date").notNull(),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.illnesses = (0, pg_core_1.pgTable)("illnesses", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    type: (0, exports.illnessTypeEnum)("type").notNull(),
    category_id: (0, pg_core_1.uuid)("category_id").references(() => exports.illness_categories.id, { onDelete: "set null" }),
    description: (0, pg_core_1.text)("description").default(""),
});
exports.patient_treatment_history = (0, pg_core_1.pgTable)("patient_treatment_history", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    patient_id: (0, pg_core_1.uuid)("patient_id").references(() => exports.users.id, { onDelete: "cascade" }),
    family_member_id: (0, pg_core_1.uuid)("family_member_id").references(() => exports.staff_family_members.id, { onDelete: "cascade" }),
    doctor_id: (0, pg_core_1.uuid)("doctor_id").references(() => exports.users.id, { onDelete: "set null" }),
    severity: (0, exports.severityEnum)("severity").notNull(),
    notes: (0, pg_core_1.text)("notes"),
    blood_pressure: (0, pg_core_1.text)('blood_pressure'),
    forward_to_hospital: (0, pg_core_1.boolean)('forward_to_hospital').default(false),
    forwarded_by_hospital: (0, pg_core_1.boolean)('forwarded_by_hospital').default(false),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.treatment_medicines = (0, pg_core_1.pgTable)("treatment_medicines", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    treatment_id: (0, pg_core_1.uuid)("treatment_id").references(() => exports.patient_treatment_history.id, { onDelete: "cascade" }),
    medicine_id: (0, pg_core_1.uuid)("medicine_id").references(() => exports.medicines.id, { onDelete: "set null" }),
    batch_id: (0, pg_core_1.uuid)("batch_id").references(() => exports.medicine_batches.id, { onDelete: "set null" }),
    dosage: (0, pg_core_1.text)("dosage").notNull(),
});
exports.treatment_illnesses = (0, pg_core_1.pgTable)("treatment_illnesses", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(), // Added a UUID primary key
    treatment_id: (0, pg_core_1.uuid)("treatment_id").references(() => exports.patient_treatment_history.id, { onDelete: "cascade" }),
    illness_id: (0, pg_core_1.uuid)("illness_id").references(() => exports.illnesses.id, { onDelete: "cascade" }),
});
exports.staff_family_members = (0, pg_core_1.pgTable)("staff_family_members", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    staff_id: (0, pg_core_1.uuid)("staff_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    name: (0, pg_core_1.text)("name").notNull(),
    gender: (0, exports.GENDER_ENUM)("gender"),
    contact_number: (0, pg_core_1.varchar)("contact_number", { length: 10 }).unique(),
    relation: (0, exports.RELATION_ENUM)("relation").notNull(),
    date_of_birth: (0, pg_core_1.timestamp)("date_of_birth"),
    blood_type: (0, exports.BLOOD_GROUP_ENUM)('blood_type'),
    is_active: (0, pg_core_1.boolean)("is_active").default(true),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.illness_categories = (0, pg_core_1.pgTable)("illness_categories", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    name: (0, pg_core_1.text)("name").notNull().unique(),
});
exports.mental_health_cases = (0, pg_core_1.pgTable)('mental_health_cases', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    treatment_id: (0, pg_core_1.uuid)('treatment_id').references(() => exports.patient_treatment_history.id, { onDelete: 'cascade' }),
    user_id: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id, { onDelete: 'set null' }),
    family_member_id: (0, pg_core_1.uuid)('family_member_id').references(() => exports.staff_family_members.id, { onDelete: 'set null' }),
    illness_id: (0, pg_core_1.uuid)('illness_id').references(() => exports.illnesses.id, { onDelete: 'set null' }),
    action_taken: (0, pg_core_1.text)('action_taken'),
    is_resolved: (0, pg_core_1.boolean)('is_resolved').default(false),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
exports.notifications = (0, pg_core_1.pgTable)("notifications", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    type: (0, pg_core_1.text)("type").notNull(),
    medicine_id: (0, pg_core_1.uuid)("medicine_id").references(() => exports.medicines.id),
    batch_id: (0, pg_core_1.uuid)("batch_id").references(() => exports.medicine_batches.id),
    message: (0, pg_core_1.text)("message").notNull(),
    for_role: (0, exports.ROLE_ENUM)('role').default("HA"),
    is_read: (0, pg_core_1.boolean)("is_read").default(false),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow()
});
