import { boolean, char, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const GENDER_ENUM = pgEnum('gender', ['MALE', 'FEMALE', 'OTHERS'])
export const BLOOD_GROUP_ENUM = pgEnum('blood_type', ['O+', 'O-', 'A+','A-','B+','B-','AB+','AB-','Unknown'])
export const USER_TYPE_ENUM = pgEnum('user_type', ['STUDENT', 'STAFF', 'DEAN', 'NON-STAFF','HA'])
export const ROLE_ENUM = pgEnum('role', ['STUDENT', 'STAFF', 'DEAN','HA'])
export const transactionTypeEnum = pgEnum("transaction_type", ["ADDED", "USED_FOR_PATIENT", "REMOVED"]);
export const illnessTypeEnum = pgEnum("illness_type", ["COMMUNICABLE", "NON_COMMUNICABLE"]);
export const severityEnum = pgEnum("severity", ["MILD", "MODERATE", "SEVERE"]);
export const RELATION_ENUM = pgEnum("relation", ["CHILD", "SPOUSE", "PARENT", "SIBLING", "OTHER"]);

export const programmes = pgTable('programmes',{
    programme_id: varchar('programme_id', {length: 10}).unique().notNull().primaryKey(),
    programme_name: varchar('programme_name', {length: 255}).unique().notNull()
})


export const users = pgTable("users", {
    id: uuid('id').notNull().primaryKey().defaultRandom().unique(),
    student_id: varchar('student_id', {length: 8}).unique(), 
    name: varchar('name').notNull(),
    gender: GENDER_ENUM('gender'),
    department_id: varchar('department_id', {length: 10}),
    std_year: varchar('std_year'),
    userType: USER_TYPE_ENUM('user_type'),
    blood_type : BLOOD_GROUP_ENUM('blood_type'),
    date_of_birth: timestamp("date_of_birth"),
    contact_number: varchar('contact_number', {length: 10}).unique(),
    profile_url: varchar('profile_url', {length: 255})
})


export const login = pgTable("login", {
    id : uuid('id').notNull().primaryKey().defaultRandom().unique(),
    user_id: uuid("user_id").references(() => users.id).notNull(),
    email: varchar('email', {length: 255}).notNull().unique(),
    password: text().notNull(),
    role: ROLE_ENUM('role'),
    verified: boolean().default(false),
    mfa_required: boolean("mfa_required").default(false)
})

export const sessions = pgTable("sessions", {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id").references(() => users.id).notNull(), 
    user_agent: varchar("user_agent", { length: 255 }).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    expired_at: timestamp("expired_at").notNull()
});
export const ha_details = pgTable("ha_details", {
    ha_id: uuid("ha_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),  
    secret_key: text("secret_key").notNull(), 
    is_available: boolean("is_available").default(true),
    is_onLeave: boolean("is_on_leave").default(false),
    updated_at: timestamp("updated_at").defaultNow()
});
export const ha_availability = pgTable("ha_availability", {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    ha_id: uuid("ha_id").references(() => ha_details.ha_id, { onDelete: "cascade" }),
    start_date: timestamp("start_date").notNull(),
    end_date: timestamp("end_date").notNull(),
    reason: text("reason"),
    created_at: timestamp("created_at").defaultNow(),
    processed: boolean("processed").default(false),
});
export const feeds = pgTable("feeds", {
    id: uuid("id").defaultRandom().primaryKey(),
    user_id: uuid("user_id").references(() => users.id),  
    title: text("title").default(""),
    description: text("description").default(""),
    image_urls: jsonb("image_urls").default([]),  
    video_url: jsonb("video_url").default([]),  
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
});
export const medicine_categories = pgTable("medicine_categories", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").unique().notNull(),
    created_at: timestamp("created_at").defaultNow(),
});

export const medicines = pgTable("medicines", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    category_id: uuid("category_id").references(() => medicine_categories.id, { onDelete: "set null" }), 
    unit: text("unit").notNull(), 
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
});
export const inventory_transactions = pgTable("inventory_transactions", {
    id: uuid("id").defaultRandom().primaryKey(),
    batch_id: uuid("batch_id").references(() => medicine_batches.id, { onDelete: "set null" }),
    batch_name: text("batch_name"),
    medicine_id: uuid("medicine_id").references(() => medicines.id), 
    change: integer("change").notNull(), 
    type: transactionTypeEnum("type").notNull(), 
    reason: text("reason").notNull(),
    user_id: uuid("user_id").references(() => users.id, { onDelete: "set null" }), 
    patient_id: uuid("patient_id").references(() => users.id, { onDelete: "set null" }),
    family_member_id: uuid("family_member_id").references(() => staff_family_members.id, { onDelete: "cascade" }), 
    created_at: timestamp("created_at").defaultNow(),
});
export const medicine_batches = pgTable("medicine_batches", {
    id: uuid("id").defaultRandom().primaryKey(),
    medicine_id: uuid("medicine_id").references(() => medicines.id, { onDelete: "cascade" }),
    batch_name: text("batch_name").default("Batch 1").notNull(),
    quantity: integer("quantity").notNull(),
    expiry_date: timestamp("expiry_date").notNull(),
    created_at: timestamp("created_at").defaultNow(),
});
export const illnesses = pgTable("illnesses", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    type: illnessTypeEnum("type").notNull(), 
    description: text("description").default(""),
});

export const patient_treatment_history = pgTable("patient_treatment_history", {
    id: uuid("id").defaultRandom().primaryKey(),
    patient_id: uuid("patient_id").references(() => users.id, { onDelete: "cascade" }),
    family_member_id: uuid("family_member_id").references(() => staff_family_members.id, { onDelete: "cascade" }), 
    doctor_id: uuid("doctor_id").references(() => users.id, { onDelete: "set null" }), 
    severity: severityEnum("severity").notNull(), 
    notes: text("notes"),
    blood_pressure: text('blood_pressure'),
    forward_to_hospital: boolean('forward_to_hospital').default(false),
    forwarded_by_hospital: boolean('forwarded_by_hospital').default(false),
    created_at: timestamp("created_at").defaultNow(),
});
export const treatment_medicines = pgTable("treatment_medicines", {
    id: uuid("id").defaultRandom().primaryKey(),
    treatment_id: uuid("treatment_id").references(() => patient_treatment_history.id, { onDelete: "cascade" }), 
    medicine_id: uuid("medicine_id").references(() => medicines.id, { onDelete: "set null" }), 
    batch_id: uuid("batch_id").references(() => medicine_batches.id, { onDelete: "set null" }), 
    dosage: text("dosage").notNull(),
});
export const treatment_illnesses = pgTable("treatment_illnesses", {
  id: uuid("id").defaultRandom().primaryKey(), // Added a UUID primary key
  treatment_id: uuid("treatment_id").references(() => patient_treatment_history.id, { onDelete: "cascade" }),
  illness_id: uuid("illness_id").references(() => illnesses.id, { onDelete: "cascade" }),
});



export const staff_family_members = pgTable("staff_family_members", {
    id: uuid("id").defaultRandom().primaryKey(),
    staff_id: uuid("staff_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    name: text("name").notNull(),
    gender: GENDER_ENUM("gender"),
    contact_number: varchar("contact_number", { length: 10 }).unique(), 
    relation: RELATION_ENUM("relation").notNull(),
    date_of_birth: timestamp("date_of_birth"),
    blood_type : BLOOD_GROUP_ENUM('blood_type'),
    is_active: boolean("is_active").default(true),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
});






