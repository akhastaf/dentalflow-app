-- =====================================================
-- TEST DATA GENERATION FOR PAYMENT TESTING (FIXED VERSION)
-- =====================================================
-- This script creates test data covering all payment scenarios
-- Run this directly in your database

-- =====================================================
-- 1. CREATE TEST TENANT (CLINIC)
-- =====================================================
INSERT INTO tenants (
    id, name, slug, phone, email, address, city, 
    "subscriptionPlan", "isActive", language, timezone,
    "createdAt", "updatedAt"
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'Test Dental Clinic',
    'test-clinic',
    '+212612345678',
    'test@dentalclinic.com',
    '123 Test Street, Test City',
    'Casablanca',
    'pro',
    true,
    'fr',
    'Africa/Casablanca',
    NOW(),
    NOW()
);

-- =====================================================
-- 2. CREATE TEST USERS (DOCTORS/STAFF)
-- =====================================================
INSERT INTO users (
    user_id, email, password, first_name, last_name, 
    is_verified, is_active, created_at, updated_at
) VALUES 
-- Doctor 1
(
    '550e8400-e29b-41d4-a716-446655440002',
    'dr.smith@test.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
    'Dr. John',
    'Smith',
    true,
    true,
    NOW(),
    NOW()
),
-- Doctor 2
(
    '550e8400-e29b-41d4-a716-446655440003',
    'dr.jones@test.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Dr. Sarah',
    'Jones',
    true,
    true,
    NOW(),
    NOW()
);

-- =====================================================
-- 3. CREATE STAFF MEMBERSHIPS
-- =====================================================
INSERT INTO staff (
    id, "tenantId", "userId", "isOwner", permissions, role,
    "workingDays", "salaryType", "salaryAmount", status,
    "createdAt", "updatedAt"
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    true,
    ARRAY['all'],
    'admin',
    ARRAY[1,2,3,4,5],
    'fixed',
    15000.00,
    'active',
    NOW(),
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440003',
    false,
    ARRAY['appointments', 'patients', 'treatments'],
    'doctor',
    ARRAY[1,2,3,4,5],
    'fixed',
    12000.00,
    'active',
    NOW(),
    NOW()
);

-- =====================================================
-- 4. CREATE TREATMENT REFERENCES
-- =====================================================
INSERT INTO treatment_references (
    id, name, code, category, description, "defaultPrice", "defaultColor",
    "createdAt", "updatedAt"
) VALUES 
-- Preventive
('550e8400-e29b-41d4-a716-446655440006', 'Dental Cleaning', 'CLEAN', 'Preventive', 'Professional dental cleaning and scaling', 300.00, '#4CAF50', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440007', 'Fluoride Treatment', 'FLUOR', 'Preventive', 'Fluoride application for cavity prevention', 150.00, '#4CAF50', NOW(), NOW()),
-- Restorative
('550e8400-e29b-41d4-a716-446655440008', 'Dental Filling', 'FILL', 'Restorative', 'Composite or amalgam filling', 500.00, '#2196F3', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440009', 'Root Canal', 'RCT', 'Restorative', 'Root canal treatment', 1500.00, '#FF9800', NOW(), NOW()),
-- Surgical
('550e8400-e29b-41d4-a716-446655440010', 'Tooth Extraction', 'EXT', 'Surgical', 'Simple tooth extraction', 800.00, '#F44336', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440011', 'Wisdom Tooth Extraction', 'WISDOM', 'Surgical', 'Complex wisdom tooth extraction', 1200.00, '#F44336', NOW(), NOW()),
-- Cosmetic
('550e8400-e29b-41d4-a716-446655440012', 'Teeth Whitening', 'WHITE', 'Cosmetic', 'Professional teeth whitening', 600.00, '#9C27B0', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440013', 'Dental Veneers', 'VENEER', 'Cosmetic', 'Porcelain veneers', 2000.00, '#9C27B0', NOW(), NOW()),
-- Orthodontic
('550e8400-e29b-41d4-a716-446655440014', 'Braces Installation', 'BRACES', 'Orthodontic', 'Traditional braces installation', 3000.00, '#607D8B', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440015', 'Braces Adjustment', 'ADJUST', 'Orthodontic', 'Monthly braces adjustment', 200.00, '#607D8B', NOW(), NOW());

-- =====================================================
-- 5. CREATE TENANT TREATMENTS
-- =====================================================
INSERT INTO tenant_treatments (
    id, "tenantId", "treatmentRefId", name, code, category, description, price, color, "isActive", "isCustom",
    "createdAt", "updatedAt"
) VALUES 
-- Preventive
('550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006', 'Dental Cleaning', 'CLEAN', 'Preventive', 'Professional dental cleaning and scaling', 300.00, '#4CAF50', true, false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440007', 'Fluoride Treatment', 'FLUOR', 'Preventive', 'Fluoride application for cavity prevention', 150.00, '#4CAF50', true, false, NOW(), NOW()),
-- Restorative
('550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440008', 'Dental Filling', 'FILL', 'Restorative', 'Composite or amalgam filling', 500.00, '#2196F3', true, false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440009', 'Root Canal', 'RCT', 'Restorative', 'Root canal treatment', 1500.00, '#FF9800', true, false, NOW(), NOW()),
-- Surgical
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010', 'Tooth Extraction', 'EXT', 'Surgical', 'Simple tooth extraction', 800.00, '#F44336', true, false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', 'Wisdom Tooth Extraction', 'WISDOM', 'Surgical', 'Complex wisdom tooth extraction', 1200.00, '#F44336', true, false, NOW(), NOW()),
-- Cosmetic
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440012', 'Teeth Whitening', 'WHITE', 'Cosmetic', 'Professional teeth whitening', 600.00, '#9C27B0', true, false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440013', 'Dental Veneers', 'VENEER', 'Cosmetic', 'Porcelain veneers', 2000.00, '#9C27B0', true, false, NOW(), NOW()),
-- Orthodontic
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440014', 'Braces Installation', 'BRACES', 'Orthodontic', 'Traditional braces installation', 3000.00, '#607D8B', true, false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440015', 'Braces Adjustment', 'ADJUST', 'Orthodontic', 'Monthly braces adjustment', 200.00, '#607D8B', true, false, NOW(), NOW());

-- =====================================================
-- 6. CREATE TEST PATIENTS WITH DIFFERENT SCENARIOS
-- =====================================================
INSERT INTO patients (
    id, "tenantId", "fullName", email, phone, address, gender, "birthDate",
    "insuranceProvider", "insuranceNumber", notes, "createdAt", "updatedAt"
) VALUES 
-- Patient 1: Multiple treatments, different statuses, partial payments
(
    '550e8400-e29b-41d4-a716-446655440026',
    '550e8400-e29b-41d4-a716-446655440001',
    'Ahmed Benali',
    'ahmed.benali@email.com',
    '+212612345001',
    '123 Rue Hassan II, Casablanca',
    'male',
    '1985-03-15',
    'CNOPS',
    'CNOPS123456',
    'Patient with multiple treatments in different stages',
    NOW(),
    NOW()
),
-- Patient 2: High-value treatments, no payments yet
(
    '550e8400-e29b-41d4-a716-446655440027',
    '550e8400-e29b-41d4-a716-446655440001',
    'Fatima Zahra',
    'fatima.zahra@email.com',
    '+212612345002',
    '456 Avenue Mohammed V, Rabat',
    'female',
    '1990-07-22',
    'CNSS',
    'CNSS789012',
    'Patient with expensive treatments, needs payment plan',
    NOW(),
    NOW()
),
-- Patient 3: Completed treatments, fully paid
(
    '550e8400-e29b-41d4-a716-446655440028',
    '550e8400-e29b-41d4-a716-446655440001',
    'Mohammed Alami',
    'mohammed.alami@email.com',
    '+212612345003',
    '789 Boulevard Al Massira, Marrakech',
    'male',
    '1978-11-08',
    'Private Insurance',
    'PRIV345678',
    'Patient with completed treatments, good payment history',
    NOW(),
    NOW()
),
-- Patient 4: Cancelled treatments, no payments
(
    '550e8400-e29b-41d4-a716-446655440029',
    '550e8400-e29b-41d4-a716-446655440001',
    'Amina Tazi',
    'amina.tazi@email.com',
    '+212612345004',
    '321 Rue Ibn Batouta, Tangier',
    'female',
    '1995-04-30',
    NULL,
    NULL,
    'Patient with cancelled treatments, no insurance',
    NOW(),
    NOW()
),
-- Patient 5: On-hold treatments, partial payments
(
    '550e8400-e29b-41d4-a716-446655440030',
    '550e8400-e29b-41d4-a716-446655440001',
    'Youssef Idrissi',
    'youssef.idrissi@email.com',
    '+212612345005',
    '654 Avenue Hassan II, Agadir',
    'male',
    '1982-09-14',
    'CNOPS',
    'CNOPS901234',
    'Patient with treatments on hold due to medical condition',
    NOW(),
    NOW()
),
-- Patient 6: Planned treatments, no payments
(
    '550e8400-e29b-41d4-a716-446655440031',
    '550e8400-e29b-41d4-a716-446655440001',
    'Leila Mansouri',
    'leila.mansouri@email.com',
    '+212612345006',
    '987 Rue Al Qods, Fes',
    'female',
    '1988-12-03',
    'CNSS',
    'CNSS567890',
    'Patient with planned treatments, waiting for approval',
    NOW(),
    NOW()
);

-- =====================================================
-- 7. CREATE TREATMENTS WITH DIFFERENT STATUSES AND PAYMENT SCENARIOS
-- =====================================================
INSERT INTO treatments (
    id, "tenantId", "patientId", "doctorId", "tenantTreatmentId",
    status, priority, phase, "toothNumber", diagnosis, "clinicalNotes",
    amount, "amountPaid", "discountAmount", "discountPercentage",
    "plannedDate", "completedDate", "progressPercentage", note,
    "createdAt", "updatedAt"
) VALUES 
-- =====================================================
-- PATIENT 1: Ahmed Benali - Multiple scenarios
-- =====================================================
-- Treatment 1: Planned treatment, no payment
(
    '550e8400-e29b-41d4-a716-446655440032',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440026',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440016',
    'planned',
    'medium',
    'treatment_planning',
    '11',
    'Cavity in upper right central incisor',
    'Patient needs dental cleaning before filling',
    300.00,
    0.00,
    0.00,
    0.00,
    '2024-02-15',
    NULL,
    0,
    'Planned for next month',
    NOW(),
    NOW()
),
-- Treatment 2: In progress treatment, partial payment
(
    '550e8400-e29b-41d4-a716-446655440033',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440026',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440018',
    'in_progress',
    'high',
    'treatment_execution',
    '36',
    'Deep cavity requiring root canal',
    'Root canal in progress, patient paid 50%',
    1500.00,
    750.00,
    0.00,
    0.00,
    '2024-01-20',
    NULL,
    60,
    'Patient made partial payment, remaining 750 MAD',
    NOW(),
    NOW()
),
-- Treatment 3: Completed treatment, fully paid
(
    '550e8400-e29b-41d4-a716-446655440034',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440026',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440020',
    'completed',
    'medium',
    'follow_up',
    '48',
    'Impacted wisdom tooth',
    'Extraction completed successfully',
    800.00,
    800.00,
    0.00,
    0.00,
    '2023-12-10',
    '2023-12-10',
    100,
    'Fully paid and completed',
    NOW(),
    NOW()
),

-- =====================================================
-- PATIENT 2: Fatima Zahra - High-value treatments
-- =====================================================
-- Treatment 4: Planned expensive treatment, no payment
(
    '550e8400-e29b-41d4-a716-446655440035',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440027',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440023',
    'planned',
    'high',
    'treatment_planning',
    '11,12,21,22',
    'Multiple teeth requiring veneers for cosmetic improvement',
    'Patient wants cosmetic improvement, considering payment plan',
    8000.00,
    0.00,
    0.00,
    0.00,
    '2024-03-01',
    NULL,
    0,
    'High-value treatment, needs payment arrangement',
    NOW(),
    NOW()
),
-- Treatment 5: In progress orthodontic treatment, partial payment
(
    '550e8400-e29b-41d4-a716-446655440036',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440027',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440024',
    'in_progress',
    'medium',
    'treatment_execution',
    'All teeth',
    'Malocclusion requiring orthodontic treatment',
    'Braces installed, patient paid initial amount',
    3000.00,
    1000.00,
    0.00,
    0.00,
    '2024-01-15',
    NULL,
    30,
    'Braces installed, monthly payments required',
    NOW(),
    NOW()
),

-- =====================================================
-- PATIENT 3: Mohammed Alami - Completed treatments
-- =====================================================
-- Treatment 6: Completed treatment, fully paid
(
    '550e8400-e29b-41d4-a716-446655440037',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440028',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440018',
    'completed',
    'medium',
    'follow_up',
    '46',
    'Cavity in lower right first molar',
    'Filling completed successfully',
    500.00,
    500.00,
    0.00,
    0.00,
    '2023-11-20',
    '2023-11-20',
    100,
    'Fully paid and completed',
    NOW(),
    NOW()
),
-- Treatment 7: Completed treatment with discount, fully paid
(
    '550e8400-e29b-41d4-a716-446655440038',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440028',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440022',
    'completed',
    'low',
    'follow_up',
    'All teeth',
    'Teeth whitening for cosmetic improvement',
    'Whitening treatment completed with 10% discount',
    600.00,
    540.00,
    60.00,
    10.00,
    '2023-10-15',
    '2023-10-15',
    100,
    'Completed with 10% discount applied',
    NOW(),
    NOW()
),

-- =====================================================
-- PATIENT 4: Amina Tazi - Cancelled treatments
-- =====================================================
-- Treatment 8: Cancelled treatment, no payment
(
    '550e8400-e29b-41d4-a716-446655440039',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440029',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440021',
    'cancelled',
    'medium',
    'treatment_planning',
    '18',
    'Impacted wisdom tooth',
    'Patient cancelled due to financial constraints',
    1200.00,
    0.00,
    0.00,
    0.00,
    '2024-01-10',
    NULL,
    0,
    'Cancelled by patient - financial reasons',
    NOW(),
    NOW()
),

-- =====================================================
-- PATIENT 5: Youssef Idrissi - On-hold treatments
-- =====================================================
-- Treatment 9: On-hold treatment, partial payment
(
    '550e8400-e29b-41d4-a716-446655440040',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440030',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440019',
    'on_hold',
    'high',
    'treatment_execution',
    '26',
    'Root canal treatment',
    'Treatment on hold due to patient medical condition',
    1500.00,
    500.00,
    0.00,
    0.00,
    '2024-01-05',
    NULL,
    40,
    'On hold - patient has medical condition',
    NOW(),
    NOW()
),

-- =====================================================
-- PATIENT 6: Leila Mansouri - Planned treatments
-- =====================================================
-- Treatment 10: Planned treatment, no payment
(
    '550e8400-e29b-41d4-a716-446655440041',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440031',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440017',
    'planned',
    'low',
    'treatment_planning',
    'All teeth',
    'Preventive fluoride treatment',
    'Planned preventive treatment',
    150.00,
    0.00,
    0.00,
    0.00,
    '2024-02-20',
    NULL,
    0,
    'Planned preventive treatment',
    NOW(),
    NOW()
),
-- Treatment 11: Planned treatment with discount, no payment
(
    '550e8400-e29b-41d4-a716-446655440042',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440031',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440025',
    'planned',
    'medium',
    'treatment_planning',
    'All teeth',
    'Braces adjustment',
    'Monthly braces adjustment planned',
    200.00,
    0.00,
    20.00,
    10.00,
    '2024-02-25',
    NULL,
    0,
    'Planned with 10% discount',
    NOW(),
    NOW()
);

-- =====================================================
-- 8. CREATE SOME EXISTING PAYMENTS FOR TESTING
-- =====================================================
INSERT INTO payments (
    id, "patientId", "tenantId", amount, "isPartial", status, "paymentMethod", reference, note,
    "createdAt", "updatedAt"
) VALUES 
-- Payment 1: Partial payment for Ahmed's root canal
(
    '550e8400-e29b-41d4-a716-446655440043',
    '550e8400-e29b-41d4-a716-446655440026',
    '550e8400-e29b-41d4-a716-446655440001',
    750.00,
    true,
    'completed',
    'cash',
    'PAY-2024-001',
    'Partial payment for root canal treatment',
    NOW(),
    NOW()
),
-- Payment 2: Full payment for Mohammed's filling
(
    '550e8400-e29b-41d4-a716-446655440044',
    '550e8400-e29b-41d4-a716-446655440028',
    '550e8400-e29b-41d4-a716-446655440001',
    500.00,
    false,
    'completed',
    'card',
    'PAY-2024-002',
    'Full payment for dental filling',
    NOW(),
    NOW()
),
-- Payment 3: Partial payment for Fatima's braces
(
    '550e8400-e29b-41d4-a716-446655440045',
    '550e8400-e29b-41d4-a716-446655440027',
    '550e8400-e29b-41d4-a716-446655440001',
    1000.00,
    true,
    'completed',
    'bank_transfer',
    'PAY-2024-003',
    'Initial payment for braces installation',
    NOW(),
    NOW()
),
-- Payment 4: Partial payment for Youssef's root canal
(
    '550e8400-e29b-41d4-a716-446655440046',
    '550e8400-e29b-41d4-a716-446655440030',
    '550e8400-e29b-41d4-a716-446655440001',
    500.00,
    true,
    'completed',
    'check',
    'PAY-2024-004',
    'Partial payment before treatment was put on hold',
    NOW(),
    NOW()
);

-- =====================================================
-- 9. CREATE PAYMENT-TREATMENT RELATIONSHIPS
-- =====================================================
INSERT INTO payment_treatments (
    id, "paymentId", "treatmentId", "amountPaid", "createdAt"
) VALUES 
-- Payment 1 -> Treatment 2 (Ahmed's root canal)
(
    '550e8400-e29b-41d4-a716-446655440047',
    '550e8400-e29b-41d4-a716-446655440043',
    '550e8400-e29b-41d4-a716-446655440033',
    750.00,
    NOW()
),
-- Payment 2 -> Treatment 6 (Mohammed's filling)
(
    '550e8400-e29b-41d4-a716-446655440048',
    '550e8400-e29b-41d4-a716-446655440044',
    '550e8400-e29b-41d4-a716-446655440037',
    500.00,
    NOW()
),
-- Payment 3 -> Treatment 5 (Fatima's braces)
(
    '550e8400-e29b-41d4-a716-446655440049',
    '550e8400-e29b-41d4-a716-446655440045',
    '550e8400-e29b-41d4-a716-446655440036',
    1000.00,
    NOW()
),
-- Payment 4 -> Treatment 9 (Youssef's root canal)
(
    '550e8400-e29b-41d4-a716-446655440050',
    '550e8400-e29b-41d4-a716-446655440046',
    '550e8400-e29b-41d4-a716-446655440040',
    500.00,
    NOW()
);

-- =====================================================
-- SUMMARY OF TEST DATA CREATED
-- =====================================================
/*
TEST SCENARIOS COVERED:

1. PATIENT 1 (Ahmed Benali):
   - Planned treatment: Dental Cleaning (300 MAD, 0 paid)
   - In-progress treatment: Root Canal (1500 MAD, 750 paid)
   - Completed treatment: Tooth Extraction (800 MAD, 800 paid)

2. PATIENT 2 (Fatima Zahra):
   - Planned treatment: Veneers (8000 MAD, 0 paid) - High value
   - In-progress treatment: Braces (3000 MAD, 1000 paid)

3. PATIENT 3 (Mohammed Alami):
   - Completed treatment: Filling (500 MAD, 500 paid)
   - Completed treatment: Whitening with discount (600 MAD, 540 paid)

4. PATIENT 4 (Amina Tazi):
   - Cancelled treatment: Wisdom tooth extraction (1200 MAD, 0 paid)

5. PATIENT 5 (Youssef Idrissi):
   - On-hold treatment: Root canal (1500 MAD, 500 paid)

6. PATIENT 6 (Leila Mansouri):
   - Planned treatment: Fluoride (150 MAD, 0 paid)
   - Planned treatment: Braces adjustment with discount (200 MAD, 0 paid)

PAYMENT TESTING SCENARIOS:
✅ Patients with no payments (Leila, Amina)
✅ Patients with partial payments (Ahmed, Fatima, Youssef)
✅ Patients with full payments (Mohammed)
✅ High-value treatments (Fatima's veneers)
✅ Treatments with discounts (Mohammed's whitening, Leila's adjustment)
✅ Different treatment statuses (planned, in_progress, completed, cancelled, on_hold)
✅ Different payment methods (cash, card, bank_transfer, check)
✅ Multiple treatments per patient
✅ Treatments with different priorities and phases
✅ Treatments with tooth numbers and clinical notes

This covers all the scenarios needed for comprehensive payment testing!
*/